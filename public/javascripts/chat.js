var socket = socketManager.getInstance();

if (document.readyState !== "loading") {
	populateChatHistory();
} else {
	document.addEventListener("DOMContentLoaded", function () {
		populateChatHistory();
	});
}

/**
 * Toggles the visibility of the chat body when the chat header is clicked.
 *
 * @param {Event} e - The event object triggered by the click event.
 */
function resizeChat(e) {
	/*if (e.target.id == "chat-header") {
		var chatBody = document.getElementById('chat-body');
		chatBody.style.display = (chatBody.style.display === 'none' || chatBody.style.display === '') ? 'block' : 'none';
	}*/
	var chatBody = document.getElementById('chat-box');

	e.preventDefault();
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResize);
    
    // Store the initial position of the cursor and element
    const initialX = e.clientX;
    const initialY = e.clientY;
    const initialWidth = chatBody.offsetWidth;
    const initialHeight = chatBody.offsetHeight;
    const initialLeft = chatBody.getBoundingClientRect().left;
    const initialTop = chatBody.getBoundingClientRect().top;

    function resize(e) {
        const dx = initialX - e.clientX; // Change in X (inverse)
        const dy = initialY - e.clientY; // Change in Y (inverse)

        chatBody.style.width = initialWidth + dx + 'px';
        chatBody.style.height = initialHeight + dy + 'px';

        // Adjust the position of the element
        chatBody.style.left = initialLeft - dx + 'px';
        chatBody.style.top = initialTop - dy + 'px';
    }

    function stopResize() {
        window.removeEventListener('mousemove', resize);
        window.removeEventListener('mouseup', stopResize);
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
	var chatMessage = { message: message, chatType: chatType, lobbyId: currentLobby.id };

	inputElement.value = '';
	if (message !== '') {
		socket.emit('chatmessage', chatMessage);
	}
}

function switchChatType(chatType) {
	socket.off("newChatMessage");
	socket.off("chatHistory")
	populateChatHistory();
}

/**
 * Asynchronously populates the chat history in the chat body element.
 * Clears the current chat body content and fetches the chat history based on the selected chat type (global or lobby).
 * Listens for incoming chat history and new chat messages from the server and updates the chat body accordingly.
 *
 * @async
 * @function populateChatHistory
 * @returns {Promise<void>} A promise that resolves when the chat history is populated.
 */
async function populateChatHistory() {
	var chatBody = document.getElementById('chat-body');
	chatBody.innerHTML = '';
	let currentLobby = { lobbyId: 'global' };
	// Check if user is connected to lobby, if not, set chat type to global and hide lobby chat radio
	const lobbyChatRadio = document.getElementById('lobby-chat');
	const lobbyChatLabel = document.getElementById('lobby-chat-label');
	const globalChatRadio = document.getElementById('global-chat');
	const chatInput = document.getElementById('chat-input');
	if(chatInput.getAttribute("chat-enter-press") == null){
		chatInput.setAttribute("chat-enter-press", "true");
		chatInput.addEventListener('keypress', function (e) {
			if (e.key === 'Enter') {
				sendMessage();
			}
		});
	}
	let chatType = 'global';
	if (lobbyChatRadio.checked) {
		chatType = 'lobby';
	}
	// Check if the player is in lobby
	currentLobby = await getCurrentLobby();
	if(currentLobby == 'global') {
		console.log("In global lobby")
		lobbyChatRadio.style.visibility = 'hidden';
		lobbyChatLabel.style.visibility = 'hidden';
		globalChatRadio.checked = true;
	}
	socket.emit("chatHistory", currentLobby);

	socket.on("chatHistory", function (data) {
		if (data != "") {
			let chatHistory = JSON.parse(data);
			for (var i = 0; i < chatHistory.length; i++) {
				if (chatHistory[i].chatType == chatType) {
					var messageElement = document.createElement('p');
					messageElement.innerHTML = "<b><i>" + chatHistory[i].username + "</i></b>: " + chatHistory[i].message;
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
		if (newMessage.chatType == chatType) {
			var messageElement = document.createElement('p');
			messageElement.innerHTML = "<b><i>" + newMessage.username + "</i></b>: " + newMessage.message;
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

	socket.on('updateLobbyChat', (data) => {
		console.log("Lobby update received for chat.");
		lobbyChatRadio.style.visibility = 'visible';
		lobbyChatLabel.style.visibility = 'visible';
	 });
}

/**
 * Retrieves the current lobby information.
 * 
 * This function emits a "getCurrentLobby" event to the server and waits for the response.
 * If the response indicates success, it resolves with the current lobby data.
 * 
 * @returns {Promise<Object>} A promise that resolves to the current lobby data.
 */
async function getCurrentLobby() {
	return await new Promise((resolve, reject) => {
		socket.emit("getCurrentLobby", {}, (data) => {
			if (data.response == "success") {
				resolve(data.currentLobby);
			}
			else {
				resolve(data.currentLobby);
			}
		})
	});
}