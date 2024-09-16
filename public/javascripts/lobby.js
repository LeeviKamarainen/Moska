

if (document.readyState !== "loading") {
    initializeLobby();
} else {
    document.addEventListener("DOMContentLoaded", function () {
        initializeLobby();
    });
}

/**
 * Initializes the lobby by setting up the socket connection, fetching lobby data,
 * and populating the lobby list in the UI. Also sets up the event listener for the
 * "Create Lobby" button.
 *
 * @async
 * @function initializeLobby
 * @returns {Promise<void>} A promise that resolves when the lobby is initialized.
 */
async function initializeLobby() {
    var socket = socketManager.getInstance();
    socket.emit('joinPage', { page: 'lobby' });
    // Sample lobby data
    let lobbies = [];
    var username;
    await new Promise(resolve => {
        socket.emit('userDetails', {}, (data) => {
        username = data.username;
        resolve();
    });
    });
    socket.emit('getLobbies', {}, (data) => {
        lobbydata = data;
        lobbies = data.lobbies;
        // Populate lobby list
        const lobbyList = document.getElementById('lobbyList');
        lobbyList.innerHTML = '';
        lobbies.forEach(lobby => {
            const listItem = document.createElement('li');
            listItem.textContent = `${lobby.name} - Current Players: ${lobby.currentPlayers.length}`;
            listItem.addEventListener('click', () => showCurrentLobby(lobby));
            listItem.setAttribute('lobbyid', lobby.id);
            lobbyList.appendChild(listItem);
        });
    });
    socket.on('updateLobbyForAll', (data) => {
        console.log("Lobby update received.");
        lobbies = data.lobbies;
        lobbyList.innerHTML = '';
        lobbies.forEach(lobby => {
            const listItem = document.createElement('li');
            listItem.textContent = `${lobby.name} - Current Players: ${lobby.currentPlayers.length}`;
            listItem.addEventListener('click', () => showCurrentLobby(lobby));
            listItem.setAttribute('lobbyid', lobby.id);
            lobbyList.appendChild(listItem);
        });
        showCurrentLobby(lobbies.find(lobby => lobby.currentPlayers.includes(username)));
    });

    socket.on('multiplayerStartGame', () => {
        startGame();
    })
        // Create Lobby button
        //const createLobbyBtn = document.getElementById('createLobbyBtn');
        //createLobbyBtn.addEventListener('click', createLobby);
};

async function showCurrentLobby(lobby) {
    // Check current user's username from server
    var username;
    await new Promise(resolve => {
        socket.emit('userDetails', {}, (data) => {
        username = data.username;
        resolve();
    });
    });
    console.log(lobby)
    console.log(username)
    const currentLobbyContainer = document.getElementById('currentLobby');
    currentLobbyContainerString = `<p><strong>Lobby Name:</strong> ${lobby.name}</p>
                                       <p><strong>Current Players:</strong> ${lobby.currentPlayers.map(player => `<p>${player}</p>`).join('')}</p>
                                       <p><strong>Host:</strong> ${lobby.host}</p>
                                       `;
    // If the user is already in the lobby, show the leave lobby button, otherwise show the join lobby button
    if (lobby.currentPlayers.includes(username) && lobby.gameInProgress == false) {
        currentLobbyContainerString += `<button id="leaveLobbyBtn" onclick=leaveLobby(${lobby.id})>Leave Lobby</button>`;
        } 
    else if(lobby.gameInProgress == true && lobby.currentPlayers.includes(username)) {
        currentLobbyContainerString += `<button id="reconnectGameBtn" onclick=multiplayerReconnect(${lobby.id})>Reconnect</button>`;
    }
    else if(lobby.gameInProgress == false) {
        currentLobbyContainerString += `<button id="joinLobbyBtn" onclick=joinLobby(${lobby.id})>Join Lobby</button>`;
    } 
    else {
        currentLobbyContainerString += `<p>Game in progress.</p>`;
    }
    // If the user is the host, show the start game button
    if (lobby.host === username && lobby.host !== undefined && lobby.currentPlayers.length > 1) {
        console.log("Host is " + lobby.host);
        console.log("Username is " + username);
        currentLobbyContainerString += `<button id="startGameBtn" onclick=hostStartGame(${lobby.id})>Start Game</button>`;
    }
    currentLobbyContainer.innerHTML = currentLobbyContainerString;

    
}

function hostStartGame() {
    fetch('/startgame')
			.then(response => response.text())
			.then(updatedHTML => {
				// Replace the existing HTML with the updated HTML
				document.open();
				document.write(updatedHTML);
				document.gameStart = "multiplayergameStart";
				document.close();
			});
}

function startGame() {
    fetch('/startgame')
    .then(response => response.text())
    .then(updatedHTML => {
        // Replace the existing HTML with the updated HTML
        document.open();
        document.write(updatedHTML);
        document.close();
    });
}

function multiplayerReconnect() {
    fetch('/startgame')
			.then(response => response.text())
			.then(updatedHTML => {
				// Replace the existing HTML with the updated HTML
				document.open();
				document.write(updatedHTML);
				document.gameStart = "multiplayerReconnect";
				document.close();
			});
}


function createLobby() {
    const lobbyNameInput = document.getElementById('lobbyNameInput');
    const lobbyName = lobbyNameInput.value.trim();

    if (lobbyName !== '') {
        const newLobby = { id: Date.now(), name: lobbyName, currentPlayers: [] };
        socket.emit("createLobby", newLobby, (data) => {
            if (data.response == "success") {
                newLobby.host = data.host;
                const listItem = document.createElement('li');
                listItem.textContent = `${newLobby.name} - Current Players: ${newLobby.currentPlayers}`;
                listItem.addEventListener('click', () => showCurrentLobby(newLobby));
                listItem.setAttribute('lobbyid', newLobby.id);
                document.getElementById('lobbyList').appendChild(listItem);
                joinLobby(newLobby.id);
            } else {
                alert(data.response);
            }
        });
        lobbyNameInput.value = '';
    }
}

function joinLobby(lobby) {
    socket.emit("joinLobby", lobby, (data) => {
        if (data.response == "success") {
            initializeLobby();
            socket.emit("updateLobby");
            showCurrentLobby(data.newLobby, data.username);
        } else {
            alert(data.response);
        }
    });
}

function leaveLobby(lobby) {
    socket.emit("leaveLobby", lobby, (data) => {
        if (data.response == "success") {
            showCurrentLobby(data.newLobby);
        } else {
            alert(data.response);
        }
    });
}

// Handle page unload to leave the room
window.addEventListener('beforeunload', () => {
    socket.emit('leavePage', { page: 'lobby' });
    console.log("Left lobby page.")
});