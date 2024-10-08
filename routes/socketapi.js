var express = require('express');
var router = express.Router();
var path = require('path')
const io = require("socket.io")();
const { spawn, exec } = require('child_process');
const jwt = require('jsonwebtoken');
const { use } = require('./users');
const fetch = require('node-fetch');
const socketapi = {
	io: io
};
const fs = require('fs');
const { lobbyManager, checkIfConnectedToLobby, lobbies } = require('./lobbyapi');
const { time } = require('console');
let gameIndex = 0;
let gameStringIndex = 2;
let dataArrived;
let gameStates = [];
let gameProgress = [];
const userTimers = {};
const usersAndGames = new Map();
const usersAndStateAndProgress = new Map();

io.use(function (socket, next) {
	// Check if the user has a valid token. If not, then use default credentials.
	// if the socket is authenticated, then we continue with the connection
	if (socket.handshake.query && socket.handshake.query.token) {
		jwt.verify(socket.handshake.query.token, process.env.SECRET, (err, user) => {
			if (err) {
				console.log("Token verification failed. Using default credentials.")
				// username is 'Anonymous' + <random number between 1 and 1000>
				let username = 'Anonymous' + Math.floor(Math.random() * 100000);
				user = {
					username: username,
				};
			}
			socket.decoded = user;
			socket.emit('userDetails', user);
			gameIndex = getNextGameIndex(socket.decoded.username);
			next();
		})
	}
	else {
		console.log(socket.handshake.query)
		console.log("Authentication error!")
		next(new Error('Authentication error'));
	}
})

