
let boardDiv;// Saving the original state:
let DEFAULT_BOARD_DIV = `<div id="board">
<div class="hourglass" id="hourglass" style="display: none"></div>
<div id="top" class="board-player"></div>
<div id="left" class="board-player"></div>
<div id="middle" class="board-player">BOARD
  <div id="cards-to-kill" class="board-player" onclick="activateBoard(this,event)">Cards to kill</div>
  <div id="killed-cards" class="board-player" onclick="activateBoard(this,event)">Killed cards</div>
</div>
<div id="errormessage" hidden="true">Incorrect action:</div>
<div id="right" class="board-player"></div>
<p id="gameaction">test</p>
<div id="bottom" class="board-player" onclick="activateBoard(this,event)">
</div>
<div id="deck" class="board-player"></div>
<div id="card-from-deck" class="board-player"></div>
<div id="action-menu" class="action-menu">
  <button id="PlayFallFromHand"class = "play-cards" disabled="true">Kill from Hand</button>
  <button id="PlayFallFromDeck" class = "play-cards" disabled="true">Kill from Deck</button>
  <button id="PlayToSelf" class = "play-cards" disabled="true">Play to Self</button>
  <button id="PlayToOther" class = "play-cards" disabled="true">Attack</button>
  <button id="InitialPlay" class = "play-cards" disabled="true">Initial play</button>
  <button id="Skip" class = "play-cards" disabled="true">Skip turn</button>
  <div style="height:100%;width:5%;"></div> <!-- For empty space in the action menu-->
  <button id="EndTurn" class = "play-cards" disabled="true">End bout</button>
  <button id="DrawAll" class = "play-cards" disabled="true">End bout (draw all)</button>
  <div style="height:100%;width:5%;"></div> <!-- For empty space in the action menu-->
  <button id="Refresh" class = "play-cards">Refresh</button>
  <!-- See moves backward or forward -->
  <button id="reverse-move-button" class = "play-cards" onclick="goOneMoveBack()">Backward</button>
  <button id="next-move-button" class = "play-cards" onclick="goOneMoveForward()">Forward</button>
</div>
</div>`
// Global array of game states
let STATE_ARRAY = [];
let DISPLAY_STATE_INDEX = 0;
let CURRENT_USER;
let ERROR_STATE = 0;
let TOTAL_RECEIVED_STATES = 0;
let gameTurnIndex = 0;
let turnTime = 1500;
let SAVED_DATA = null;
let IS_RENDERING = false;
let PLAYER_NAME;
var socket;
console.log("Loading!")
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM READY")
  socket = socketManager.getInstance();

  let hourglass = document.getElementById("hourglass")
  hourglass.style.display = "block";
  socket.on('userDetails', (data) => {
	// Store username in to localstorage:
	localStorage.setItem('username', data.username);
  });
  socket.emit(document.gameStart,"true", function (data) { 
	console.log("game started"+data.response)
  })
  socket.on('data', (data) => {
	console.log("where is data")
    onDataFromPython(data, hourglass);

	})

	socket.on('exit', (data) => {
		renderGameOver(data);

	})

});



/**
 * Callback function for receiving data from Python.
 * @param {Object} data - The data received from Python.
 * @param {HTMLElement} hourglass - The hourglass element to hide.
 */
function onDataFromPython(data, hourglass) {

	// Update the total number of received states
	if (data.gamestates != null) {
		TOTAL_RECEIVED_STATES += data.gamestates.length;
	}
	hourglass.style.display = "none";

	// If nothing is blocking rendering, render the data
	if (!IS_RENDERING) {
		IS_RENDERING = true;
		initializeCode(data);
		// On renderingStopped event, set IS_RENDERING to false, and if there is saved data, render it.
		document.addEventListener('renderingStopped', () => {
			if (SAVED_DATA != null) {
				initializeCode(SAVED_DATA);
				SAVED_DATA = null;
			}
			IS_RENDERING = false;

		})
	}
	// Else add the data to the saved data
	else {
		if (SAVED_DATA == null) {
			SAVED_DATA = data;
		}
		else {
			SAVED_DATA.gamestates = SAVED_DATA.gamestates.concat(data.gamestates);
			SAVED_DATA.gameprogress = SAVED_DATA.gameprogress.concat(data.gameprogress);
		}
	}
}


/**
 * Delays the execution of the function by the specified number of milliseconds.
 * @param {number} millisec - The number of milliseconds to delay the function execution.
 * @returns {Promise} A Promise that resolves after the specified number of milliseconds.
 */
function sleepFunction(millisec) {
	return new Promise(resolve => {
		setTimeout(() => { resolve('') }, millisec);
	})
}


function activateBoard(button, event) {
	if (event.target.className != "card") {
		button.classList.toggle('active');
	}
}

/**
 * Moves the displayed game state one move back in the game. The true game state is not changed.
 * @function
 * @name goOneMoveBack
 * @returns {void}
 */
