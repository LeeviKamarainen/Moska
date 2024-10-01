
const fs = require('fs');

const lobbies = [
    { id: 1, name: 'Lobby 1', currentPlayers: [], host: undefined, gameInProgress: false },
    { id: 2, name: 'Lobby 2', currentPlayers: [], host: undefined, gameInProgress: false },
    { id: 3, name: 'Lobby 3', currentPlayers: [], host: undefined, gameInProgress: false },
    { id: 4, name: 'Lobby 4', currentPlayers: [], host: undefined, gameInProgress: false },
    { id: 5, name: 'Lobby 5', currentPlayers: [], host: undefined, gameInProgress: false }
];


function lobbyManager(socket,io) {

    socket.on("joinPage", (data, callback) => {
        socket.join(data.page);
        // Return all the usernames in the lobby page:
        let users = io.sockets.adapter.rooms.get(data.page);
        let online_users = [];
        if (users) {
            users.forEach(user => {
                let username = io.sockets.sockets.get(user).decoded.username;
                // Check if the username already exists in the online_users array
                let exists = online_users.some(existingUser => existingUser.name === username);
                if (!exists) {
                    let details = {"name":io.sockets.sockets.get(user).decoded.username, "isActive":true};
                    online_users.push(details);
                }
            });
        }
        callback({ "users": online_users });
        io.to(data.page).emit("updateOnlineUsers", { "users": online_users });
        console.log("Joined page " + data.page);
    });

    socket.on("leavePage", (data, callback) => {
        socket.leave(data.page);
        console.log("Left page " + data.page);
    });

    socket.on("getLobbies", (data, callback) => {
        // Check if there is mismatch in currentPlayers and gameInProgress
        lobbies.forEach(lobby => {
            if (lobby.currentPlayers.length == 0 && lobby.gameInProgress) {
                lobby.gameInProgress = false;
            }
        });
        // Check if the user is already connected to a lobby, if so, redirect them to that lobby
        let lobbyIndex = checkIfConnectedToLobby(socket.decoded.username);
        socket.join('global');
        if (lobbyIndex != -1) {
            socket.join(lobbies[lobbyIndex].id);
        }
        callback({ "lobbies": lobbies, "connectedLobby": lobbyIndex, "username": socket.decoded.username });
    })

    socket.on("createLobby", (data, callback) => {
        if (lobbies.length <= 7) {
            data.host = socket.decoded.username;
            lobbies.push(data);
            callback({ "response": "success", "host": socket.decoded.username });
        } else {
            callback({ "response": "Too many lobbies." });
        }
    });


    socket.on('disconnect', () => {
        // Check if the user is connected to a lobby, if so, start a timer to check if they reconnect
       /* let lobbyIndex = checkIfConnectedToLobby(socket.decoded.username);
        if (lobbyIndex != -1) {
            setTimeout(() => {
                if (!socket.connected) {
                    lobbies[lobbyIndex].currentPlayers.splice(lobbies[lobbyIndex].currentPlayers.indexOf(socket.decoded.username), 1);
                    socket.leave(lobbies[lobbyIndex].id);
                }
            }, 10000);
        }*/
    });

    socket.on("updateLobby", (data) => {
		// When client requests an update to the lobby, send it to the public room
		socket.to("lobby").emit("updateLobbyForAll",{"lobbies":lobbies, "username":socket.decoded.username});
        socket.emit("updateLobbyChat", { "lobbies": lobbies, "username": socket.decoded.username });
		console.log("Lobby update requested.")
	})

    socket.on("joinLobby", (data, callback) => {
        let lobbyIndex = findLobbyIndexById(data);

        let connectedLobbyIndex = checkIfConnectedToLobby(socket.decoded.username);

        if (connectedLobbyIndex != -1) {
            lobbies[connectedLobbyIndex].currentPlayers.splice(lobbies[connectedLobbyIndex].currentPlayers.indexOf(socket.decoded.username), 1);
            // If the host leaves the lobby, assign a new host to the lobby
            socket.leave(lobbies[connectedLobbyIndex].id);
            if (lobbies[connectedLobbyIndex].host == socket.decoded.username) {
                lobbies[connectedLobbyIndex].host = lobbies[connectedLobbyIndex].currentPlayers[0] ? lobbies[connectedLobbyIndex].currentPlayers[0] : undefined;
            }
        }

        if (lobbyIndex == -1) {
            callback({ "response": "Lobby not found." });
        }
        else if (lobbies[lobbyIndex].currentPlayers.length >= 4) {
            callback({ "response": "Lobby is full." });
        }

        else if (findBotPlayers(socket.decoded.username)) {
            callback({ "response": "You cannot join as anonymous player, please login!" });
        }
        else {
            lobbies[lobbyIndex].currentPlayers.push(socket.decoded.username);
            if (lobbies[lobbyIndex].currentPlayers.length == 1) {
                lobbies[lobbyIndex].host = socket.decoded.username;
                console.log(lobbies[lobbyIndex].host);
            }
            socket.join("room"+lobbies[lobbyIndex].id);
            callback({ "response": "success", "newLobby": lobbies[lobbyIndex], "username": socket.decoded.username });
        }
    })

    socket.on("leaveLobby", (data, callback) => {
        let connectedLobbyIndex = checkIfConnectedToLobby(socket.decoded.username);
        if (connectedLobbyIndex == -1) {
            callback({ "response": "You are not connected to any lobby." });
        } else {
            lobbies[connectedLobbyIndex].currentPlayers.splice(lobbies[connectedLobbyIndex].currentPlayers.indexOf(socket.decoded.username), 1);
            // If the host leaves the lobby, assign a new host to the lobby
            socket.leave("room"+lobbies[connectedLobbyIndex].id);
            if (lobbies[connectedLobbyIndex].host == socket.decoded.username) {
                lobbies[connectedLobbyIndex].host = lobbies[connectedLobbyIndex].currentPlayers[0] ? lobbies[connectedLobbyIndex].currentPlayers[0] : undefined;
            }
            socket.to("lobby").emit("updateLobbyForAll",{"lobbies":lobbies, "username":socket.decoded.username});
            socket.emit("updateLobbyForAll",{"lobbies":lobbies, "username":socket.decoded.username});
            callback({ "response": "success", "newLobby": lobbies[connectedLobbyIndex] });
        }
    })

    socket.on("getCurrentLobby", (data, callback) => {
        let currentLobbyIndex = checkIfConnectedToLobby(socket.decoded.username);
        if (currentLobbyIndex == -1) {
            callback({ "response": "Lobby not found.", "currentLobby": "global" });
        } else {
            callback({ "response": "success", "currentLobby": lobbies[currentLobbyIndex] });
        }
    })
}

function findLobbyIndexById(id) {
    return lobbies.findIndex(lobby => lobby.id == id);
}

function findBotPlayers(username) {
    const parsedName = username.match(/^(.*?)(\d)/);
    if (parsedName == null) return false;
    if (parsedName[1] == "Anonymous") {
        return true;
    }
    return false;
}

function checkIfConnectedToLobby(username) {
    return lobbies.findIndex(lobby => lobby.currentPlayers.includes(username));
}

function getPlayersInLobby(lobbyId) {
    const lobby = lobbies.find(lobby => lobby.id == lobbyId);
    return lobby.currentPlayers;
}

module.exports = { lobbyManager, checkIfConnectedToLobby, lobbies };
