
let boardDiv;// Saving the original state:
let DEFAULT_BOARD_DIV = `<div id="board">
<div class="hourglass" id="hourglass" style="display: none"></div>
<div id="top" class="board-player"></div>
<div id="left" class="board-player"></div>
<div id="middle" class="board-player">BOARD
  <div id="cards-to-kill" class="board-player" onclick="activateBoard(this,event)">Cards to kill</div>
  <div id="killed-cards" class="board-player" onclick="activateBoard(this,event)">Killed cards</div>
</div>
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
</div>
</body>`
// Global array of game states
let STATE_ARRAY = [];
let DISPLAY_STATE_INDEX = 0;

let gameTurnIndex = 0;
let turnTime = 1500;
if (document.readyState !== "loading") {
  
  let hourglass = document.getElementById("hourglass")
  console.log(document.gameStart)
  
  hourglass.style.display = "block";
  socket.emit(document.gameStart,"true")
  socket.on('data', (data) => {
      
    hourglass.style.display = "none";
    console.log("GETTING DATA")
    initializeCode(data)
  })

  
  socket.on('exit',(data) => {
    renderGameOver(data)
  })
  } else {
    console.log("Loading!")
      
  document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM READY")
    
    let hourglass = document.getElementById("hourglass")
    hourglass.style.display = "block";
    socket.emit(document.gameStart,"true")
    socket.on('data', (data) => {    
      hourglass.style.display = "none";
      console.log("GETTING DATA")
      initializeCode(data)
    })

    socket.on('exit',(data) => {
      renderGameOver(data)
    })
    
  });
  }

  function sleepFunction(millisec) {
    return new Promise(resolve => {
        setTimeout(() => { resolve('') }, millisec);
    })
}

function activateBoard(button,event) {
  if(event.target.className!="card") {
    button.classList.toggle('active');
  }
}

function goOneMoveBack() {
  console.log("There are "+STATE_ARRAY.length+" states in the STATE_ARRAY")
  DISPLAY_STATE_INDEX -= 1;
  if(DISPLAY_STATE_INDEX < 0) {
    console.log("No more moves to reverse!")
    DISPLAY_STATE_INDEX = 0;
  }
  console.log("Display state index is: "+DISPLAY_STATE_INDEX)
  updateState(STATE_ARRAY[DISPLAY_STATE_INDEX],DEFAULT_BOARD_DIV,"")
  checkActionState(STATE_ARRAY[DISPLAY_STATE_INDEX])
}

function goOneMoveForward() {
  console.log("There are "+STATE_ARRAY.length+" states in the stateArray")
  DISPLAY_STATE_INDEX += 1;
  // Render game to the next state using updateState function
  if(DISPLAY_STATE_INDEX >= STATE_ARRAY.length) {
    DISPLAY_STATE_INDEX = STATE_ARRAY.length-1;
  }
  console.log("Display state index is: "+DISPLAY_STATE_INDEX)
  updateState(STATE_ARRAY[DISPLAY_STATE_INDEX],DEFAULT_BOARD_DIV,"")
  checkActionState(STATE_ARRAY[DISPLAY_STATE_INDEX])
}


function renderGameOver(data) {
  let currentState = document.getElementById('board');
  console.log("Rendering game over!")
  
  let endElement = document.createElement('div');
  let endState = `<div id="gameover"> GAME OVER!
  </div>
  `
  endElement.innerHTML = endState;
  currentState.replaceWith(endElement);
  return;
}