function goOneMoveBack() {
	DISPLAY_STATE_INDEX -= 1;
	if (DISPLAY_STATE_INDEX < 0) {
		DISPLAY_STATE_INDEX = 0;
	}
	updateState(STATE_ARRAY[DISPLAY_STATE_INDEX], DEFAULT_BOARD_DIV, "")
	checkActionState(STATE_ARRAY[DISPLAY_STATE_INDEX], true)
}



/**
 * Moves the game forward by one state and renders the updated game state using the updateState function.
 */
function goOneMoveForward() {
	DISPLAY_STATE_INDEX += 1;
	// Render game to the next state using updateState function
	if (DISPLAY_STATE_INDEX >= STATE_ARRAY.length) {
		DISPLAY_STATE_INDEX = STATE_ARRAY.length - 1;

	}
	if (DISPLAY_STATE_INDEX == STATE_ARRAY.length - 1) {
		goToNewestState()
		return;
	}
	updateState(STATE_ARRAY[DISPLAY_STATE_INDEX], DEFAULT_BOARD_DIV, "")
	checkActionState(STATE_ARRAY[DISPLAY_STATE_INDEX], true)
}



function goToNewestState() {
	updateState(STATE_ARRAY[STATE_ARRAY.length - 1], DEFAULT_BOARD_DIV, "")
	checkActionState(STATE_ARRAY[STATE_ARRAY.length - 1])
}


function wait(ms) {
	var start = Date.now(),
		now = start;
	while (now - start < ms) {
		now = Date.now();
	}
}



function renderGameOver(data) {
	// Check first if the rendering has been stopped, and after that render game over state.
	document.addEventListener('lastFramesRendered', () => {
		let currentState = document.getElementById('board');

		let endElement = document.createElement('div');
		endElement.id = "gameover";

		// Display the image if it exists:
		// The image is sent as { image: true, buffer: data.toString('base64') }
		if (data.image) {
			const img = document.createElement('img');

			// Create a Blob from the binary data
			const blob = new Blob([new Uint8Array(data.buffer)], { type: 'image/png' });

			// Use a FileReader to read the Blob as a Base64 data URL
			const reader = new FileReader();
			let base64String;
			reader.onload = () => {
				base64String = reader.result.split(',')[1];
				// Set the image source
				let endState = `<div>
        GAME OVER!<br>Open the image in a new tab to see the evaluation image
        <br>
        <img id="evaluationimage" style="height:50%;width:50%;" src=`+ `data:image/png;base64,${base64String}` + `></>
        </div>
        `
				endElement.innerHTML = endState;
			};
			reader.readAsDataURL(blob);

		} else {
			let endState = `<div id="gameover"> GAME OVER!
    </div>
    `
			endElement.innerHTML = endState;
		}
		currentState.appendChild(endElement);

		return;
	})
}



function checkError(gameArray) {

	try {
		let errorJson = gameArray.gamestates[0];
		if (errorJson.error != null) {
			return errorJson;
		} else {
			return false;
		}
	} catch (e) {
		return false;
	}

}



