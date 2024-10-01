let CURRENT_USER = "TutorialPlayer";
let TUTORIAL_STATE_2 = `{
    "trump_card": "S2",
    "deck_left": 27,
    "cards_to_kill": [
        "H3"
    ],
    "killed_cards": [],
    "target": "TutorialPlayer",
    "initiator": "p1rkk0",
    "turn": "TutorialPlayer",
    "players": [
        {
            "name": "TutorialPlayer",
            "pid": 0,
            "rank": null,
            "ready": true,
            "finished": 0,
            "is_bot": false,
            "last_evaluation": 0.57,
            "cards": [
                "C7",
                "S3",
                "S7",
                "S10",
                "C14",
                "S5",
                "C7",
                "S3",
                "S7",
                "S10",
                "C14",
                "S5",
                "C7",
                "S3",
                "S7",
                "S10",
                "C14",
                "S5"
            ],
            "playable_moves": [
                "EndTurn",
                "PlayToSelf",
                "PlayFallFromHand",
                "PlayFallFromDeck"
            ]
        },
        {
            "name": "Johanna",
            "pid": 1,
            "rank": null,
            "ready": true,
            "finished": 0,
            "is_bot": true,
            "last_evaluation": 0.61,
            "cards": [
                "S12",
                "S6",
                "H7",
                "H8",
                "D2",
                "D5"
            ],
            "playable_moves": []
        },
        {
            "name": "Aaron",
            "pid": 2,
            "rank": null,
            "ready": true,
            "finished": 0,
            "is_bot": true,
            "last_evaluation": 0.49,
            "cards": [
                "C8",
                "D11",
                "H4",
                "C6",
                "C10",
                "S8"
            ],
            "playable_moves": []
        },
        {
            "name": "p1rkk0",
            "pid": 3,
            "rank": null,
            "ready": true,
            "finished": 0,
            "is_bot": true,
            "last_evaluation": 0.66,
            "cards": [
                "D10",
                "C13",
                "D14",
                "D13",
                "S13",
                "S4"
            ],
            "playable_moves": []
        }
    ]
}`

let TUTORIAL_STATE = `{
  "trump_card": "S4",
  "deck_left": 22,
  "cards_to_kill": [],
  "killed_cards": [
      "D6",
      "S11"
  ],
  "target": "Hannes",
  "initiator": "Laura",
  "turn": "TutorialPlayer",
  "players": [
      {
          "name": "Hannes",
          "pid": 0,
          "rank": null,
          "ready": true,
          "finished": 0,
          "is_bot": true,
          "last_evaluation": 0.42,
          "cards": [
              "C7",
              "C4",
              "C5",
              "C12",
              "H13"
          ],
          "playable_moves": []
      },
      {
          "name": "TutorialPlayer",
          "pid": 1,
          "rank": null,
          "ready": true,
          "finished": 0,
          "is_bot": false,
          "last_evaluation": 0.6,
          "cards": [
              "C13",
              "H5",
              "D11",
              "S8",
              "H11",
              "H10"
          ],
          "playable_moves": [
              "PlayToOther",
              "Skip"
          ]
      },
      {
          "name": "Johanna",
          "pid": 2,
          "rank": null,
          "ready": true,
          "finished": 0,
          "is_bot": true,
          "last_evaluation": 0.47,
          "cards": [
              "H14",
              "D9",
              "S5",
              "H4",
              "S12",
              "D8",
              "C3"
          ],
          "playable_moves": []
      },
      {
          "name": "Laura",
          "pid": 3,
          "rank": null,
          "ready": false,
          "finished": 0,
          "is_bot": true,
          "last_evaluation": 0.53,
          "cards": [
              "S6",
              "S3",
              "S14",
              "C10",
              "C11",
              "H3"
          ],
          "playable_moves": []
      }
  ]
}`;

let DEFAULT_BOARD_DIV = `<div id="board">
<div class="hourglass" id="hourglass" style="display: none"></div>
<div id="top" class="board-player"></div>
<div id="left" class="board-player" onmouseover="addTooltips(this,event)"></div>
<div id="middle" class="board-player">BOARD
  <div id="cards-to-kill" class="board-player" onclick="activateBoard(this,event)">Cards to kill</div>
  <div id="killed-cards" class="board-player" onclick="activateBoard(this,event)">Killed cards</div>
</div>
<div id="errormessage" hidden="true">Incorrect action:</div>
<div id="right" class="board-player"></div>
<p id="gameaction">test</p>
<div id="bottom-overflow-container">
    <div id="bottom" onclick="activateBoard(this,event)"class="board-player">
  	</div>
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
  <button id="reverse-move-button" class = "play-cards">Backward</button>
  <button id="next-move-button" class = "play-cards">Forward</button>
</div>
</div>`