io.on("connection", function (socket) {

	// Check if the user is connected to a lobby, if so, add them back in to the lobby
	let lobbyIndex = checkIfConnectedToLobby(socket.decoded.username);
	if (lobbyIndex != -1) {
		// Check if user reconnected in time:
		socket.join("room"+lobbies[lobbyIndex].id);
	}
	if(userTimers[socket.decoded.username]) {
		for (let key in userTimers) {
			// If the user reconnected in time, clear the timer:
			if(key == socket.decoded.username) {
				clearTimeout(userTimers[key]);
				delete userTimers[key];
				console.log("User "+socket.decoded.username+" reconnected in time.")
			}
		}
	}
	// Send socket to the lobby manager:
	lobbyManager(socket,io);
	socket.on("gameaction", (data) => {
		// When the client sends a game action, send it to the python program.
		let actionJson = JSON.parse(data);
		// Find the correct python program corresponding to the user
		let lobbyIndex = checkIfConnectedToLobby(socket.decoded.username);
		let pythonProg;
		if(lobbyIndex === -1) {
		pythonProg = usersAndGames.get(socket.decoded.username);
		} else {
			let lobbyId = lobbies[lobbyIndex].id;
			pythonProg = usersAndGames.get(lobbyId);
		}
		if (pythonProg != null) {
			pythonProg.stdin.write(actionJson.action + "\n");
		}
		else {
			console.log("Game Program has shut down. Please restart.")
		}
	})

	socket.on("userDetails", (data, callback) => {
		// When the client requests the user details, send it to the client.
		callback(socket.decoded);
	})

	socket.on("pingSocket", (data) => {
		let lastValues = returnLastStateAndProgress(socket);
		socket.emit('data', { "gamestates": lastValues.lastState, "gameprogress": lastValues.lastProgress, "gameindex": gameIndex, "dataArrived": dataArrived, "gamestringindex": gameStringIndex, "currentUser": socket.decoded }, 1000)
	})

	socket.on("disconnect", (data) => {
		// When the client disconnects, kill their single player game process if it exists:
		try {
		killUserGameProcess(socket);
		} catch {
			console.log("Error in killing the single player game.")
		}

		// When the client disconnects, start a timer to check if they reconnect in 10 seconds.
		// If they don't reconnect, remove them from the lobby and kill the game process.
		// If they reconnect, add them back to the lobby.
		// Check if the user is connected to a lobby, if so, start a timer to check if they reconnect
		let lobbyIndex = checkIfConnectedToLobby(socket.decoded.username);
		if (lobbyIndex != -1) {
			let timeOut = process.env.DISCONNECT_TIMEOUT || 60;
			timeOut = parseInt(timeOut);
			console.log("User "+socket.decoded.username+" disconnected. Starting timer for "+timeOut+" seconds.")
			if(userTimers[socket.decoded.username]) {
				clearTimeout(userTimers[socket.decoded.username]);
				delete userTimers[socket.decoded.username];
				console.log("Clearing previous timer.")
			}
			userTimers[socket.decoded.username] = setTimeout(() => {
				console.log("User "+socket.decoded.username+" disconnected.")
				// If user disconnects and the game is not in progress, remove them from the lobby
				if(lobbies[lobbyIndex].gameInProgress == false) {
					lobbies[lobbyIndex].currentPlayers.splice(lobbies[lobbyIndex].currentPlayers.indexOf(socket.decoded.username), 1);
					// Assign the new host if the host leaves:
					if(lobbies[lobbyIndex].host == socket.decoded.username) {
						lobbies[lobbyIndex].host = lobbies[lobbyIndex].currentPlayers[0];
					}
					io.to("lobby").emit("updateLobbyForAll",{"lobbies":lobbies, "username":socket.decoded.username});
				} else {
					// If user disconnects and the game is in progress, kill the game process if the timeout hits
					terminateLobbyOnDisconnect(lobbyIndex, socket);
				}
				socket.leave("room"+lobbies[lobbyIndex].id);
				delete userTimers[socket.decoded.username];
			} , 1000*timeOut);
		} else {
			// If a single player game, we just kill the game process
			console.log("User "+socket.decoded.username+" disconnected, killing game process.")
			killUserGameProcess(socket);
		}
		//killUserGameProcess(socket);
	})

	// Send existing game progress to client:
	socket.on("gamelogs", (data) => {
		// When the client requests the game logs, send it to the client.
		let stateAndProgress = usersAndStateAndProgress.get(socket.decoded.username);
		if (stateAndProgress != undefined) {
			socket.emit('rendergamelogs', { "gamelogs": stateAndProgress[1] });
		} else {
			socket.emit('rendergamelogs', { "gamelogs": "No game in progress!" });
		}
	})

	socket.on("gamestart", (data) => {
		// Begin a new game for the user.
		startGame(socket, childProcessDataListener);
	})

	socket.on("multiplayergameStart", (data,callback) => {
		// Begin a new multiplayer game for the user.
		startMultiplayerGame(socket, childProcessDataListener);
		callback({ "response": "for room 1" });
	})

	socket.on("gamereconnect", (data) => {
		// For now, do exactly the same thing as gamestart.
		// In the future, we can use the data to reconnect to a previous game.
		startGame(socket, childProcessDataListener);
	})
	
	socket.on("multiplayerReconnect", (data) => {
		// Check if user is connected to a lobby and if the game is in progress:
		console.log("User is reconnecting to a multiplayer game.")
		let lobbyIndex = checkIfConnectedToLobby(socket.decoded.username);
		if(lobbyIndex != -1 && lobbies[lobbyIndex].gameInProgress) {
			socket.join("room"+lobbies[lobbyIndex].id);
			lastValues = returnLastStateAndProgress(socket);
			socket.emit('userDetails', socket.decoded);
			socket.emit('data',{"gamestates": lastValues.lastState,"gameprogress": lastValues.lastProgress, "gameindex":gameIndex, "dataArrived":dataArrived, "gamestringindex": gameStringIndex},1000)
		} else {
			console.log("User is not connected to a lobby or the game is not in progress.")
		}
	});

	socket.on("chatmessage", (data) => {
		receiveChatMessage(socket, data);
	});

	socket.on("chatHistory", (data) => {
		emitChatHistory(socket, data);
	})

	/**
	* Parses the child process data and emits it to the socket.
	* @param {string} data - The data received from the child process.
	*/
	const childProcessDataListener = (data) => {
		let lobbyIndex = checkIfConnectedToLobby(socket.decoded.username);
		let lobbyId;
		if(lobbyIndex > -1) {
			lobbyId = lobbies[lobbyIndex].id;
		} else {
			lobbyId = -1;
		}
		let parsedData = parseChildProcessData(data, socket, lobbyId);
		if(lobbyIndex === -1) {
			// Emit the data to the lobby:
			socket.emit('data', { "gamestates": parsedData.gameStates, "gameprogress": parsedData.gameProgress, "gameindex": gameIndex, "dataArrived": dataArrived, "gamestringindex": gameStringIndex, "currentUser": socket.decoded }, 1000)
		} else {
			console.log("Emitting data to lobby "+lobbyId)
			io.to("room"+lobbyId).emit('data', { "gamestates": parsedData.gameStates, "gameprogress": parsedData.gameProgress, "gameindex": gameIndex, "dataArrived": dataArrived, "gamestringindex": gameStringIndex, "currentUser": socket.decoded }, 1000)
		}
	}

	/**
	 * Parses the data from the python program and sends it to the client.
	 * Returns the game states and progress as an array.
	 * @param {Buffer} data - The data received from the child process.
	 * @param {Object} socket - The socket object representing the client connection.
	 * @returns {Object} - An object containing the game states and progress arrays.
	 */
	function parseChildProcessData(data, socket, lobbyId) {
		// Parse the data from the python program and send it to the client.
		// Return the game states and progress as an array.
		gameProgress = [];
		gameStates = [];
		let dataString = data.toString();
		let dataArray = dataString.split(/\r?\n/)
		for (let index = 0; index < dataArray.length; index++) {
			let element = dataArray[index];
			try {
				gameStates.push(JSON.parse(element))
			}
			catch {
				//if(element!="" && gameIndex != 0) {
				if (element != "") {
					gameProgress.push(element)
				}
			}
		}

		// Get the states and progress array from the map corresponding to current user and modify it:
		let stateAndProgress;
		if(lobbyId != -1) {
			stateAndProgress = usersAndStateAndProgress.get(lobbyId);
		}
		else {
			stateAndProgress = usersAndStateAndProgress.get(socket.decoded.username);
		}
		stateAndProgress[0].push(...gameStates); // Appending to the existing list
		stateAndProgress[1].push(...gameProgress);


		return { "gameStates": gameStates, "gameProgress": gameProgress }
	}



	/**
	 * Returns the last state and progress of the current user.
	 * @param {Object} socket - The socket object for the current user.
	 * @param {number} [stateIndex=1] - The index of the state to return, starting from the last state.
	 * @param {number} [progressIndex=1] - The index of the progress to return, starting from the last progress.
	 * @returns {Object} An object containing the last state and progress of the current user.
	 */
	function returnLastStateAndProgress(socket, stateIndex = 1, progressIndex = 1) {
		// Get the states and progress array from the map corresponding to current user:
		
		// Check if player is connected to a lobby:
		let lobbyIndex = checkIfConnectedToLobby(socket.decoded.username);
		let lobbyId;
		let stateAndProgress
		if(lobbyIndex > -1) {
			lobbyId = lobbies[lobbyIndex].id;
			stateAndProgress = usersAndStateAndProgress.get(lobbyId);
		} else {
			stateAndProgress = usersAndStateAndProgress.get(socket.decoded.username);
		}

		if(stateAndProgress != undefined) {
		// Length of the progress and state arrays:
		let progressLength = stateAndProgress[1].length;
		let stateLength = stateAndProgress[0].length;

		// Last state and progress:
		let lastState = stateAndProgress[0][stateLength - stateIndex];
		let lastProgress = stateAndProgress[1][progressLength - progressIndex];

		return { "lastState": [lastState], "lastProgress": [lastProgress] };
		} else {
			return { "lastState": [], "lastProgress": [] };
		}
	}

});