async function initializeCode(gameArray) {
	PLAYER_NAME = localStorage.getItem('username');
	console.log("You are player "+PLAYER_NAME);
	// Game array contains the gamestates and gameprogress
	// Game array has:
	// gamestates: array of gamestates
	// gameprogress: array of game actions
	// Checking for error messages:
	let errorJson = checkError(gameArray);
	if (errorJson != false) {
		goToNewestState();
		let errorDiv = document.getElementById('errormessage');
		errorDiv.removeAttribute('hidden');
		errorDiv.innerHTML = errorJson.error;
		ERROR_STATE = errorJson.error;
		TOTAL_RECEIVED_STATES = TOTAL_RECEIVED_STATES - gameArray.gamestates.length;
		// Send renderingStopped event to the document
		const renderingStopped = new Event('renderingStopped');
		document.dispatchEvent(renderingStopped);
		return;
	}

	//Checking to see if last gameAction is from killing from deck:
	try {
		let lastGameActionString = gameArray.gameprogress[gameArray.gameprogress.length - 1];
		// Check if the last action of the user exists, and was to koplata
		// Which is true if "Lifted card from deck" is somewhere in the last action string
		if (lastGameActionString != null && lastGameActionString.includes("Lifted card from deck")) {

			let hourglass = document.getElementById("hourglass")
			hourglass.style.display = "none";
			killCardFromDeck(lastGameActionString);
		}
	}
	catch (e) {
		console.log("Something went wrong: " + e)
	}


	if (gameArray.gamestates.length != 0) {
		// If there are gamestates, render the game

		let slider = document.getElementById('timeslider');
		let sliderValue = document.getElementById('timeslidervalue');
		sliderValue.textContent = "Seconds per turn: " + (turnTime / 1000).toFixed(1);
		slider.addEventListener('input', () => {
			turnTime = slider.value * 100;
			sliderValue.textContent = "Seconds per turn: " + (turnTime / 1000).toFixed(1);
		});

		let stateArray = gameArray.gamestates;
		let gameProgress = gameArray.gameprogress;
		CURRENT_USER = gameArray.currentUser.username;

		// Save the boardDiv:s state only if its null:
		if (boardDiv == null) {
			boardDiv = DEFAULT_BOARD_DIV;
		}

		let stateJson, gameActionString;
		let turnStringIndex = 0;


		for (let turnIndex = 0; turnIndex < stateArray.length; turnIndex++) {
			stateJson = stateArray[turnIndex];
			STATE_ARRAY.push(stateJson);
			turnStringIndex += 1;
			gameTurnIndex += 1;
			gameActionString = "Turn: " + gameTurnIndex;
			updateState(stateJson, boardDiv, gameActionString)
			await sleepFunction(turnTime);
			//wait(turnTime);
		}

		DISPLAY_STATE_INDEX = STATE_ARRAY.length - 1;

		if (stateJson.error) {
			return;
		}

		//updateState(stateJson,boardDiv,"Your turn ("+gameTurnIndex+")")
		//updateState(stateArray[stateArray.length-1],gameActionString)

		checkActionState(stateArray[stateArray.length - 1])
		turnIndex = gameArray.gameindex - 1;

		refreshButton = document.getElementById('Refresh');
		refreshButton.addEventListener("click", function () {
			let newboardDiv = document.getElementById('board');
			let tempElement = document.createElement('div');
			tempElement.innerHTML = boardDiv;
			newboardDiv.replaceWith(tempElement);
			socket.emit('pingSocket', "ping")
		});

		// Add event listener for 'reverse-move-button', which renders the previous state of the game
		reverseMoveButton = document.getElementById('reverse-move-button');
		reverseMoveButton.addEventListener("click", goOneMoveBack);

		// Add event listener for 'next-move-button'
		nextMoveButton = document.getElementById('next-move-button');
		nextMoveButton.addEventListener("click", goOneMoveForward);

		// Rendering error message if previous move was not valid:
		if (ERROR_STATE != 0) {
			let errorDiv = document.getElementById('errormessage');
			errorDiv.removeAttribute('hidden');
			errorDiv.innerHTML = ERROR_STATE;
		}

		// If all except one player have finished the game (player.finished==1) in the last state, render game over state
		let nfinished_players = 0;
		// stateJson is the last state json, set in the for loop above
		for (let playerIndex = 0; playerIndex < stateJson.players.length; playerIndex++) {
			if (stateJson.players[playerIndex].finished == 1) {
				nfinished_players += 1;
			}
		}
		// Emit an event to notify that the rendering of the current data has stopped.
		if (TOTAL_RECEIVED_STATES == STATE_ARRAY.length) {
			const lastFramesRendered = new Event('lastFramesRendered');
			document.dispatchEvent(lastFramesRendered);
		}
	}
	// Send renderingStopped event to the document
	const renderingStopped = new Event('renderingStopped');
	document.dispatchEvent(renderingStopped);
}


function checkActionState(stateJson, fromReplay = false) {
	const actionMenuButtons = document.getElementsByClassName("play-cards");

	if (stateJson.error) {
		return;
	}

	// First make sure that all of the buttons are hidden (if they have previously been unhidden.)
	for (let index = 0; index < actionMenuButtons.length; index++) {
		actionMenuButtons[index].disabled = true;
	}

	// Find the player whos turn it is now:
	let playerName = stateJson.turn;

	let playerIndex;
	//Find human player index:
	for (let index = 0; index < stateJson.players.length; index++) {
		if (!stateJson.players[index].is_bot && stateJson.players[index].name == PLAYER_NAME) {
			playerIndex = index;
		}

	}

	// Then make all of the buttons which are included in the stateJson visible:
	for (let index = 0; index < actionMenuButtons.length; index++) {

		if (["Refresh", "reverse-move-button", "next-move-button"].includes(actionMenuButtons[index].id)) {
			actionMenuButtons[index].disabled = false;
			// If from replay, the Refresh will take to the newest state
			if (fromReplay && actionMenuButtons[index].id == "Refresh") {
				actionMenuButtons[index].addEventListener("click", goToNewestState);
			}
			continue;
		}

		// Check if the initiator actions includes the buttons id and that the player whos turn is now is the player:
		if (stateJson.players[playerIndex].playable_moves.includes(actionMenuButtons[index].id) && playerName == stateJson.players[playerIndex].name) {
			// If the state is 'fromReplay', then the buttons are reddish
			actionMenuButtons[index].disabled = false;

			if (fromReplay) {
				actionMenuButtons[index].style.backgroundColor = "red";
				if (actionMenuButtons[index].id == "EndTurn") {
					actionMenuButtons[index + 1].style.backgroundColor = "red";
				}
				continue;
			}

			//Make it so refresh button is always visible:
			if (actionMenuButtons[index].id == "EndTurn") {
				// In case of the action being end turn, we also need  to make draw all button visible and add event listener to it.
				actionMenuButtons[index + 1].disabled = false;
				actionMenuButtons[index + 1].addEventListener("click", function () {
					//Modify the stateJson to contain the wanted action:
					stateJson.action = actionMenuButtons[index + 1].id;
					playCards(stateJson)
				})
			}

			//Also add event listeners for the buttons, so that each of the buttons uses playCards function, which then checks what actions should be done.
			actionMenuButtons[index].addEventListener("click", function () {

				//Modify the stateJson to contain the wanted action:
				stateJson.action = actionMenuButtons[index].id;
				playCards(stateJson)
			})
		}
	}
}