let tutorialExplanationsJson = {
	"bottom": `This is your hand, you are always located on the bottom of the screen.\nYou can play cards from here by clicking on available actions below.\nYou can also click on your board to expand it upwards.\nThe color <span style="color: yellow;">yellow</span> tells you that it is that players turn.`,
	"left": "This is one of the opposing players hand, you can see the number of cards in their hand.\n",
	"top": "This is another opposing players hand, you can see the number of cards in their hand.\n",
	"right": `This is another opposing players hand, you can see the number of cards in their hand.\nThe color <span style="color: purple;">purple</span> tells you that this is the player for who the cards are played to, also called <span style="color: purple;">target</span>.`,
	"cards-to-kill": "This is the game board, you can see the cards which needs to be killed here.",
	"killed-cards": "This is the game board, you can see the cards which has already been killed during the game here.",
	"trump-card": "This indicates the trump cards color for the current game.\nTrump cards can be used to kill all other color and other trump cards with lower value.\nThis is also the last card of the deck.",
	"deck-left": "This indicates if there are any cards left in the deck.\nThe amount of cards left in the deck can be read from the text below.",
	"PlayFallFromHand": `This action is not currently available to you, since you are not the player who needs to kill cards currently.\nWhen you are the <span style="color: purple;">target</span>, you can press this button and pick cards as follows\n<ol><li>Pick a card to kill another card with.</li><li>Select a card which you want to kill.</li><li>Repeat until you are satisfied, and press this button again.</li></ol>`,
	"PlayFallFromDeck": `This action is not currently available to you, since you are not the player who needs to kill cards currently.\nWhen you are the <span style="color: purple;">target</span> and there are cards left in the deck, you can press this button to try to kill one of the cards with the top card of the deck.\nIf the card is able to kill one of the cards on the table, it appears on the left side of the board and you can choose a card to kill with it.\nIf the card is not able to kill any of the cards on the table, it appears on the game board and you need to kill it before you can kill from the deck again.`,
	"PlayToSelf": `This action is not currently available to you, since you are not the player who needs to kill cards currently.\nWhen you are the <span style="color: purple;">target</span> and you have a card on your hand with the same value as one of the cards currently on the game board, you can press this button to play a card to yourself`,
	"PlayToOther": `This action is currently available to you, since it is currently your turn and you are <b> not the target </b>.\nYou can press this button to play cards to the <span style="color: purple;">target</span> as follows\n<ol><li>Pick the cards to play to the <span style="color: purple;">target</span> (you can select multiple and deselect the ones already clicked).</li><li>Click this button again when you are ready to attack</li></ol>`,
	"InitialPlay": `This action is not currently available to you.\nThis action is only available when it is your turn, and the <b>target<\b> has no cards to kill yet.\nThis action is used to play the first cards for the current <b>target<\b>.`,
	"Skip": `This action is currently available to you, since it is currently your turn and you are <b>not the target</b>.\nYou can press this button to skip your turn if you do not wish to attack.`,
	"EndTurn": `This action is not currently available, since you are not the player who needs to kill cards currently.\nWhen you are the <span style="color: purple;">target</span>, you can press this button to end your turn\nIf there are any cards left to kill, you will pick up them to your hand.`,
	"DrawAll": `This action is not currently available, since you are not the player who needs to kill cards currently.\nWhen you are the <span style="color: purple;">target</span>, you can press this button to pick up all the cards on the game board (both killed and not killed cards) and end your turn`,
	"Refresh": `You can press this button to refresh the games state.\nYou can use this to cancel other active buttons.\nThis will always reload the newest state of the game.`,
	"reverse-move-button": `You can press this button go backwards and look at the previous states of the current game.`,
	"next-move-button": `You can press this button go forwards and look at the next states of the game (unless you are on the newest state).`

}


if (document.readyState !== "loading") {
	initializeTutorial();
} else {
	document.addEventListener("DOMContentLoaded", function () {
		initializeTutorial();
	});
}


function initializeTutorial() {
	const tooltip = document.getElementById('cursorTooltip');
	// Add event listeners to show/hide the tooltip
	let tutorialJsonState = JSON.parse(TUTORIAL_STATE);
	updateState(tutorialJsonState, DEFAULT_BOARD_DIV, "");
	checkActionState(tutorialJsonState)
}



function activateBoard(button, event) {
	if (event.target.className != "card") {
		button.classList.toggle('active');
	}
}


function addTooltips(element) {
	element.onmouseenter = function (e) {
		let toolTipText = "This is " + element.id;
		if (tutorialExplanationsJson[element.id]) {
			toolTipText = tutorialExplanationsJson[element.id];
		};
		showTooltip(e, toolTipText);
	}
	element.onmouseleave = function (e) {
		hideTooltip();
	}
}