function terminateSinglePlayerGame(socket) {
	let pythonProg = usersAndGames.get(socket.decoded.username);
	if (pythonProg) {
		console.log("Killing game process for user " + socket.decoded.username);
		pythonProg.kill();
	}
	io.to(socket.id).emit('exit', { "gameOverMessage": "Player " + socket.decoded.username + " disconnected from the game." });
	usersAndGames.delete(socket.decoded.username);
}

function killPythonProcess(socket) {
	let pythonProg = usersAndGames.get(socket.decoded.username);
	if (pythonProg) {
		console.log("Killing game process for user " + socket.decoded.username);
		pythonProg.kill();
	}
}

function emitGameErrorMessageToLobby(lobbyIndex, socket) {
	io.to("room"+lobbies[lobbyIndex].id).emit('exit', { "gameOverMessage": "Game process has been terminated." });
	io.to("lobby").emit("updateLobbyForAll", { "lobbies": lobbies, "username": socket.decoded.username });
}

function setLobbyEmpty(lobbyIndex) {
	lobbies[lobbyIndex].currentPlayers = [];
	lobbies[lobbyIndex].gameInProgress = false;
	lobbies[lobbyIndex].host = undefined;
}


function terminateLobbyOnDisconnect(lobbyIndex, socket, emit_error = true) {
	let lobbyId = lobbies[lobbyIndex].id;
	killPythonProcess(socket);
	if(emit_error) {
		emitGameErrorMessageToLobby(lobbyIndex, socket);
	}
	setLobbyEmpty(lobbyIndex);

	io.in("room" + lobbyId).socketsLeave("room" + lobbyId);
	// Delete the game process:
	usersAndGames.delete(lobbyId);
}

