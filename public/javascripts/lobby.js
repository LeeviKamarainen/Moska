

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

        socket.on('updateLobbyForAll', (data) => {
            console.log("Lobby update received.");
            lobbies = data.lobbies;
            username = data.username;
            lobbyList.innerHTML = '';
            lobbies.forEach(lobby => {
                const listItem = document.createElement('li');
                listItem.textContent = `${lobby.name} - Current Players: ${lobby.currentPlayers.length}`;
                listItem.addEventListener('click', () => showCurrentLobby(lobby));
                listItem.setAttribute('lobbyid', lobby.id);
                lobbyList.appendChild(listItem);
            });
            showCurrentLobby(lobbies.find(lobby => lobby.currentPlayers.includes(username)), username);
        });

        socket.on('multiplayerStartGame', () => {
            startGame();
        })
        // Create Lobby button
        //const createLobbyBtn = document.getElementById('createLobbyBtn');
        //createLobbyBtn.addEventListener('click', createLobby);
    });
};

function showCurrentLobby(lobby, username) {
    const currentLobbyContainer = document.getElementById('currentLobby');
    currentLobbyContainerString = `<p><strong>Lobby Name:</strong> ${lobby.name}</p>
                                       <p><strong>Current Players:</strong> ${lobby.currentPlayers.map(player => `<p>${player}</p>`).join('')}</p>
                                       <p><strong>Host:</strong> ${lobby.host}</p>
                                       <button id="joinLobbyBtn" onclick=joinLobby(${lobby.id})>Join Lobby</button>
                                       `;
    // If the user is the host, show the start game button
    if (lobby.host === username && lobby.host !== undefined) {
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

// Handle page unload to leave the room
window.addEventListener('beforeunload', () => {
    socket.emit('leavePage', { page: 'lobby' });
    console.log("Left lobby page.")
});