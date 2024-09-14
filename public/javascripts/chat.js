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
function toggleChat(e) {
	if (e.target.id == "chat-header") {
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
	const lobbyChatRadio = document.getElementById('lobby-chat');
	const globalChatRadio = document.getElementById('global-chat');
	let chatType = 'global';
	if (lobbyChatRadio.checked) {
		chatType = 'lobby';
	}
	// Check if the player is in lobby
	currentLobby = await getCurrentLobby();
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