function createCardString(cardArray) {
	let action = cardArray[0];
	let actionCards = cardArray[1].split(" ")
	let actionString = action + "; "
	for (let index = 1; index < actionCards.length; index++) {
		const action = actionCards[index];
		if (index == actionCards.length - 1) {

			actionString = actionString.concat(action);
		} else {
			actionString = actionString.concat(action + ",");
		}
	}
	return actionString;
}

function playCards(stateJson) {
	// Find player name:
	let humanName;
	for (let playerIndex = 0; playerIndex < stateJson.players.length; playerIndex++) {
		if (!stateJson.players[playerIndex].is_bot && stateJson.players[playerIndex].name == PLAYER_NAME) { // Player is human:
			humanName = stateJson.players[playerIndex].name;
		}
	}

	const toggleMatchingCardsCheckbox = document.getElementById("show-matching-cards-checkbox");
	//Case when human plays :
	if (stateJson.action == "PlayFallFromHand") {
		let cardArray = ["PlayFallFromHand", ""];
		toggleMatchingCardsCheckbox.addEventListener("change", toggleMatchingCards);
		if (toggleMatchingCardsCheckbox.checked) {
			toggleCanKillCards();
		}
		playFallHand(cardArray, function (temp) {
			let actionCards = cardArray[1].split(" ")
			let cardpairs = "";
			for (let index = 1; index < actionCards.length; index++) {
				let cardpair = actionCards[index];
				cardpairs = cardpairs + " " + cardpair;
			}
			let actionString = "PlayFallFromHand;" + cardpairs
			toggleMatchingCardsCheckbox.removeEventListener("change", toggleMatchingCards);
			sendGameAction(actionString);
			return temp;
		});
	}

	// Check for the setting toggleMatchingCards:
	if (stateJson.action == "PlayFallFromDeck") {
		let returnString = "PlayFallFromDeck;"
		sendGameAction(returnString)
	}

	if (stateJson.action == "PlayToOther") {
		let cardArray = ["PlayToOther", ""];
		const playToOtherButton = document.getElementById("PlayToOther");
		toggleMatchingCardsCheckbox.addEventListener("change", toggleMatchingCards);
		if (toggleMatchingCardsCheckbox.checked) {
			toggleMatchingCardsCheckbox.removeEventListener("change", toggleMatchingCards);
			toggleMatchingCards();
		}
		playToOther(cardArray, playToOtherButton, function (temp) {
			let actionString = createCardString(cardArray)
			sendGameAction(actionString)
			return temp;
		});
	}

	if (stateJson.action == "InitialPlay") {
		let cardArray = ["InitialPlay", ""];
		const playToOtherButton = document.getElementById("InitialPlay");
		playToOther(cardArray, playToOtherButton, function (temp) {
			let actionString = createCardString(cardArray);
			sendGameAction(actionString)
			return temp;
		});
	}

	if (stateJson.action == "PlayToSelf") {
		let cardArray = ["PlayToSelf", ""];
		toggleMatchingCardsCheckbox.addEventListener("change", toggleMatchingCards);
		if (toggleMatchingCardsCheckbox.checked) {
			toggleMatchingCards();
		}
		playToSelf(cardArray, function (temp) {
			let actionString = createCardString(cardArray)
			sendGameAction(actionString)
			toggleMatchingCardsCheckbox.removeEventListener("change", toggleMatchingCards);
			return temp;
		});
	}

	if (stateJson.action == "EndTurn") {
		let returnString = "EndTurn;n";
		sendGameAction(returnString)
	}

	if (stateJson.action == "DrawAll") {
		let returnString = "EndTurn;y";
		sendGameAction(returnString)
	}

	if (stateJson.action == "Skip") {
		let returnString = "Skip;";
		sendGameAction(returnString);
	}

}

function sendGameAction(actionString) {
	ERROR_STATE = 0;
	let dataToSend = JSON.stringify({ "action": actionString })

	let hourglass = document.getElementById("hourglass")
	hourglass.style.display = "block";
	socket.emit("gameaction", dataToSend);
}


