

const lobbies = [
    { id: 1, name: 'Lobby 1', currentPlayers: [] },
    { id: 2, name: 'Lobby 2', currentPlayers: []},
    { id: 3, name: 'Lobby 3', currentPlayers: []}
];


function lobbyManager(socket) {
    
    socket.on("getLobbies",(data,callback) => {
        // Check if the user is already connected to a lobby, if so, redirect them to that lobby
        let lobbyIndex = checkIfConnectedToLobby(socket.decoded.username);
        socket.join('global');
        if(lobbyIndex != -1) {
            socket.join(lobbies[lobbyIndex].id);
        }
        console.log(socket);
        callback({"lobbies":lobbies,"connectedLobby":lobbyIndex});
    })

    socket.on("createLobby",(data,callback) => {
        console.log(data);
        console.log(callback)
        console.log(lobbies)
        if(lobbies.length <= 7) {
            data.host = socket.decoded.username;
            lobbies.push(data);
            callback({"response":"success","host":socket.decoded.username});
        } else {
            callback({"response":"Too many lobbies."});
        }
    });
    

    socket.on('disconnect', () => {
        // Check if the user is connected to a lobby, if so, start a timer to check if they reconnect
        let lobbyIndex = checkIfConnectedToLobby(socket.decoded.username);
        if(lobbyIndex != -1) {
            setTimeout(() => {
                if(!socket.connected) {
                    lobbies[lobbyIndex].currentPlayers.splice(lobbies[lobbyIndex].currentPlayers.indexOf(socket.decoded.username),1);
                    socket.leave(lobbies[lobbyIndex].id);
                }
            }, 10000);
        }
    });
    
    socket.on("joinLobby",(data,callback) => {
        let lobbyIndex = findLobbyIndexById(data);

        let connectedLobbyIndex = checkIfConnectedToLobby(socket.decoded.username);

        if(connectedLobbyIndex != -1) {
            lobbies[connectedLobbyIndex].currentPlayers.splice(lobbies[connectedLobbyIndex].currentPlayers.indexOf(socket.decoded.username),1);
            socket.leave(lobbies[connectedLobbyIndex].id);
        }

        if(lobbyIndex == -1) {
            callback({"response":"Lobby not found."});
        }
        else if(lobbies[lobbyIndex].currentPlayers.length >= 4) {
            callback({"response":"Lobby is full."});
        }
        
        else if(findBotPlayers(socket.decoded.username)) {
            callback({"response":"You cannot join as anonymous player, please login!"});
        }
        else {
            lobbies[lobbyIndex].currentPlayers.push(socket.decoded.username);
            socket.join(data);
            console.log(socket);
            callback({"response":"success","newLobby":lobbies[lobbyIndex]});
        }
    })

    socket.on("getCurrentLobby",(data,callback) => {
        let currentLobbyIndex = checkIfConnectedToLobby(socket.decoded.username);
        if(currentLobbyIndex == -1) {
            callback({"response":"Lobby not found.","currentLobby":"global"});
        } else {
            callback({"response":"success","currentLobby":lobbies[currentLobbyIndex]});
        }
    })
}

function findLobbyIndexById(id) {
    return lobbies.findIndex(lobby => lobby.id == id);
}

function findBotPlayers(username) {
    const parsedName = username.match(/^(.*?)(\d)/);
    if(parsedName==null) return false;
    if(parsedName[1] == "Anonymous") {
        return true;
    }
    return false;
}

function checkIfConnectedToLobby(username) {
    return lobbies.findIndex(lobby => lobby.currentPlayers.includes(username));
}


module.exports = {lobbyManager};
