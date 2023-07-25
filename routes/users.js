var express = require('express');
var router = express.Router();

const bcrypt = require('bcryptjs');
const {body, validationResult} = require('express-validator');

const jwt = require("jsonwebtoken");
const validateToken = require('../auth/validateToken.js');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({storage})
/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('Users API');
});



router.get('/heartbeat', async function(req,res,next) {
  const refdb = req.refdb;
  //Check for firstvalue:
  let isConnected = false;
  try {
  let snapshot = await refdb.once('value')
  if(snapshot.val()) {
    isConnected = true;
  }

  if(isConnected) {
    res.send('Firebase Realtime Database is reachable');
    } else {
      res.status(500).send('Firebase Realtime Database is unreachable');
    }
  }
    catch (error) {
      console.error('Error pinging Firebase Realtime Database:', error);
      res.status(500).send('Internal Server Error');
    }

})

router.get('/finduser', async function(req,res,next) {
  const refdb = req.refdb;
  const snapshot = await refdb.once('value');
  const listOfUsers = snapshot.val();
  console.log(req.body.email)
  let user = getUser(listOfUsers, req.body.email)
  res.json(user);

 })


router.post("/register",upload.none(),
body("email").isLength({min: 3}),
  async (req, res, next) => {
    console.log(req.body)
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
      return res.status(400).json({errors: errors.array()})
    }
    const refdb = req.refdb;
    const snapshot = await refdb.once('value');
    const listOfUsers = snapshot.val();
    let user = getUser(listOfUsers,req.body.email);
    if(user) {
        return res.status(403).json({email: "Email already in use"})
      } else {
        console.log("Adding new user");
        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(req.body.password, salt, (err,hash) => {
            if(err) throw err;
            let newUser = {
              email: req.body.email,
              username: req.body.username,
              password: hash,
              exp_level: 0
            };
            refdb.push(newUser)
            return res.json({success: true});
          });
          })
        }
});

router.post('/login',upload.none(),
async (req,res,next) => {
  const refdb = req.refdb;
  const snapshot = await refdb.once('value');
  const listOfUsers = snapshot.val();
  let user = getUser(listOfUsers,req.body.email);
    if(!user) {
      return res.status(403).json({message: "Login failed"});
    } else {
      bcrypt.compare(req.body.password, user.password, (err, isMatch) => {
        if(err) throw err;
        if(isMatch) {
          const jwtPayload = {
            id: user._id,
            email: user.email,
          }
          jwt.sign(
            jwtPayload,
            process.env.SECRET,
            {
              expiresIn: 60*60
            },
            (err, token) => {
              console.log("Login success!")
              res.json({success: true, token});
            }
          );
        }
      })
    }

  });


function getUser(listOfUsers,userEmail) {
  let userFound = null;
  for(var user in listOfUsers) {
    if(listOfUsers[user].email==userEmail) {
      console.log(listOfUsers[user].email)
      userFound = listOfUsers[user];
      break;
    }
  }
  return userFound;
}
module.exports = router;