function checkActionState(stateJson) {
	const actionMenuButtons = document.getElementsByClassName("play-cards");

	// First make sure that all of the buttons are hidden (if they have previously been unhidden.)
	for (let index = 0; index < actionMenuButtons.length; index++) {
		actionMenuButtons[index].disabled = true;
		addTooltips(actionMenuButtons[index])
	}

	// Find the player whos turn it is now:
	let playerName = stateJson.turn;

	let playerIndex;
	//Find human player index:
	for (let index = 0; index < stateJson.players.length; index++) {
		if (!stateJson.players[index].is_bot) {
			playerIndex = index;
		}

	}

	// Then make all of the buttons which are included in the stateJson visible:
	for (let index = 0; index < actionMenuButtons.length; index++) {

		if (["Refresh", "reverse-move-button", "next-move-button"].includes(actionMenuButtons[index].id)) {
			actionMenuButtons[index].disabled = false;
			continue;
		}

		// Check if the initiator actions includes the buttons id and that the player whos turn is now is the player:
		if (stateJson.players[playerIndex].playable_moves.includes(actionMenuButtons[index].id) && playerName == stateJson.players[playerIndex].name) {
			actionMenuButtons[index].disabled = false;

			//Make it so refresh button is always visible:
			if (actionMenuButtons[index].id == "EndTurn") { // In case of the action being end turn, we also need  to make draw all button visible and add event listener to it.
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
		if (!stateJson.players[playerIndex].is_bot) { // Player is human:
			humanName = stateJson.players[playerIndex].name;
		}
	}

	//Case when human plays :
	if (stateJson.action == "PlayFallFromHand") {
		let cardArray = ["PlayFallFromHand", ""];
		playFallHand(cardArray, function (temp) {
			let actionCards = cardArray[1].split(" ")
			let cardpairs = "";
			for (let index = 1; index < actionCards.length; index++) {
				let cardpair = actionCards[index];
				cardpairs = cardpairs + " " + cardpair;
			}
			let actionString = "PlayFallFromHand;" + cardpairs
			sendGameAction(actionString);
			return temp;
		});
	}

	if (stateJson.action == "PlayFallFromDeck") {
		let returnString = "PlayFallFromDeck;"
		sendGameAction(returnString)
	}

	if (stateJson.action == "PlayToOther") {
		let cardArray = ["PlayToOther", ""];
		const playToOtherButton = document.getElementById("PlayToOther");
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
		playToSelf(cardArray, function (temp) {
			let actionString = createCardString(cardArray)
			sendGameAction(actionString)
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
		if (e.target.className && e.target.className.indexOf('card') != -1 && e.target.getAttribute('card-type') != null && humanDeck.getAttribute('activated') == 1) {
			let cardPair = "";
			cardPair = cardPair.concat(e.target.getAttribute('card-index'));
			let cardToPlay = e.target;
			cardToPlay.setAttribute('selected', 1);
			board.setAttribute('activated', 1)
			humanDeck.removeAttribute('activated');
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
	if (currentState == null || tempElement == null) {
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
		if (!isBot && currentName == CURRENT_USER) { // Player is human and the current user:
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
		addTooltips(cardContainer)
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
		if (document.getElementById("show-evaluation-tickbox").checked && !playerState.is_bot) {
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
			// Append the card element to the card container
			cardContainer.appendChild(card);
		}

	}

	// Rendering cards to kill:
	const cardsToKillContainer = document.getElementById("cards-to-kill");
	cardsToKillContainer.replaceChildren();
	cardsToKillContainer.innerHTML = "Cards to Kill";
	addTooltips(cardsToKillContainer);
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
	addTooltips(killedCardsContainer);
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
	card.id = "deck-left";
	card2.appendChild(cardImage2);
	card2.id = "trump-card";
	addTooltips(card);
	addTooltips(card2);
	// Append the card elements to the card container
	const amountLeft = document.createElement("p");
	amountLeft.className = "amount-left";
	amountLeft.innerHTML = "Cards left: " + stateJson.deck_left;
	deckContainer.appendChild(card);
	deckContainer.appendChild(card2);
	deckContainer.appendChild(amountLeft);

	// Render the updated state immediately

}

// Function to show the tooltip at the cursor position
function showTooltip(event, tooltipText) {
	const tooltip = document.getElementById('cursorTooltip');
	tooltip.innerHTML = tooltipText;
	tooltip.style.display = 'block';
	tooltip.style.left = (event.pageX + 10) + 'px';
	tooltip.style.top = (event.pageY + 10) + 'px';
}

// Function to hide the tooltip
function hideTooltip() {
	const tooltip = document.getElementById('cursorTooltip');
	tooltip.style.display = 'none';
}