async function initializeCode(gameArray) {
  //Checking to see if last gameAction is from killing from deck:
  console.log(gameArray)
  try{
    console.log(gameArray.gameprogress[gameArray.gameprogress.length-1].split(":"))
    if(gameArray.gameprogress[gameArray.gameprogress.length-1].split(":")[0] == "Lifted card from deck") {
      console.log(gameArray.gameprogress[gameArray.gameprogress.length-1])
      killCardFromDeck(gameArray.gameprogress[gameArray.gameprogress.length-1])
    }}
    catch(e){
      console.log("Something went wrong: "+e)
    }
  if(gameArray.gamestates.length != 0) { 
    
    let connectionIter = 0;
    let gameResponse;

    let slider = document.getElementById('timeslider');
    let sliderValue = document.getElementById('timeslidervalue');
    sliderValue.textContent = "Seconds per turn: "+(turnTime/1000).toFixed(1);
    slider.addEventListener('input', () => {
      turnTime = slider.value * 100; 
      sliderValue.textContent = "Seconds per turn: "+(turnTime/1000).toFixed(1);
    });

    stateArray = gameArray.gamestates;
    gameProgress = gameArray.gameprogress;

    console.log(gameProgress)
    console.log(stateArray)
    
    // Save the boardDiv:s state only if its null:
    if(boardDiv == null) {
      boardDiv = DEFAULT_BOARD_DIV;
    }

    let stateJson, gameActionString;
    let turnStringIndex = 0;
    

    for (let turnIndex=0; turnIndex < stateArray.length; turnIndex++) {
      stateJson = stateArray[turnIndex];
      STATE_ARRAY.push(stateJson);
      turnStringIndex += 1;
      gameTurnIndex += 1;
      console.log(stateJson)
      await sleepFunction(turnTime)
      gameActionString = "Turn: "+gameTurnIndex;
      updateState(stateJson,boardDiv,gameActionString)
    } 
    DISPLAY_STATE_INDEX = STATE_ARRAY.length-1;
    
    updateState(stateJson,boardDiv,"Your turn ("+gameTurnIndex+")")
    //updateState(stateArray[stateArray.length-1],gameActionString)

    

    checkActionState(stateArray[stateArray.length-1])
    turnIndex = gameArray.gameindex-1;

    refreshButton = document.getElementById('Refresh');
    refreshButton.addEventListener("click", function() {
      let newboardDiv = document.getElementById('board');
      let tempElement = document.createElement('div');
      tempElement.innerHTML = boardDiv;
      newboardDiv.replaceWith(tempElement);
      socket.emit('pingSocket',"ping")
    });

    // Add event listener for 'reverse-move-button', which renders the previous state of the game
    reverseMoveButton = document.getElementById('reverse-move-button');
    reverseMoveButton.addEventListener("click", goOneMoveBack);

    // Add event listener for 'next-move-button'
    nextMoveButton = document.getElementById('next-move-button');
    nextMoveButton.addEventListener("click",goOneMoveForward);
  }

}


