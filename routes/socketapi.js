var express = require('express');
var router = express.Router();
var path = require('path')
const io = require( "socket.io" )();
const { spawn } = require('child_process');
const  jwt = require('jsonwebtoken');
const { use } = require('./users');
const fetch = require('node-fetch');
const socketapi = {
    io: io
};
const fs = require('fs');
const {lobbyManager} = require('./lobbyapi');

let gameIndex = 0;
let gameStringIndex = 2;
let dataArrived;
let gameStates = [];
let gameProgress = [];

const usersAndGames = new Map();
const usersAndStateAndProgress = new Map();

io.use(function(socket, next){
  // Check if the user has a valid token. If not, then use default credentials.
  // if the socket is authenticated, then we continue with the connection
  if (socket.handshake.query && socket.handshake.query.token){
    jwt.verify(socket.handshake.query.token, process.env.SECRET, (err, user) => { 
      if(err) {
        console.log(err)
        console.log("Token verification failed. Using default credentials.")
        // username is 'Anonymous' + <random number between 1 and 1000>
        let username = 'Anonymous' + Math.floor(Math.random() * 10000);
        user = {
          username: username,
          //email : username + '@example.com',
        };
      }
      console.log("Authentication success!")
      socket.decoded = user;
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



io.on( "connection", function( socket ) {
  console.log( "An user connected" );
  // Send socket to the lobby manager:
  lobbyManager(socket);
  socket.on("gameaction",(data) => {
    // When the client sends a game action, send it to the python program.
    let actionJson = JSON.parse(data);
    console.log("Received game action from client: "+actionJson.action)
    // Find the correct python program corresponding to the user
    let pythonProg = usersAndGames.get(socket.decoded.username);
    if(pythonProg!=null) {
      pythonProg.stdin.write(actionJson.action+"\n");
      console.log("Sent game action to the server.")
    } 
    else {
      console.log("Game Program has shut down. Please restart.")
    }
  })

  socket.on("pingSocket",(data) => {
    // Emit the last state and progress to the client.
    console.log("Pinging back with current data:")
    let lastValues = returnLastStateAndProgress(socket);
    socket.emit('data',{"gamestates": lastValues.lastState,"gameprogress": lastValues.lastProgress, "gameindex":gameIndex, "dataArrived":dataArrived, "gamestringindex": gameStringIndex,"currentUser": socket.decoded},1000)
  })

  socket.on("disconnect", (data) => {
    killUserGameProcess(socket);
  })

  // Send existing game progress to client:
  socket.on("gamelogs", (data) => {
    // When the client requests the game logs, send it to the client.
    let stateAndProgress = usersAndStateAndProgress.get(socket.decoded.username);
    if(stateAndProgress != undefined) {
      socket.emit('rendergamelogs',{"gamelogs": stateAndProgress[1]});
    } else {
      socket.emit('rendergamelogs',{"gamelogs": "No game in progress!"});
    }
  })

  socket.on("gamestart",(data) => {
    // Begin a new game for the user.
    startGame(socket, childProcessDataListener);
  })
    
  socket.on("gamereconnect",(data) => {
    // For now, do exactly the same thing as gamestart.
    // In the future, we can use the data to reconnect to a previous game.
    startGame(socket, childProcessDataListener);
  })

  socket.on("chatmessage",(data) => {
    receiveChatMessage(socket,data);
  });

  socket.on("chatHistory",(data) => {
    emitChatHistory(socket,data);
  })


/**
* Parses the child process data and emits it to the socket.
* @param {string} data - The data received from the child process.
*/
const childProcessDataListener = (data) => {
  
  let parsedData = parseChildProcessData(data,socket);
  socket.emit('data',{"gamestates": parsedData.gameStates,"gameprogress": parsedData.gameProgress, "gameindex":gameIndex, "dataArrived":dataArrived, "gamestringindex": gameStringIndex,"currentUser": socket.decoded},1000)

 }




/**
 * Parses the data from the python program and sends it to the client.
 * Returns the game states and progress as an array.
 * @param {Buffer} data - The data received from the child process.
 * @param {Object} socket - The socket object representing the client connection.
 * @returns {Object} - An object containing the game states and progress arrays.
 */
function parseChildProcessData(data,socket) {
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
    if(element!="") {
    gameProgress.push(element)
    }
  }
  }

  // Get the states and progress array from the map corresponding to current user and modify it:
  let stateAndProgress = usersAndStateAndProgress.get(socket.decoded.username);
  stateAndProgress[0].push(...gameStates); // Appending to the existing list
  stateAndProgress[1].push(...gameProgress);

  console.log("Sending data."+gameStates.toString())
  console.log(gameProgress)


  return {"gameStates": gameStates,"gameProgress": gameProgress}
}



/**
 * Returns the last state and progress of the current user.
 * @param {Object} socket - The socket object for the current user.
 * @param {number} [stateIndex=1] - The index of the state to return, starting from the last state.
 * @param {number} [progressIndex=1] - The index of the progress to return, starting from the last progress.
 * @returns {Object} An object containing the last state and progress of the current user.
 */
function returnLastStateAndProgress(socket,stateIndex=1,progressIndex=1) {
  // Get the states and progress array from the map corresponding to current user:
  let stateAndProgress = usersAndStateAndProgress.get(socket.decoded.username);

  // Length of the progress and state arrays:
  let progressLength = stateAndProgress[1].length;
  let stateLength = stateAndProgress[0].length;

  // Last state and progress:
  let lastState = stateAndProgress[0][stateLength-stateIndex];
  let lastProgress = stateAndProgress[1][progressLength-progressIndex];

  return {"lastState": [lastState],"lastProgress":[lastProgress]};
}

});
module.exports = socketapi;



/**
 * Starts a game for the given socket and child process data listener.
 * @param {Object} socket - The socket object for the user.
 * @param {Function} childProcessDataListener - The function to handle data from the child process.
 */
function startGame(socket, childProcessDataListener) {
  let stateAndProgress = [[], []];
  usersAndStateAndProgress.set(socket.decoded.username, stateAndProgress);
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
      if (username == "Test") {
        args.push("--test");
      }
    }

    let pyexe = getPyexe();

    pythonProg = spawn(pyexe, args, { timeout: 1000000 });
  }
  else{
    pythonProg = usersAndGames.get(socket.decoded.username);
  }
  pythonProg.on('error', (err) => {
    console.error(`Failed to start Python process: ${err}`);
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
  });

  pythonProg.on('exit', function (data) {
    console.log("EXITING!");
    console.log(data);


    if(socket.decoded.username == "Test@email.com") { // For testing purposes change name to Test_4:
      socket.decoded.username = "Test_4";
    }

    // Calculate average evaluation score:
    
    // Get the states and progress array from the map corresponding to current user:
    let stateAndProgress = usersAndStateAndProgress.get(socket.decoded.username);
    // Length of the progress and state arrays:
    let stateLength = stateAndProgress[0].length;
    // Last state and progress:
    let lastState = stateAndProgress[0][stateLength-1];
    // If there are no states, the game hadn't begun yet.
    if (!lastState) {
      console.log("Game hadn't begun yet. Not doing anything.")
      return
    }
    // Check for errors
    else if (lastState.error) {
      console.log("Game ended with error. Not doing anything.")
      return
    }

    console.log(lastState)
    console.log(stateLength)
    let playerIndex = 0;
    for (let index = 0; index < lastState.players.length; index++) {
      let player = lastState.players[index];
      if(player.name==socket.decoded.username) {
        playerIndex = index;
        break;
      }
    }

    // Calculate average evaluation score:
    let totalEvaluation = 0;
    for (let index = 0; index < stateLength; index++) {
      let state = stateAndProgress[0][index];
      if (state.error) {
        continue;
      }
      totalEvaluation = totalEvaluation + state.players[playerIndex].last_evaluation;
    }
    
    if(data != 0) { // Invalid exit code:
      console.log("Invalid exit code. Game finished prematurely.")
      
      // Storing in the database that game ended prematurely:
      let res = fetch("http://localhost:3000/users/updateuser", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({username: socket.decoded.username,stats: {"gameWon":0,"gameLost":0,"gameForfeited":1,"totalEvaluation":totalEvaluation,"stateAmount":stateLength}})
      })
      .then(response => response.json())
      .then(data => {
        console.log('Database update response:', data);
      })
    }

    if(data == 0) { // Valid exit code:

      // Check if the player won or lost the game:
      let gameWon = 0;
      let gameLost = 0;

      for (let index = 0; index < lastState.players.length; index++) {
        let player = lastState.players[index];
        if(player.name==socket.decoded.username && (player.finished == 1 || player.cards.length == 0)) {
          console.log("User "+socket.decoded.username+" won the game.")
          gameWon = 1;
          gameLost = 0;
          break;
        } else if(player.name==socket.decoded.username && player.finished == 0 && player.cards.length != 0) {
          console.log("User "+socket.decoded.username+" lost the game.")
          gameWon = 0;
          gameLost = 1;
          break;
        }
      }

      if(socket.decoded.username == "Test_4") { // Change back::
        socket.decoded.username = "Test";
      }

      let folder_name = socket.decoded.username + "-Games";
      let file_name = "HumanGame-" + gameIndex + ".png";

      // Read the evaluation image file and send it to the client.
      fs.readFile(__dirname + "/../" + folder_name + "/" + file_name, function (err, data) {
        if (err) {
          console.log('Error reading the image file:', err);
          socket.emit('exit', true);
        }
        else{
          // Send the image data to the connected client
          socket.emit('exit', { image: true, buffer: Buffer.from(data, 'base64') });
        }
      });
      let res = fetch("http://localhost:3000/users/updateuser", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({username: socket.decoded.username,stats: {"gameWon":gameWon,"gameLost":gameLost,"gameForfeited":0,"totalEvaluation":totalEvaluation,"stateAmount":stateLength}})
      })
      .then(response => response.json())
      .then(data => {
        console.log('Database update response:', data);
      })
    }
    });
}

