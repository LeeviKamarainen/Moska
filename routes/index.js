var express = require('express');
var router = express.Router();
var path = require('path')
/* GET home page. */
router.get('/test', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/login', function(req, res, next) {
  res.sendFile(path.join(__dirname,"../views","login.html"));
});

router.get('/register', function(req, res, next) {
  res.sendFile(path.join(__dirname,"../views","register.html"));
});



module.exports = router;
