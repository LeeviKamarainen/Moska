var express = require('express');
var router = express.Router();
var path = require('path')

const { spawn } = require('child_process');
let socketapi = require('./socketapi');

/* GET home page. */
router.get('/', function(req, res, next) {
});

router.get('/login', function(req, res, next) {
  res.sendFile(path.join(__dirname,"../views","login.html"));
});


router.get("/getstate", async function(req,res,next){

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
  res.sendFile(path.join(__dirname,"../public","game.html"));
});


module.exports = router;
