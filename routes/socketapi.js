var express = require('express');
var router = express.Router();
var path = require('path')
const io = require( "socket.io" )();
const { spawn } = require('child_process');
const  jwt = require('jsonwebtoken');
const socketapi = {
    io: io
};


let gameIndex = 0;
let gameStringIndex = 2;
let dataArrived;
let gameProgressFull = [];
let gameStatesFull = [];
let gameStates = [];
let gameProgress = [];
let pythonProg;



  
io.use(function(socket, next){
  if (socket.handshake.query && socket.handshake.query.token){
    jwt.verify(socket.handshake.query.token, process.env.SECRET, (err, user) => {
      if(err) {
         console.log(err)
         return err;
        }
      console.log("Authentication success!")
      socket.decoded = user;
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
        
        pythonProg.stdin.write(actionJson.action+"\n");

        console.log("Sent game action to the server.")
    })

    socket.on("pingSocket",(data) => {
      console.log("Pinging back with current data:")
      socket.emit('data',{"gamestates": gameStates,"gameprogress": gameProgress, "gameindex":gameIndex, "dataArrived":dataArrived, "gamestringindex": gameStringIndex},1000)
    })

    socket.on("gamestart",(data) => {
      console.log(data)
      console.log(socket.decoded)
      // Split email at @ to get username
      let username = socket.decoded ? socket.decoded.email.split("@")[0] : "Human";
      let args = [__dirname+"/../Python/browserMoska.py"];
      if (username) {
        args.push("--name");
        args.push(username);
      }
      console.log(args)
      pythonProg = spawn('python', args);
      pythonProg.stderr.on('data',function(data) {
        console.log(data.toString())
      })
      
      console.log("Python program started")
      pythonProg.stdout.on('data', function(data) {
          
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
          if(element!="" && gameIndex != 0) {
          gameProgress.push(element)
          }
        }
      }
      
      gameProgressFull.push(gameProgress);
      gameStatesFull.push(gameStates);
      console.log("Sending data."+gameStates)
      console.log(gameStatesFull)
      socket.emit('data',{"gamestates": gameStates,"gameprogress": gameProgress, "gameindex":gameIndex, "dataArrived":dataArrived, "gamestringindex": gameStringIndex},1000)
      gameIndex = gameStates.length;
      gameStringIndex = gameProgress.length;
    })
    })


});
// end of socket.io logic

module.exports = socketapi;