function killCardFromDeck(cardString) {

	// Find out what the card from deck is:
	let cardArray = cardString.split(" ");
	let cardstr = cardArray[cardArray.length - 1];
	let cardSrc = parseCard(cardstr);


	const deckContainer = document.getElementById("card-from-deck");
	deckContainer.setAttribute('style', "visibility:visible");
	// Create new card div
	const card = document.createElement("div");
	card.classList.add("card");
	// Create new image element for the card
	const cardImage = document.createElement("img");
	cardImage.src = cardSrc;
	cardImage.className = "card";
	cardImage.setAttribute('card-type', cardSrc);
	card.appendChild(cardImage);
	deckContainer.appendChild(card);

	let board = document.getElementById('cards-to-kill')
	board.setAttribute('activated', 1);

	// Deactivate all other buttons:
	const actionMenuButtons = document.getElementsByClassName("play-cards");
	for (let index = 0; index < actionMenuButtons.length; index++) {
		actionMenuButtons[index].disabled = true;
	}

	board.onclick = function (e) {
		if (e.target.className && e.target.className.indexOf('card') != -1 && e.target.getAttribute('card-type') != null && board.getAttribute('activated') == 1) {
			let cardToFall = e.target;
			cardToFall.setAttribute('selected', 1);
			let gameAction = JSON.stringify({ "action": e.target.getAttribute('card-index') });

			board.removeAttribute('activated')

			// Set the selected cards as unactivated:
			cardToFall.removeAttribute('selected')
			cardToFall.setAttribute('used', 1)

			deckContainer.setAttribute('style', "visibility:hidden");
			socket.emit("gameaction", gameAction)
			// activate all buttons:
			for (let index = 0; index < actionMenuButtons.length; index++) {
				actionMenuButtons[index].disabled = false;
			}
		}
	}
}

function playToSelf(cardArray, callback) {

	let cardsSelected = [];
	const playToSelfButton = document.getElementById("PlayToSelf");
	playToSelfButton.innerHTML = 'Play selected cards';
	playToSelfButton.setAttribute('activated', 1)
	playToSelfButton.addEventListener("click", function () {
		playToSelfButton.innerHTML = 'Play To Self';
		humanDeck.removeAttribute('activated');
		playToSelfButton.removeAttribute('activated')
		cardsSelected.forEach((key, value) => {
			cardArray[1] = cardArray[1].concat(" " + value);
		})
		callback(cardArray)
		return;
	});
	let humanDeck = document.getElementById('bottom')
	humanDeck.setAttribute('activated', 1)

	humanDeck.onclick = function (e) {
		if (e.target.className && e.target.className.indexOf('card') != -1 && e.target.getAttribute('card-type') != null && humanDeck.getAttribute('activated') == 1) {
			let cardToPlay = e.target;
			if (cardToPlay.getAttribute('selected') == 1) {
				cardToPlay.removeAttribute('selected')
				delete cardsSelected[e.target.getAttribute('card-index')];
			}
			else {
				let cardPair = "";
				cardPair = cardPair.concat(e.target.getAttribute('card-index'));

				cardToPlay.setAttribute('selected', 1);
				cardsSelected[e.target.getAttribute('card-index')] = cardPair;
			}
		}
	}
}

function playToOther(cardArray, playToOtherButton, callback) {

	let cardsSelected = [];
	playToOtherButton.innerHTML = 'Play selected cards';
	playToOtherButton.setAttribute('activated', 1)
	playToOtherButton.addEventListener("click", function () {
		playToOtherButton.innerHTML = 'Attack';
		playToOtherButton.removeAttribute('activated')
		humanDeck.removeAttribute('activated');
		cardsSelected.forEach((key, value) => {
			cardArray[1] = cardArray[1].concat(" " + value);
		})
		callback(cardArray)
		return;
	});
	let humanDeck = document.getElementById('bottom')
	humanDeck.setAttribute('activated', 1)

	humanDeck.onclick = function (e) {
		if (e.target.className && e.target.className.indexOf('card') != -1 && e.target.getAttribute('card-type') != null && humanDeck.getAttribute('activated') == 1) {
			let cardToPlay = e.target;
			if (cardToPlay.getAttribute('selected') == 1) {
				cardToPlay.removeAttribute('selected')
				delete cardsSelected[e.target.getAttribute('card-index')];
			}
			else {
				let cardPair = "";
				cardPair = cardPair.concat(e.target.getAttribute('card-index'));

				cardToPlay.setAttribute('selected', 1);
				cardsSelected[e.target.getAttribute('card-index')] = cardPair;
			}
		}
	}
}