// Start multiplayer game:
function startMultiplayerGame(socket, childProcessDataListener) {
	let lobbyIndex = checkIfConnectedToLobby(socket.decoded.username);
	if(lobbyIndex == -1) {
		console.log("Lobby ID is undefined.")
		return null;
	}
	let lobbyId = lobbies[lobbyIndex].id;
	// Find if the user is in a lobby:

	let stateAndProgress = [[], []];
	usersAndStateAndProgress.set(lobbyId, stateAndProgress);
	if(lobbyId == undefined) {
	}
	else {
		io.to("room"+lobbyId).emit('multiplayerStartGame', true);
	}
	// If the user already has a child process running,
	// terminate it to reduce the risk of unreferenced child processes running and causing memory loss.
	if (usersAndGames.has(lobbyId)) {
		console.log("Room already has a game running. Terminating the previous game and starting a new one.")
		pythonProg = usersAndGames.get(lobbyId);
		pythonProg.kill();
		usersAndGames.delete(lobbyId);
	}
	// The game is stored in folder named after the lobbyid, and time of creation
	let run_folder = __dirname + "/../" + "Lobby" + lobbyId + "Game" + Date.now();
	if (!usersAndGames.has(lobbyId)) {
		// Get all the players in the lobby:
		let lobby = lobbies.find(lobby => lobby.id == lobbyId);
		let players = lobby.currentPlayers;
		if(!(players.length >= 2)) {
			console.log("Not enough players to start the game.");
			return null;
		}
		// Formulate the players in to comma separated string:
		let playersString = players.join(",");
		let args = [__dirname + "/../Python/browserMoska.py"];

		if (playersString) {
			args.push("--name");
			args.push(playersString);
			args.push("--gameid");
			args.push(gameIndex);
			args.push("--folder");
			args.push(run_folder);
			// If any player is named 'test', then the game is a test game.
			if (players.includes("Test")) {
				args.push("--one_card_in_deck");
			}
		}

		let pyexe = getPyexe();

		pythonProg = spawn(pyexe, args, { timeout: 10000000 });
	}
	pythonProg.on('error', (err) => {
		console.error(`Failed to start Python process: ${err}`);
		terminateLobby(lobbyIndex, socket);
	});

	// Store the python program in a map with the user's email as the key.
	usersAndGames.set(lobbyId, pythonProg);
	// Set game in progress in lobbies:
	lobbies[lobbyIndex].gameInProgress = true;
	pythonProg.stderr.on('data', function (data) {
		// If the python program sends an error, log it.
		console.log(data)
		console.log(data.toString());
	});

	console.log("Python program started");

	// When the python program sends data, parse it and send it to the client.
	pythonProg.stdout.on('data', childProcessDataListener);

	pythonProg.stdout.on('end', () => {
		try {
		// Process the complete output from the Python program
		console.log("END OF THE STREAM!");
		} catch {
			console.log("Error in ending the game.")
		}
	});

	pythonProg.on('exit', function (data) {

		// Get the states and progress array from the map corresponding to current user:
		let stateAndProgress = usersAndStateAndProgress.get(lobbyId);
		// Length of the progress and state arrays:
		let stateLength = stateAndProgress[0].length;
		// Last state and progress:
		let lastState = stateAndProgress[0][stateLength - 1];
		// If there are no states, the game hadn't begun yet.
		if (!lastState) {
			return
		}
		// Check for errors
		else if (lastState.error) {
			return
		}

		if (data == 0) {

			let evaluation_image = run_folder + "/Game.png";

			// Emit the image to all sockets in the room
			emitPNGFile(io.to("room"+lobbyId), evaluation_image);

			let playerNames = [];
			for (let i=0; i<stateAndProgress[0][0].players.length; i++) {
				playerNames.push(stateAndProgress[0][0].players[i].name);
			}
			updateAllPlayersStats(playerNames, data, stateAndProgress);
		}
		// wait for 5 seconds before terminating the lobby to allow for the image to be sent to the clients.
		setTimeout(() => {
			terminateLobbyOnDisconnect(lobbyIndex, socket, false);
		}
		, 5000);
	});
}


