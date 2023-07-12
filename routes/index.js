var express = require('express');
var router = express.Router();
var path = require('path')

const { spawn } = require('child_process');
let socketapi = require('./socketapi');

//console.log("Python program started")
let gameIndex = 0;
let gameStringIndex = 2;
let dataArrived;
/*pythonProg.stdout.on('data', function(data) {
  console.log("DATA ARRIVING!")
    let dataString = data.toString();
    let dataArray = dataString.split(/\r?\n/)
    dataArrived = true;
    for (let index = 0; index < dataArray.length; index++) {
      let element = dataArray[index];
    try {
    gameStates.push(JSON.parse(element))
    }
    catch {
      if(element!="") {
      gameProgress.push(element)
      }
    }
  }
})*/


let gameProgress = [];
let gameStates = [];
/* GET home page. */
router.get('/', function(req, res, next) {
});

router.get('/login', function(req, res, next) {
  res.sendFile(path.join(__dirname,"../views","login.html"));
});


router.get("/getstate", async function(req,res,next){
  /*
  console.log("Sending game states!")
  console.log(gameProgress)
  gameIndex = gameStates.length;
  gameStringIndex = gameProgress.length;
  res.json({"gamestates": gameStates,"gameprogress": gameProgress, "gameindex":gameIndex, "dataArrived":dataArrived, "gamestringindex": gameStringIndex});
  dataArrived = false;
  pythonProg.stderr.on('data', function(data) {
    console.log(`stdout: ${data}`);
  })
  */
})

router.post("/playmove",function(req,res,next) {
  console.log(req.body)
  pythonProg.stdin.write(req.body.action+"\n");
  res.json({"Command sent":req.body.action});
})

router.get('/register', function(req, res, next) {
  res.sendFile(path.join(__dirname,"../views","register.html"));
});

router.get('/gamelogs', function(req, res, next) {
  res.sendFile(path.join(__dirname,"../views","gamelogs.html"));
});

router.get('/tutorial', function(req, res, next) {
  res.sendFile(path.join(__dirname,"../views","tutorial.html"));
});

router.get('/startgame', function(req, res, next) {
  res.redirect('/game');
});

router.get('/game', function(req, res, next) {
  res.sendFile(path.join(__dirname,"../public","game.html"));
});

module.exports = router;