function playFallHand(cardArray, callback) {

	let cardsSelected = [];
	const playCardsButton = document.getElementById("PlayFallFromHand");
	playCardsButton.innerHTML = 'Play selected cards';
	playCardsButton.setAttribute('activated', 1)
	playCardsButton.addEventListener("click", function () {
		playCardsButton.innerHTML = 'Kill from Hand';
		playCardsButton.removeAttribute('activated', 1)
		callback(cardArray)
		return;
	});
	let humanDeck = document.getElementById('bottom')
	let board = document.getElementById('cards-to-kill')

	humanDeck.setAttribute('activated', 1)

	humanDeck.onclick = function (e) {
		if (e.target.className && e.target.className.indexOf('card') != -1 && e.target.getAttribute('card-type') != null) {
			let cardPair = "";
			cardPair = cardPair.concat(e.target.getAttribute('card-index'));
			let cardToPlay = e.target;
			// If a the hand is not activated, this means
			// that a card from hand is already selected, and the user is trying to deselect it
			if (!humanDeck.hasAttribute('activated')) {
				cardToPlay.removeAttribute('selected')
				humanDeck.setAttribute('activated', 1)
				board.removeAttribute('activated')
			}
			// If the hand is active, and the selected card has 'used' attribute
			// the user is trying to deselect the card and the card it is mapped to
			else if (cardToPlay.hasAttribute('used')) {
				// Remove the used attribute of both cards
				cardToPlay.removeAttribute('used')
				// Split cardArray[1] on spaces
				let cardArraySplitted = cardArray[1].split(" ");
				// Find an element that starts with card_str
				card_str = e.target.getAttribute('card-index');
				// console.log(card_str)
				let index = -1;
				for (let i = 0; i < cardArraySplitted.length; i++) {
					if (cardArraySplitted[i].startsWith(card_str)) {
						index = i;
						break;
					}
				}
				// If the card is not found, return
				if (index == -1) {
					return;
				}
				let cardPair = cardArraySplitted[index];
				console.log(cardPair)
				// Get the card to fall, i.e. split the cardPair on comma and take the second element
				let cardsSplit = cardPair.split(",");
				console.log(cardsSplit)
				let cardToFall_str = cardsSplit[1];
				// Find the card from cards-to-kill that has the cardToFall_str as card-index
				let cardToFall = board.querySelector(`[card-index="${cardToFall_str}"]`);
				console.log(cardToFall)
				cardToFall.removeAttribute('used');
				// Remove the pair from cardArray[1]
				let cardPair_str = 
				cardArray[1] = cardArray[1].replace(cardPair, "");
				cardArray[1] = cardArray[1].replace("  ", " ");

			} else {
				// If the hand is active, the user is trying to select a card from hand
				cardToPlay.setAttribute('selected', 1);
				board.setAttribute('activated', 1)
				humanDeck.removeAttribute('activated');
			}
			board.onclick = function (e) {
				if (e.target.className && e.target.className.indexOf('card') != -1 && e.target.getAttribute('card-type') != null && board.getAttribute('activated') == 1) {
					let cardToFall = e.target;
					cardToFall.setAttribute('selected', 1);

					// Concat the card pair to string:
					cardPair = cardPair.concat("," + e.target.getAttribute('card-index'));
					cardArray[1] = cardArray[1].concat(" " + cardPair);

					board.removeAttribute('activated')

					// Set the selected cards as unactivated:
					cardToFall.removeAttribute('selected')
					cardToPlay.removeAttribute('selected')

					cardToFall.setAttribute('used', 1)
					cardToPlay.setAttribute('used', 1)
					humanDeck.setAttribute('activated', 1)
				}
			}
		}
	}
}


function parseCard(cardString) {
	//This string parses given card string in to valid img src:
	const splitString = cardString.split(/(\d+)/);
	let cardName;
	if (splitString[0] == "H") {
		cardName = "hearts";
	}
	else if (splitString[0] == "C") {
		cardName = "clubs";
	}
	else if (splitString[0] == "S") {
		cardName = "spades";
	}
	else if (splitString[0] == "D") {
		cardName = "diamonds"
	}

	let cardNumber = splitString[1];
	let parsedString = cardNumber + "_of_" + cardName;
	let imgSrc = "/images/cards/" + parsedString + ".png";
	return imgSrc;
}