function checkActionState(stateJson) {
  const actionMenuButtons = document.getElementsByClassName("play-cards");

  // First make sure that all of the buttons are hidden (if they have previously been unhidden.)
  for (let index = 0; index < actionMenuButtons.length; index++) {
    actionMenuButtons[index].disabled = true;
  }

  // Find the player whos turn it is now:
  let playerName = stateJson.turn; 

  let playerIndex;
  //Find human player index:
  for (let index = 0; index < stateJson.players.length; index++) {
    if(!stateJson.players[index].is_bot) {
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
    if(stateJson.players[playerIndex].playable_moves.includes(actionMenuButtons[index].id) && playerName==stateJson.players[playerIndex].name) {
      actionMenuButtons[index].disabled = false; 

      //Make it so refresh button is always visible:
      console.log(actionMenuButtons[index].id)

      if(actionMenuButtons[index].id == "EndTurn") { // In case of the action being end turn, we also need  to make draw all button visible and add event listener to it.
        actionMenuButtons[index+1].disabled = false;
        actionMenuButtons[index+1].addEventListener("click",function() {
          //Modify the stateJson to contain the wanted action:
          stateJson.action = actionMenuButtons[index+1].id;
          playCards(stateJson)
        })
      }

      //Also add event listeners for the buttons, so that each of the buttons uses playCards function, which then checks what actions should be done.
      actionMenuButtons[index].addEventListener("click",function() {

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
  let actionString = action+"; "
  for (let index = 1; index < actionCards.length; index++) {
    const action = actionCards[index];
    if(index==actionCards.length-1) {
      
    actionString = actionString.concat(action);
    } else {
    actionString = actionString.concat(action+",");
    }
  }
  return actionString;
}

function playCards(stateJson) {
  // Find player name:
  let humanName;
  for (let playerIndex = 0; playerIndex < stateJson.players.length; playerIndex++) {
    if(!stateJson.players[playerIndex].is_bot){ // Player is human:
      humanName = stateJson.players[playerIndex].name;
     }
  }

  //Case when human plays :
  if(stateJson.action == "PlayFallFromHand") {
    let cardArray = ["PlayFallFromHand",""];
    playFallHand(cardArray,function(temp){
      console.log(cardArray)
      let actionCards = cardArray[1].split(" ")
      console.log(actionCards)
      let cardpairs="";
      for (let index = 1; index < actionCards.length; index++) {
        let cardpair = actionCards[index];
        cardpairs = cardpairs+" "+cardpair;
      }
      let actionString = "PlayFallFromHand;"+cardpairs
      console.log(actionString)
      sendGameAction(actionString);
      return temp;
    });
  }

  if(stateJson.action == "PlayFallFromDeck") {
    let returnString= "PlayFallFromDeck;"
    sendGameAction(returnString)
    console.log(returnString)
  }

  if(stateJson.action == "PlayToOther") {
    let cardArray = ["PlayToOther",""];
    const playToOtherButton = document.getElementById("PlayToOther");
    playToOther(cardArray,playToOtherButton,function(temp){
      let actionString = createCardString(cardArray)
      sendGameAction(actionString)
      console.log(temp)
      return temp;
    });
  }

  if(stateJson.action == "InitialPlay") {
    let cardArray = ["InitialPlay",""];
    const playToOtherButton = document.getElementById("InitialPlay");
    playToOther(cardArray,playToOtherButton,function(temp){
      let actionString = createCardString(cardArray);
      sendGameAction(actionString)
      return temp;
    });
  }
  
  if(stateJson.action == "PlayToSelf") {
      let cardArray = ["PlayToSelf",""];
      playToSelf(cardArray,function(temp){
        let actionString = createCardString(cardArray)
        sendGameAction(actionString)
        console.log(actionString)
        return temp;
      });
    }

    if(stateJson.action == "EndTurn") {
      let returnString = "EndTurn;n";
      sendGameAction(returnString)
      console.log(returnString)
    }

    if(stateJson.action == "DrawAll") {
      let returnString = "EndTurn;y";
      sendGameAction(returnString)
      console.log(returnString)
    }

    if(stateJson.action == "Skip") {
      let returnString = "Skip;";
      sendGameAction(returnString);
    }

}

function sendGameAction(actionString) {
  let dataToSend = JSON.stringify({"action": actionString})
  console.log(dataToSend)
  /*await fetch('http://localhost:3000/playmove', {
    method: 'POST',
    headers: { "Content-Type": "application/json" },
    body: dataToSend
    })
    .then(response => response.json())
    .then(data => {
      console.log(data)
    })*/
    
    let hourglass = document.getElementById("hourglass")
    hourglass.style.display = "block";
    socket.emit("gameaction",dataToSend);
}


function killCardFromDeck(cardString) {

  // Find out what the card from deck is:
  let cardArray = cardString.split(" ");
  let cardstr = cardArray[cardArray.length-1];
  let cardSrc = parseCard(cardstr);

  
  const deckContainer = document.getElementById("card-from-deck");
  deckContainer.setAttribute('style',"visibility:visible");
  // Create new card div
  const card = document.createElement("div");
  card.classList.add("card");
  // Create new image element for the card
  const cardImage = document.createElement("img");
  cardImage.src = cardSrc;
  cardImage.className = "card";
  cardImage.setAttribute('card-type',cardSrc);
  card.appendChild(cardImage);
  deckContainer.appendChild(card);

  let board = document.getElementById('cards-to-kill')
  board.setAttribute('activated',1);
  board.onclick = function(e){
    if(e.target.className && e.target.className.indexOf('card')!=-1 && e.target.getAttribute('card-type') != null && board.getAttribute('activated') == 1) {
      let cardToFall = e.target;
      cardToFall.setAttribute('selected',1);

      console.log(e.target.getAttribute('card-index'))
      let gameAction = JSON.stringify({"action": e.target.getAttribute('card-index')});

      board.removeAttribute('activated')
          
      // Set the selected cards as unactivated:
      cardToFall.removeAttribute('selected')
      cardToFall.setAttribute('used',1)
      
      deckContainer.setAttribute('style',"visibility:hidden");
      socket.emit("gameaction",gameAction)
    }
  }
}

function playToSelf(cardArray,callback) {

  const playToSelfButton = document.getElementById("PlayToSelf");
  playToSelfButton.innerHTML = 'Play selected cards';
  playToSelfButton.setAttribute('activated',1)
  playToSelfButton.addEventListener("click", function(){
    playToSelfButton.innerHTML = 'Play To Self';
    humanDeck.removeAttribute('activated');
    playToSelfButton.removeAttribute('activated')
    callback(cardArray)
    return;
  });
  let humanDeck = document.getElementById('bottom')
  humanDeck.setAttribute('activated',1)

  humanDeck.onclick = function(e) {
    if(e.target.className && e.target.className.indexOf('card')!=-1  && e.target.getAttribute('card-type') != null && humanDeck.getAttribute('activated') == 1) {
      let cardPair = "";
      cardPair = cardPair.concat(e.target.getAttribute('card-index'));
      let cardToPlay = e.target;
      cardToPlay.setAttribute('selected',1);
      cardArray[1] = cardArray[1].concat(" "+cardPair);
  }
}
}

function playToOther(cardArray,playToOtherButton,callback) {

  playToOtherButton.innerHTML = 'Play selected cards';
  playToOtherButton.setAttribute('activated',1)
  playToOtherButton.addEventListener("click", function(){
    playToOtherButton.innerHTML = 'Play To Other';
    playToOtherButton.removeAttribute('activated')
    humanDeck.removeAttribute('activated');
    callback(cardArray)
    return;
  });
  let humanDeck = document.getElementById('bottom')
  humanDeck.setAttribute('activated',1)

  humanDeck.onclick = function(e) {
    if(e.target.className && e.target.className.indexOf('card')!=-1  && e.target.getAttribute('card-type') != null && humanDeck.getAttribute('activated') == 1) {
      let cardPair = "";
      cardPair = cardPair.concat(e.target.getAttribute('card-index'));
      let cardToPlay = e.target;
      cardToPlay.setAttribute('selected',1);
      cardArray[1] = cardArray[1].concat(" "+cardPair);
  }
}
}

function playFallHand(cardArray,callback) {

    const playCardsButton = document.getElementById("PlayFallFromHand");
    playCardsButton.innerHTML = 'Play selected cards';
    playCardsButton.setAttribute('activated',1)
    playCardsButton.addEventListener("click", function(){
      playCardsButton.innerHTML = 'Select Fall from Hand';
      playCardsButton.removeAttribute('activated',1)
      callback(cardArray)
      return;
    });
    let humanDeck = document.getElementById('bottom')
    let board = document.getElementById('cards-to-kill')
    
    humanDeck.setAttribute('activated',1)

    humanDeck.onclick = function(e){
      if(e.target.className && e.target.className.indexOf('card')!=-1  && e.target.getAttribute('card-type') != null && humanDeck.getAttribute('activated') == 1) {
        let cardPair = "";
        cardPair = cardPair.concat(e.target.getAttribute('card-index'));
        let cardToPlay = e.target;
        cardToPlay.setAttribute('selected',1);
        board.setAttribute('activated',1)
        humanDeck.removeAttribute('activated');
        board.onclick = function(e){
        if(e.target.className && e.target.className.indexOf('card')!=-1 && e.target.getAttribute('card-type') != null && board.getAttribute('activated') == 1) {
          let cardToFall = e.target;
          cardToFall.setAttribute('selected',1);
          
          // Concat the card pair to string:
          cardPair = cardPair.concat(","+e.target.getAttribute('card-index'));
          cardArray[1] = cardArray[1].concat(" "+cardPair);
          
          board.removeAttribute('activated')
          
          // Set the selected cards as unactivated:
          cardToFall.removeAttribute('selected')
          cardToPlay.removeAttribute('selected')
          
          cardToFall.setAttribute('used',1)
          cardToPlay.setAttribute('used',1)
          humanDeck.setAttribute('activated',1)
          }
        }
      }
    }
  }


  function parseCard(cardString) {
    //This string parses given card string in to valid img src:
    const splitString = cardString.split(/(\d+)/);
    let cardName;
    if(splitString[0]=="H"){
    cardName = "hearts";
    }
    else if(splitString[0]=="C") {
      cardName = "clubs";
    }
    else if(splitString[0]=="S") {
      cardName = "spades";
    }
    else if(splitString[0]=="D") {
      cardName = "diamonds"
    }

    let cardNumber = splitString[1];
    let parsedString = cardNumber+"_of_"+cardName;
    let imgSrc = "/images/cards/"+parsedString+".png";
    return imgSrc;
  }


  function updateState(stateJson,emptyState,gameActionString) {
    let currentState = document.getElementById('board');
    let tempElement = document.createElement('div');
    tempElement.innerHTML = emptyState;
    if(currentState == null || tempElement == null) {
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
      if(!isBot){ // Player is human:
        humanIndex = playerIndex;
      }
    }

    // Position the Bots
    // The positions are like this {bottom: humanidx, left: (humanidx+1)%4, top: (humanidx+2)%4, right: (humanidx+3)%4)}
    for (let playerIndex = 0; playerIndex < stateJson.players.length; playerIndex++) {
    let containerName;
    let cardContainer;
    // Player is human:
    if(playerIndex == humanIndex){
      containerName = "bottom";
    }
    else if (playerIndex == (humanIndex+1)%4) {
      containerName = "left";
    }else if (playerIndex == (humanIndex+2)%4) {
      containerName = "top";
    }
    else if (playerIndex == (humanIndex+3)%4) {
      containerName = "right";
    }
    cardContainer = document.getElementById(containerName);
    cardContainer.innerHTML = stateJson.players[playerIndex].name;

    //First make sure there are no turn, target or initiator attributes on the cardContainers:
    cardContainer.removeAttribute("target")
    cardContainer.removeAttribute("initiator")
    cardContainer.removeAttribute("turn")
    // Add target attribute to the target players div:
    if(stateJson.players[playerIndex].name == stateJson.target) {
      cardContainer.setAttribute("target",1);
    }

    if(stateJson.players[playerIndex].name == stateJson.initiator) {
      cardContainer.setAttribute("initiator",1);
    }

    
    if(stateJson.players[playerIndex].name == stateJson.turn) {
      cardContainer.setAttribute("turn",1);
    }

    // Get the card container element

    // Selecting current indeces player:
    let playerState = stateJson.players[playerIndex];

    // If show_eval_tickbox is checked, show the evaluation of the player next to its name
    if(document.getElementById("show-evaluation-tickbox").checked && !playerState.is_bot) {
      let evalTextString = stateJson.players[playerIndex].last_evaluation;
      cardContainer.innerHTML = cardContainer.innerHTML + " ("+evalTextString+")";
    }

    for (let index = 0; index < playerState.cards.length; index++) { // Loop through the cards:
      let parsedString;
      let cardString
      if(playerIndex==humanIndex) {
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
      
      cardImage.setAttribute('parentContainer',containerName);
      cardImage.setAttribute('card-type',cardString);
      cardImage.setAttribute('card-index',index);

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
    cardImage.setAttribute('card-type',cardString);
    cardImage.setAttribute('card-index',index);
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
    cardImage.setAttribute('card-type',cardString);
    cardImage.setAttribute('card-index',index);
    cardImage.setAttribute('card-killed',1);
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
  cardImage.setAttribute('card-type',"card_back");

  let cardString = stateJson.trump_card;
  let parsedCard = parseCard(cardString);
  cardImage2.src = parsedCard;
  cardImage2.className = "card";
  cardImage2.setAttribute('card-type',"card_back");

  // If no cards in deck, make trump 50% opaque
  if (stateJson.deck_left == 0) {
    cardImage2.style.opacity = "0.5";
  }
  // If <= 1 card in deck, do not render the card-back representing deck
  if (stateJson.deck_left <= 1){
    cardImage.style.opacity = "0.0";
  }
  
  

  // Append the image, heading, and paragraph elements to the card element
  card.appendChild(cardImage);
  card2.appendChild(cardImage2);

  // Append the card elements to the card container
  const amountLeft = document.createElement("p");
  amountLeft.className = "amount-left";
  amountLeft.innerHTML = "Cards left: "+stateJson.deck_left;
  deckContainer.appendChild(card);
  deckContainer.appendChild(card2);
  deckContainer.appendChild(amountLeft);


  }