/**
 * Starts a game for the given socket and child process data listener.
 * @param {Object} socket - The socket object for the user.
 * @param {Function} childProcessDataListener - The function to handle data from the child process.
 * @param {number} gameTypeFlag - The flag indicating the type of game to start (singleplayer vs multiplayer).
 */
function startGame(socket, childProcessDataListener) {
	// If there are more than 9 games in process, return an error message:
	if(usersAndGames.size > 2) {
		socket.emit('exit', {"gameOverMessage": "Too many games in progress. Please try again later."});
		return;
	}

	let stateAndProgress = [[], []];
	usersAndStateAndProgress.set(socket.decoded.username, stateAndProgress);

	// Check if the user is connected to a lobby, if so, make sure that they leave the lobby:
	let lobbyIndex = checkIfConnectedToLobby(socket.decoded.username);
	if(lobbyIndex != -1) {
		console.log("User is connected to a lobby, but started a singleplayer game. Leaving the lobby.")
		socket.leave("room"+lobbies[lobbyIndex].id);
		lobbies[lobbyIndex].currentPlayers.splice(lobbies[lobbyIndex].currentPlayers.indexOf(socket.decoded.username), 1);
		// Assign the new host if the host leaves:
		if(lobbies[lobbyIndex].host == socket.decoded.username) {
			lobbies[lobbyIndex].host = lobbies[lobbyIndex].currentPlayers[0];
		}
	}
	if(usersAndGames.has(socket.decoded.username)) {
		console.log("User already has a game running. Terminating the previous game and starting a new one.")
		pythonProg = usersAndGames.get(socket.decoded.username);
		pythonProg.kill();
		usersAndGames.delete(socket.decoded.username);
	}
	// Player name + time
	let run_folder = __dirname + "/../" + socket.decoded.username + "Game" + Date.now();
	// If the user already has a child process running,
	// terminate it to reduce the risk of unreferenced child processes running and causing memory loss.
	if (!usersAndGames.has(socket.decoded.username)) {
		let username = socket.decoded ? socket.decoded.username : "Human";
		let args = [__dirname + "/../Python/browserMoska.py"];
		// let args = ["C:/home/site/wwwroot/Python/browserMoska.py"];

		if (username) {
			args.push("--name");
			args.push(username);
			args.push("--gameid");
			args.push(gameIndex);
			args.push("--folder");
			args.push(run_folder);
			if (username == "Test") {
				args.push("--test");
			}
		}

		let pyexe = getPyexe();
		pythonProg = spawn(pyexe, args, { timeout: 1000000 });
	}
	pythonProg.on('error', (err) => {
		console.error(`Failed to start Python process: ${err}`);
		terminateSinglePlayerGame(socket);
	});

	// Store the python program in a map with the user's email as the key.
	usersAndGames.set(socket.decoded.username, pythonProg);
	pythonProg.stderr.on('data', function (data) {
		// If the python program sends an error, log it.
		console.log(data.toString());
	});

	console.log("Python program started");

	// When the python program sends data, parse it and send it to the client.
	pythonProg.stdout.on('data', childProcessDataListener);
	pythonProg.stdout.on('end', () => {
		// Process the complete output from the Python program
		console.log("END OF THE STREAM!");
		try {
		pythonProg.kill();
		usersAndGames.delete(socket.decoded.username);
		} catch {
			console.log("Error in killing the game process.")
		}
	});

	pythonProg.on('exit', function (data) {

		if (socket.decoded.username == "Test@email.com") { // For testing purposes change name to Test_4:
			socket.decoded.username = "Test_4";
		}

		// Get the states and progress array from the map corresponding to current user:
		let stateAndProgress = usersAndStateAndProgress.get(socket.decoded.username);
		
		if (data == 0) {
			if (socket.decoded.username == "Test_4") { // Change back::
				socket.decoded.username = "Test";
			}
			let evaluation_image = run_folder + "/Game.png";
			// Emit the image
			emitPNGFile(socket, evaluation_image);
			// Pass all players to the function
			let playerNames = [];
			for (let i=0; i<stateAndProgress[0][0].players.length; i++) {
				playerNames.push(stateAndProgress[0][0].players[i].name);
			}
			// Only update if 'Anonymous[0-9]*' is not in the playerNames array
			if (!playerNames.some(name => name.match(/Anonymous[0-9]*/))) {
				updateAllPlayersStats(playerNames, data, stateAndProgress);
			}
		}
		// wait for 5 seconds before terminating the lobby to allow for the image to be sent to the clients.
		setTimeout(() => {
			terminateSinglePlayerGame(socket);
		}
		, 5000);
	});
}


