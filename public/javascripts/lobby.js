

if (document.readyState !== "loading") {
    initializeLobby();
  } else {
    document.addEventListener("DOMContentLoaded", function () {
        initializeLobby();
    });
  }

  async function  initializeLobby() {
    var socket = socketManager.getInstance();
    // Sample lobby data
    let lobbies = [
    ];
    socket.emit('getLobbies',{}, (data) => {
        console.log(data);
        lobbydata = data;
        lobbies = data.lobbies;
        // Populate lobby list
        console.log(lobbies)
        const lobbyList = document.getElementById('lobbyList');
        lobbyList.innerHTML = '';
        lobbies.forEach(lobby => {
            const listItem = document.createElement('li');
            listItem.textContent = `${lobby.name} - Current Players: ${lobby.currentPlayers.length}`;
            listItem.addEventListener('click', () => showCurrentLobby(lobby));
            listItem.setAttribute('lobbyid', lobby.id);
            lobbyList.appendChild(listItem);
            });

        // Create Lobby button
        const createLobbyBtn = document.getElementById('createLobbyBtn');
        createLobbyBtn.addEventListener('click', createLobby);
    });
};

function showCurrentLobby(lobby) {
    const currentLobbyContainer = document.getElementById('currentLobby');
    currentLobbyContainer.innerHTML = `<p><strong>Lobby Name:</strong> ${lobby.name}</p>
                                       <p><strong>Current Players:</strong> ${lobby.currentPlayers.map(player => `<p>${player}</p>`).join('')}</p>
                                       <p><strong>Host:</strong> ${lobby.host}</p>
                                       <button id="joinLobbyBtn" onclick=joinLobby(${lobby.id})>Join Lobby</button>`;
}

function createLobby() {
    const lobbyNameInput = document.getElementById('lobbyNameInput');
    const lobbyName = lobbyNameInput.value.trim();
    
    if (lobbyName !== '') {
        const newLobby = { id: Date.now(), name: lobbyName, currentPlayers: []};
        console.log(newLobby)
        socket.emit("createLobby",newLobby , (data) => {
            if(data.response == "success") {
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
    console.log(lobby)
    socket.emit("joinLobby",lobby, (data) => {
        if(data.response == "success") {
            initializeLobby();
            showCurrentLobby(data.newLobby);
        } else {
            alert(data.response);
        }
    });
}