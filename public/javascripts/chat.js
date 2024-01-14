var socket = socketManager.getInstance();

if (document.readyState !== "loading") {
    populateChatHistory();
  } else {
    document.addEventListener("DOMContentLoaded", function () {
        populateChatHistory();
    });
  }
function toggleChat(e) {
    if(e.target.id == "chat-header") {
        var chatBody = document.getElementById('chat-body');
        chatBody.style.display = (chatBody.style.display === 'none' || chatBody.style.display === '') ? 'block' : 'none';
    }
}

async function sendMessage() {
    var inputElement = document.getElementById('chat-input');
    const lobbyChatRadio = document.getElementById('lobby-chat');
    let chatType = 'global';
    if (lobbyChatRadio.checked) {
        chatType = 'lobby';
    }
    var message = inputElement.value.trim();
    let currentLobby = await getCurrentLobby();
    var chatMessage = {message: message, chatType: chatType, lobbyId: currentLobby.id};
    
    console.log(chatMessage)
    inputElement.value = '';
    if (message !== '') {
        socket.emit('chatmessage',chatMessage);
    }
}

function switchChatType(chatType) {
    socket.off("newChatMessage");
    socket.off("chatHistory")
    populateChatHistory();
  }

async function populateChatHistory() {
    var chatBody = document.getElementById('chat-body');
    chatBody.innerHTML = '';
    let currentLobby = {lobbyId: 'global'};
    const lobbyChatRadio = document.getElementById('lobby-chat');
    const globalChatRadio = document.getElementById('global-chat');
    let chatType = 'global';
    if (lobbyChatRadio.checked) {
        chatType = 'lobby';
    }
    // Check if the player is in lobby
    currentLobby = await getCurrentLobby();
    socket.emit("chatHistory",currentLobby);

    socket.on("chatHistory", function (data) {
        if(data!="") {
            let chatHistory = JSON.parse(data);
            for (var i = 0; i < chatHistory.length; i++) {
                if(chatHistory[i].chatType == chatType) {
                    var messageElement = document.createElement('p');
                    messageElement.innerHTML = "<b><i>"+chatHistory[i].username+"</i></b>: "+chatHistory[i].message;
                    messageElement.className = 'message';
                    // Create a span element for the timestamp
                    var timestampElement = document.createElement('span');
                    timestampElement.className = 'timestamp';
                    timestampElement.textContent = chatHistory[i].time;
                    // Append timestamp span to the message element
                    messageElement.appendChild(timestampElement);
                    chatBody.appendChild(messageElement);
                }
            }
            chatBody.scrollTop = chatBody.scrollHeight;
        }
     })

    socket.on("newChatMessage", function (data) {
        let newMessage = JSON.parse(data);
        const lobbyChatRadio = document.getElementById('lobby-chat');
        let chatType = 'global';
        if (lobbyChatRadio.checked) {
            chatType = 'lobby';
        }
        console.log(newMessage);
        if(newMessage.chatType == chatType) {
            var messageElement = document.createElement('p');
            messageElement.innerHTML = "<b><i>"+newMessage.username+"</i></b>: "+newMessage.message;
            messageElement.className = 'message';

            var timestampElement = document.createElement('span');
            timestampElement.className = 'timestamp';
            timestampElement.textContent = newMessage.time;
            // Append timestamp span to the message element
            messageElement.appendChild(timestampElement);
            chatBody.appendChild(messageElement);
            chatBody.scrollTop = chatBody.scrollHeight;
        }
     })
}

async function getCurrentLobby() {
    return await new Promise((resolve,reject) => {
        socket.emit("getCurrentLobby",{}, (data) => {
            if(data.response == "success") {
                resolve(data.currentLobby);
            }
            else {
                resolve(data.currentLobby);
            }
     })
    });
}