function updateState(stateJson, emptyState, gameActionString) {
	let currentState = document.getElementById('board');
	let tempElement = document.createElement('div');
	tempElement.innerHTML = emptyState;
	if (currentState == null || tempElement == null || stateJson.error) {
		return null;
	}
	currentState.replaceWith(tempElement);

	// Showing the current action:
	let gameActionText = document.getElementById("gameaction");
	gameActionText.innerHTML = gameActionString;
	// Rendering players cards:

	// Find which index is the human player FIRST,
	// so that we can position other players to a round table: next player is left, next is top and last is right.
	let humanIndex = 0;
	for (let playerIndex = 0; playerIndex < stateJson.players.length; playerIndex++) {
		//Splitting the players name by first numeric character
		let isBot = stateJson.players[playerIndex].is_bot;
		let currentName = stateJson.players[playerIndex].name;
		if (!isBot && currentName == PLAYER_NAME) { // Player is human and the current user:
			humanIndex = playerIndex;
		}
	}

	// Position the Bots
	// The positions are like this {bottom: humanidx, left: (humanidx+1)%4, top: (humanidx+2)%4, right: (humanidx+3)%4)}
	for (let playerIndex = 0; playerIndex < stateJson.players.length; playerIndex++) {
		let containerName;
		let cardContainer;
		// Player is human:
		if (playerIndex == humanIndex) {
			containerName = "bottom";
		}
		else if (playerIndex == (humanIndex + 1) % 4) {
			containerName = "left";
		} else if (playerIndex == (humanIndex + 2) % 4) {
			containerName = "top";
		}
		else if (playerIndex == (humanIndex + 3) % 4) {
			containerName = "right";
		}
		cardContainer = document.getElementById(containerName);
		cardContainer.innerHTML = stateJson.players[playerIndex].name;

		//First make sure there are no turn, target or initiator attributes on the cardContainers:
		cardContainer.removeAttribute("target")
		cardContainer.removeAttribute("initiator")
		cardContainer.removeAttribute("turn")
		cardContainer.removeAttribute("turn_and_target")
		// Add target attribute to the target players div:
		if (stateJson.players[playerIndex].name == stateJson.target) {
			cardContainer.setAttribute("target", 1);
		}

		if (stateJson.players[playerIndex].name == stateJson.initiator) {
			cardContainer.setAttribute("initiator", 1);
		}

		if (stateJson.players[playerIndex].name == stateJson.turn) {
			cardContainer.setAttribute("turn", 1);
		}

		if (stateJson.players[playerIndex].name == stateJson.target && stateJson.players[playerIndex].name == stateJson.turn) {
			cardContainer.removeAttribute("target")
			cardContainer.removeAttribute("turn")
			cardContainer.setAttribute("turn_and_target", 1);
		}
		// Get the card container element

		// Selecting current indeces player:
		let playerState = stateJson.players[playerIndex];

		// If show_eval_tickbox is checked, show the evaluation of the player next to its name
		if (document.getElementById("show-evaluation-tickbox").checked &&  stateJson.players[playerIndex].name == PLAYER_NAME) {
			let evalTextString = stateJson.players[playerIndex].last_evaluation;
			cardContainer.innerHTML = cardContainer.innerHTML + " (" + evalTextString + ")";
		}

		for (let index = 0; index < playerState.cards.length; index++) { // Loop through the cards:
			let parsedString;
			let cardString
			if (playerIndex == humanIndex) {
				cardString = playerState.cards[index];
				parsedString = parseCard(cardString)
			}
			else {
				cardString = "card-back";
				parsedString = "/images/cards/card_back.png";
			}

			// Create new card div
			const card = document.createElement("div");
			card.classList.add("card");

			// Create new image element for the card
			const cardImage = document.createElement("img");
			cardImage.src = parsedString;
			cardImage.className = "card";

			cardImage.setAttribute('parentContainer', containerName);
			cardImage.setAttribute('card-type', cardString);
			cardImage.setAttribute('card-index', index);

			// Append the image, heading, and paragraph elements to the card element
			card.appendChild(cardImage);
			card.setAttribute('parentContainer', containerName);
			// Append the card element to the card container
			cardContainer.appendChild(card);

			// Check if the card matches to any of the cards to kill or killed cards:
			if (playerIndex == humanIndex) {
				const isMatch = hasMatchingCards(cardString, stateJson.killed_cards, stateJson.cards_to_kill);
				if (isMatch) {
					card.setAttribute('has-matching-cards', 1);
				}

				// Check if the card can kill any of the cards to kill:
				const canKill = canKillCards(cardString, stateJson.cards_to_kill, stateJson.trump_card);
				if (canKill) {
					card.setAttribute('can-kill', 1);
				}
			}
		}

	}

	// Rendering cards to kill:
	const cardsToKillContainer = document.getElementById("cards-to-kill");
	cardsToKillContainer.replaceChildren();
	cardsToKillContainer.innerHTML = "Cards to Kill";
	for (let index = 0; index < stateJson.cards_to_kill.length; index++) {

		let cardString = stateJson.cards_to_kill[index];
		let parsedString = parseCard(cardString)

		// Create new card div
		const card = document.createElement("div");
		card.classList.add("card");

		// Create new image element for the card
		const cardImage = document.createElement("img");
		cardImage.src = parsedString;
		cardImage.className = "card";
		cardImage.setAttribute('card-type', cardString);
		cardImage.setAttribute('card-index', index);
		// Append the image, heading, and paragraph elements to the card element
		card.appendChild(cardImage);

		// Append the card element to the card container
		cardsToKillContainer.appendChild(card);
	}

	const killedCardsContainer = document.getElementById("killed-cards");
	killedCardsContainer.replaceChildren();
	killedCardsContainer.innerHTML = "Killed Cards";
	for (let index = 0; index < stateJson.killed_cards.length; index++) {

		let cardString = stateJson.killed_cards[index];
		let parsedString = parseCard(cardString)

		// Create new card div
		const card = document.createElement("div");
		card.classList.add("card");

		// Create new image element for the card
		const cardImage = document.createElement("img");
		cardImage.src = parsedString;
		cardImage.className = "card";
		cardImage.setAttribute('card-type', cardString);
		cardImage.setAttribute('card-index', index);
		cardImage.setAttribute('card-killed', 1);
		// Append the image, heading, and paragraph elements to the card element
		card.appendChild(cardImage);

		// Append the card element to the card container
		killedCardsContainer.appendChild(card);
	}

	// Rendering amount of cards left in the deck and the trump card:
	const deckContainer = document.getElementById("deck");
	deckContainer.innerHTML = "";
	// Create new card div
	const card = document.createElement("div");
	const card2 = document.createElement("div");
	card.classList.add("card");
	card2.classList.add("card");
	// Create new image element for the card
	const cardImage = document.createElement("img");
	const cardImage2 = document.createElement("img");
	cardImage.src = "/images/cards/card_back.png";
	cardImage.className = "card";
	cardImage.setAttribute('card-type', "card_back");

	let cardString = stateJson.trump_card;
	let parsedCard = parseCard(cardString);
	cardImage2.src = parsedCard;
	cardImage2.className = "card";
	cardImage2.setAttribute('card-type', "card_back");

	// If no cards in deck, make trump 50% opaque
	if (stateJson.deck_left == 0) {
		cardImage2.style.opacity = "0.5";
	}
	// If <= 1 card in deck, do not render the card-back representing deck
	if (stateJson.deck_left <= 1) {
		cardImage.style.opacity = "0.0";
	}



	// Append the image, heading, and paragraph elements to the card element
	card.appendChild(cardImage);
	card2.appendChild(cardImage2);

	// Append the card elements to the card container
	const amountLeft = document.createElement("p");
	amountLeft.className = "amount-left";
	amountLeft.innerHTML = "Cards left: " + stateJson.deck_left;
	deckContainer.appendChild(card);
	deckContainer.appendChild(card2);
	deckContainer.appendChild(amountLeft);

	// Render the updated state immediately

}

