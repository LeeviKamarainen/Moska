var express = require('express');
var router = express.Router();
var path = require('path')

const { spawn } = require('child_process');
let socketapi = require('./socketapi');

/* GET home page. */
router.get('/', function (req, res, next) {
});

router.get('/login', function (req, res, next) {
	res.sendFile(path.join(__dirname, "../views", "login.html"));
});

router.post("/playmove", function (req, res, next) {
	pythonProg.stdin.write(req.body.action + "\n");
	res.json({ "Command sent": req.body.action });
})

router.get('/register', function (req, res, next) {
	res.sendFile(path.join(__dirname, "../views", "register.html"));
});

router.get('/gamelogs', function (req, res, next) {
	res.sendFile(path.join(__dirname, "../views", "gamelogs.html"));
});

router.get('/tutorial', function (req, res, next) {
	res.sendFile(path.join(__dirname, "../views", "tutorial.html"));
});

router.get('/startgame', function (req, res, next) {
	res.sendFile(path.join(__dirname, "../public", "game.html"));
});

router.get('/leaderboard', function (req, res, next) {
	res.sendFile(path.join(__dirname, "../views", "leaderboard.html"));
});

router.get('/lobby', function (req, res, next) {
	res.sendFile(path.join(__dirname, "../views", "lobby.html"));
});

router.get('/poronmulkku', function (req, res, next) {
	res.sendFile(path.join(__dirname, "../views", "losers_list.html"));
});



module.exports = router;
