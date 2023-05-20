const io = require( "socket.io" )();
const { spawn } = require('child_process');
const socketapi = {
    io: io
};

let pythonProg = spawn('python',[
  __dirname+"/../../Python/browserMoska.py"]);
        
console.log("Python program started")
// Add your socket.io logic here!

pythonProg.stderr.on('data',function(data) {
  console.log(data.toString())
})

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

let gameIndex = 0;
let gameStringIndex = 2;
let dataArrived;
let gameProgress = [];
let gameStates = [];

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
  console.log("Sending data.")
  socket.emit('data',{"gamestates": gameStates,"gameprogress": gameProgress, "gameindex":gameIndex, "dataArrived":dataArrived, "gamestringindex": gameStringIndex},1000)
  gameIndex = gameStates.length;
  gameStringIndex = gameProgress.length;
})
});
// end of socket.io logic

module.exports = socketapi;