function hasMatchingCards(card, killed_cards, cards_to_kill) {
	const cardToCheck = card.substring(1); // Extract the card number (e.g., "6" from "H6")

	// Extract the card numbers from the lists and check for matches
	const numbersInList1 = killed_cards.map(card => card.substring(1));
	const numbersInList2 = cards_to_kill.map(card => card.substring(1));
	// Check if the card number exists in either list
	const isMatchInList1 = numbersInList1.includes(cardToCheck);
	const isMatchInList2 = numbersInList2.includes(cardToCheck);
	return isMatchInList1 || isMatchInList2;
}

function canKillCards(card, cards_to_kill, trump_card) {
	// Suit of the card
	const suitToCheck = card[0]; // Extract the card suit (e.g., "H" from "H6")
	const rankToCheck = parseInt(card.substring(1)); // Extract the card rank (e.g., "6" from "H6")
	// Suit of the trump card
	const trump_suit = trump_card[0];
	// Check if the card is of same suit and higher rank than any of the cards to kill
	const suitsInList = cards_to_kill.map(card => card[0]);
	// Extract the card numbers from the lists and check for matches
	const numbersInList = cards_to_kill.map(card => parseInt(card.substring(1)));
	// Check if the card is of same suit and higher rank
	let foundCard = false;
	for (let index = 0; index < suitsInList.length; index++) {
		if (suitToCheck == trump_suit && suitsInList[index] != trump_suit) { // If the card is of trump suit, it can kill any card
			foundCard = true;
			break;
		}
		if (suitToCheck == suitsInList[index] && rankToCheck > numbersInList[index]) { // Only need to find one card which matches:
			foundCard = true;
			break;
		}
	}
	return foundCard
}

function toggleMatchingCards() {
	const cards = document.querySelectorAll(".card");
	cards.forEach(card => {
		const hasMatchingCards = card.hasAttribute("has-matching-cards")
		if (!hasMatchingCards && card.getAttribute("parentcontainer") == "bottom" && card.tagName == "DIV") {
			if (card.getAttribute("not-matching-cards-style") == null) {
				card.setAttribute("not-matching-cards-style", 1);
			} else {
				card.removeAttribute("not-matching-cards-style");
			}
		}
	});
}

function toggleCanKillCards() {
	const cards = document.querySelectorAll(".card");
	cards.forEach(card => {
		const canKill = card.hasAttribute("can-kill")
		if (!canKill && card.getAttribute("parentcontainer") == "bottom" && card.tagName == "DIV") {
			if (card.getAttribute("can-not-kill-style") == null) {
				card.setAttribute("can-not-kill-style", 1);
			} else {
				card.removeAttribute("can-not-kill-style");
			}
		}
	});
}