function receiveChatMessage(socket,data) { 
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
  if(data.lobbyId == undefined) {
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
      const data = fs.readFileSync(__dirname+'/../messageHistory/messageHistory.json','utf-8');
      messageArray = JSON.parse(data);
  } catch (error) {
    messageArray = [];
  }
  messageArray.push(messageObject);
  try {
    fs.writeFileSync(__dirname+'/../messageHistory/messageHistory.json', JSON.stringify(messageArray));
    if(chatType == "global") {
      io.emit('newChatMessage', JSON.stringify(messageObject));
    } else {
      io.to(lobbyId).emit('newChatMessage', JSON.stringify(messageObject));
    }
  } catch (error) {
    console.log(error)
  }
  }

  // Only emit the chat history that which the player has access to:
  function emitChatHistory(socket,lobbyId) {
    let messageString;
      try {
        const data = fs.readFileSync(__dirname+'/../messageHistory/messageHistory.json','utf-8');
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
  let user_folder = __dirname+"/../"+username+"-Games";
  let game_index = 0;
  for (let index = 0; index < 1000; index++) {
    let file_name = "HumanGame-"+game_index+".log";
    // If the file does not exist, then return the game index.
    if(!fs.existsSync(user_folder+"/"+file_name)) {
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
    const { execSync } = require('child_process');
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

function padNumber(number) {
  return number < 10 ? '0' + number : number;
}