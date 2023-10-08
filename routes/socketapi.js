var express = require('express');
var router = express.Router();
var path = require('path')
const io = require( "socket.io" )();
const { spawn } = require('child_process');
const  jwt = require('jsonwebtoken');
const { use } = require('./users');
const socketapi = {
    io: io
};
const fs = require('fs');


let gameIndex = 0;
let gameStringIndex = 2;
let dataArrived;
let gameStates = [];
let gameProgress = [];

const usersAndGames = new Map();
const usersAndStateAndProgress = new Map();

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



io.use(function(socket, next){
  if (socket.handshake.query && socket.handshake.query.token){
    jwt.verify(socket.handshake.query.token, process.env.SECRET, (err, user) => { 
      if(err) {
         console.log(err)
         console.log("Token verification failed. Using default credentials.")
         user = {
          // username is 'Anonymous' + <random number between 1 and 1000>
        username: 'Anonymous' + Math.floor(Math.random() * 1000),
        email : 'Anonymous' + Math.floor(Math.random() * 1000) + '@example.com'
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
        
// Add your socket.io logic here!
io.on( "connection", function( socket ) {
    console.log( "An user connected" );
    socket.on("gameaction",(data) => {
        let actionJson = JSON.parse(data);
        console.log("Received game action from client: "+actionJson.action)
        // Find the correct python program corresponding to the user
        let pythonProg = usersAndGames.get(socket.decoded.email);
        if(pythonProg!=null) {
          pythonProg.stdin.write(actionJson.action+"\n");
          console.log("Sent game action to the server.")
        } 
        else {
          console.log("Game Program has shut down. Please restart.")
        }
    })

    socket.on("pingSocket",(data) => {
      console.log("Pinging back with current data:")
      let lastValues = returnLastStateAndProgress(socket);
      socket.emit('data',{"gamestates": lastValues.lastState,"gameprogress": lastValues.lastProgress, "gameindex":gameIndex, "dataArrived":dataArrived, "gamestringindex": gameStringIndex,"currentUser": socket.decoded},1000)
    })

    socket.on("disconnect", (data) => {
      let pythonProg = usersAndGames.get(socket.decoded.email);
      if(pythonProg!=null){
        console.log("User disconnected. Terminating game.")
        pythonProg.kill();
        usersAndGames.delete(socket.decoded.email);
        socket.emit('exit');
      }
      else {
        console.log("Attempted disconnect. No game in progress.")
      }
    })

    // Send existing game progress to client:
    socket.on("gamelogs", (data) => {
      let stateAndProgress = usersAndStateAndProgress.get(socket.decoded.email);
      if(stateAndProgress != undefined) {
        socket.emit('rendergamelogs',{"gamelogs": stateAndProgress[1]});
      } else {
        socket.emit('rendergamelogs',{"gamelogs": "No game in progress!"});
      }
    })

    socket.on("gamestart",(data) => {
      // Initialize a key and value map to store users states and progresst:
      let stateAndProgress = [[],[]];
      usersAndStateAndProgress.set(socket.decoded.email,stateAndProgress);
      // If the user already has a child process running, terminate it to reduce the risk of unreferenced child processes running and causing memory loss.
      if(usersAndGames.has(socket.decoded.email)) { 
        console.log("Terminated existing game, and starting new one!");
        usersAndGames.get(socket.decoded.email).kill();
        usersAndGames.delete(socket.decoded.email);
      }
      // Check if the usersAndGames map already has a child process running for that specific user. If not then start the process, and otherwise.  
      let gameProgressFull = [];
      let gameStatesFull = [];
      // Split email at @ to get username
      let username = socket.decoded ? socket.decoded.username : "Human" //socket.decoded ? socket.decoded.email.split("@")[0] : "Human";
      let args = [__dirname+"/../Python/browserMoska.py"];
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
      // pythonProg = spawn('C:/home/python3111x64/python', args, {timeout: 1000000});
      pyexe = process.platform === "win32" ? 'py' : 'python3';
      pythonProg = spawn(pyexe, args, {timeout: 1000000});
      pythonProg.on('error', (err) => {
        console.error(`Failed to start Python process: ${err}`);
      });
      usersAndGames.set(socket.decoded.email, pythonProg);
        pythonProg.stderr.on('data',function(data) {
          console.log(data.toString())
        })
        
        console.log("Python program started")

        // When the python program sends data, parse it and send it to the client.
        pythonProg.stdout.on('data',childProcessDataListener)
        pythonProg.stdout.on('end', () => {
          // Process the complete output from the Python program
          console.log("END OF THE STREAM!");
        });
      pythonProg.on('exit', function(data) {

        console.log("EXITING!");

        console.log(data);
        let folder_name = socket.decoded.username + "-Games";
        let file_name = "HumanGame-"+gameIndex+".png";
        fs.readFile(__dirname+"/../"+folder_name+"/"+file_name, function (err, data) {
          if (err) {
            console.error('Error reading the image file:', err);
            socket.emit('exit',true);
          }
      
          // Send the image data to the connected client
          socket.emit('exit', { image: true, buffer: data });
        });
      })
  })
  

  socket.on("gamereconnect",(data) => {
    // Check if the user has already a key value in states/progresses map, and if not the initialize it:
    if(!usersAndStateAndProgress.has(socket.decoded.email)) {
      let stateAndProgress = [[],[]];
      usersAndStateAndProgress.set(socket.decoded.email,stateAndProgress);
    }
    // Check if the usersAndGames map already has a child process running for that specific user. If not then start the process, and otherwise.
    if(!usersAndGames.has(socket.decoded.email)) {    
      
    console.log("User did not have a game to reconnect to. Creating a game...")
    let gameProgressFull = [];
    let gameStatesFull = [];
    let username = socket.decoded ? socket.decoded.username: "Human"//socket.decoded ? socket.decoded.email.split("@")[0] : "Human";
    // let args = ["C:/home/site/wwwroot/Python/browserMoska.py"];
     let args = [__dirname+"/../Python/browserMoska.py"];
    if (username) {
        args.push("--name");
        args.push(username);
    }
    
    // pythonProg = spawn('C:/home/python3111x64/python', args, {timeout: 1000000});
   pythonProg = spawn('python', args, {timeout: 1000000});
    usersAndGames.set(socket.decoded.email, pythonProg);
      pythonProg.stderr.on('data',function(data) {
        console.log(data.toString())
      })
      
      console.log("Python program started")

      // When the python program sends data, parse it and send it to the client.
      pythonProg.stdout.on('data',childProcessDataListener)

    pythonProg.on('exit', function(data) {
      console.log("EXITING!");
      socket.emit('exit',true);
    })
  }
  else {
    console.log("Game already exists for the user. Reconnecting...");
    let pythonProg = usersAndGames.get(socket.decoded.email);
    pythonProg.stdout.off('data',childProcessDataListener); // Remove previous data listener and add new one with reference to the new socket.
    pythonProg.stdout.on('data',childProcessDataListener)
    lastValues = returnLastStateAndProgress(socket);
    socket.emit('data',{"gamestates": lastValues.lastState,"gameprogress": lastValues.lastProgress, "gameindex":gameIndex, "dataArrived":dataArrived, "gamestringindex": gameStringIndex,"currentUser": socket.decoded},1000)
  }
})

const childProcessDataListener = (data) => {
  let parsedData = parseChildProcessData(data,socket);
  socket.emit('data',{"gamestates": parsedData.gameStates,"gameprogress": parsedData.gameProgress, "gameindex":gameIndex, "dataArrived":dataArrived, "gamestringindex": gameStringIndex,"currentUser": socket.decoded},1000)

 }

function parseChildProcessData(data,socket) {
   
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
let stateAndProgress = usersAndStateAndProgress.get(socket.decoded.email);
stateAndProgress[0].push(...gameStates); // Appending to the existing list
stateAndProgress[1].push(...gameProgress);

console.log("Sending data."+gameStates.toString())
console.log(gameProgress)


return {"gameStates": gameStates,"gameProgress": gameProgress}
}

function returnLastStateAndProgress(socket,stateIndex=1,progressIndex=1) {
  // Get the states and progress array from the map corresponding to current user:
  let stateAndProgress = usersAndStateAndProgress.get(socket.decoded.email);

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