async function getSummaryFromStateAndProgress(stateAndProgress) {
	// Given the state and progress array, calculate stats from the game.
	// Average evaluations, finishing order [winner, second, third, fourth], etc.
	let gameSummary = {
		players: [],
		finishingOrder: []
	};
	let stateLength = stateAndProgress[0].length;
	let lastState = stateAndProgress[0][stateLength - 1];
	let players = lastState.players;

	// Player names to the state index where they finished the game.
	let playerFinishNumber = {};

	// For each player, calculate the average evaluation, total evaluation, and whether they lost the game.
	for (let index = 0; index < players.length; index++) {
		let playerInState = players[index];
		// If playerInState.is_bot is true, then fetch stats of 'MoskaBot'
		let playerCurrentDBEntry = null;
		if (playerInState.is_bot) {
			playerCurrentDBEntry = await getCurrentUserStats("MoskaBot");
		} else {
			playerCurrentDBEntry = await getCurrentUserStats(playerInState.name);
		}
		let playerName = playerInState.name;
		let playerIndex = index;
		let playerStats = {
			username: playerName,
			rating: playerCurrentDBEntry.gameStats.rating,
			evaluations: [],
			finishingState: stateLength,
			isBot: playerInState.is_bot
		};
		let totalEvaluation = 0;
		let gameLost = 1;

		// For each state, get the evaluation, and check if the player lost the game.
		for (let stateIndex = 0; stateIndex < stateLength; stateIndex++) {
			let state = stateAndProgress[0][stateIndex];
			if (state.error) {
				continue;
			}
			playerStats.evaluations.push(state.players[playerIndex].last_evaluation);
			totalEvaluation += state.players[playerIndex].last_evaluation;

			// When the player gets out, we can stop iterating through the states.
			if (state.players[playerIndex].finished == 1 || state.players[playerIndex].cards.length == 0) {
				gameLost = 0;
				playerFinishNumber[playerName] = stateIndex;
				playerStats.finishingState = stateIndex;
				break;
			}
		}

		if (gameLost == 1) {
			playerFinishNumber[playerName] = stateLength;
		}

		gameSummary.players.push(playerStats);
	}

	// Calculate the finishing order of the players.
	// The first to finish is the player with the lowest state index where they finished the game.
	gameSummary.finishingOrder = Object.keys(playerFinishNumber).sort(function (a, b) {
		return playerFinishNumber[a] - playerFinishNumber[b];
	});

	return gameSummary;
}


/**
 * Updates the player statistics in the database by sending a
 * POST request to the server.
 *
 * @param {string} username - The username of the player.
 * @param {Object} gameSummary - The summary of the game.
 * @returns {Promise<Object>} The response from the database update.
 */
function updatePlayerStats(username, gameSummary) {
	let update = {
		"username": username,
		"gameSummary": {
			"players": gameSummary.players,
			"finishingOrder": gameSummary.finishingOrder
		}
	}
	let res = fetch("http://localhost:3000/users/updateuser", {
		method: "POST",
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(update)
	})
		.then(response => response.json())
		.then(data => {
			console.log('Database update response:', data);
		})
	return res;
}

async function getCurrentUserStats(username) {
    try {
        // Use query parameters instead of a request body
        let response = await fetch(`http://localhost:3000/users/finduser?username=${encodeURIComponent(username)}`, {
            method: "GET",
            headers: {
                'Content-Type': 'application/json'
            }
        });
        let data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching user stats:', error);
    }
}

/**
 * Update all players' stats in the database.
 * @param {Array} usernames - The usernames of the players.
 * @param {number} data - The exit code of the game.
 * @param {Array} stateAndProgress - The game states.
 */
async function updateAllPlayersStats(usernames, data, stateAndProgress) {
	if (data != 0) {
		// Game failed
		console.log("Invalid exit code. Game finished prematurely.");
	}
	// Game successful
	else {
		const gameSummary = await getSummaryFromStateAndProgress(stateAndProgress);
		for (let index = 0; index < usernames.length; index++) {
			await updatePlayerStats(usernames[index], gameSummary);
		}
	}
}


function receiveChatMessage(socket, data) {
	var now = new Date();
	var timeNow = [
		now.getFullYear(),
		'-',
		now.getDate(),
		'-',
		now.getMonth() + 1,
		' ',
		padNumber(now.getHours()),
		':',
		padNumber(now.getMinutes()),
		':',
		padNumber(now.getSeconds())
	].join('');
	let message = data.message;
	let chatType = data.chatType;
	let lobbyId = data.lobbyId
	if (data.lobbyId == undefined) {
		data.lobbyId = "global";
	}
	var messageObject = {
		username: socket.decoded.username,
		message: message,
		time: timeNow,
		chatType: chatType,
		lobbyId: lobbyId
	}
	let messageArray;
	try {
		const data = fs.readFileSync(__dirname + '/../messageHistory/messageHistory.json', 'utf-8');
		messageArray = JSON.parse(data);
	} catch (error) {
		messageArray = [];
	}
	messageArray.push(messageObject);
	try {
		fs.writeFileSync(__dirname + '/../messageHistory/messageHistory.json', JSON.stringify(messageArray));
		if (chatType == "global") {
			io.emit('newChatMessage', JSON.stringify(messageObject));
		} else {
			io.to("room"+lobbyId).emit('newChatMessage', JSON.stringify(messageObject));
		}
	} catch (error) {
		console.log(error)
	}
}

// Only emit the chat history that which the player has access to:
function emitChatHistory(socket, lobbyId) {
	let messageString;
	try {
		const data = fs.readFileSync(__dirname + '/../messageHistory/messageHistory.json', 'utf-8');
		let messageJson = JSON.parse(data);
		messageString = messageJson.filter(message => message.chatType == "global" || message.lobbyId == lobbyId.id);
	} catch (error) {
		messageString = [];
	}
	socket.emit('chatHistory', JSON.stringify(messageString));
}
/**
 * Finds the next available game index for the user name.
 * The next available game index is the first game index that does not have a corresponding file in the user's folder.
 * @param {string} username - The name of the user.
 * @returns {number} - The next available game index.
 */
function getNextGameIndex(username) {
	// Find the next available game index for the user name.
	// The next available game index is the first game index that does not have a corresponding file in the user's folder.
	let user_folder = __dirname + "/../" + username + "-Games";
	let game_index = 0;
	for (let index = 0; index < 1000; index++) {
		let file_name = "HumanGame-" + game_index + ".log";
		// If the file does not exist, then return the game index.
		if (!fs.existsSync(user_folder + "/" + file_name)) {
			return game_index;
		}
		game_index++;
	}
	console.log("No available game index found!")
	return game_index;
}

/**
 * Returns the Python executable depending on the platform.
 * @returns {string} The Python executable.
 */
function getPyexe() {
	// Get the python executable depending on the platform.
	let pyexe = 'python3';
	if (process.platform === "win32") {
		pyexe = 'py';
		try {
			execSync('py --version');
		} catch (error) {
			pyexe = 'python';
		}
	}
	return pyexe;
}


/**
 * Terminates the Python program associated with the user's email when they disconnect.
 * @param {Object} socket - The socket object for the user's connection.
 */
function killUserGameProcess(socket) {
	// When the user disconnects, terminate the python program.
	let pythonProg = usersAndGames.get(socket.decoded.username);
	if (pythonProg != null) {
		console.log("User disconnected. Terminating game.");
		pythonProg.kill();
		usersAndGames.delete(socket.decoded.username);
		socket.emit('exit');
	}
	else {
		console.log("Attempted disconnect. No game in progress.");
	}
}

/**
 * Emits a PNG file to the given socket.
 * @param {Object} socket - The socket object for the user.
 * @param {string} path - The path to the PNG file.
 * @returns {void}
 * @emits {Object} - The PNG file to the socket.
*/
function emitPNGFile(socket, path) {
	fs.readFile(path, function (err, data) {
		if (err) {
			socket.emit('exit', true);
		}
		else {
			// Send the image data to the connected client
			socket.emit('exit', { image: true, buffer: Buffer.from(data, 'base64') });
		}
	}
	)
}

function padNumber(number) {
	return number < 10 ? '0' + number : number;
}
module.exports = socketapi;
