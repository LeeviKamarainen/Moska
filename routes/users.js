var express = require('express');
var router = express.Router();

const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');

const jwt = require("jsonwebtoken");
const validateToken = require('../auth/validateToken.js');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage })
/* GET users listing. */
router.get('/', function (req, res, next) {
	res.send('Users API');
});



router.get('/heartbeat', async function (req, res, next) {
	const refdb = req.refdb;
	//Check for firstvalue:
	let isConnected = false;
	try {
		let snapshot = await refdb.once('value')
		if (snapshot.val()) {
			isConnected = true;
		}

		if (isConnected) {
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

router.get('/finduser', async function (req, res, next) {
	// This is a test route to find a user in the database
	const refdb = req.refdb;
	const snapshot = await refdb.once('value');
	const listOfUsers = snapshot.val();
	let user = getUserByName(listOfUsers, req.body.username)
	res.json(user);

})


router.get('/validateuser', validateToken, async function (req, res, next) {
	let auth = req.auth;
	res.json(auth);
})


router.get('/getleaderboard', async function (req, res, next) {
	// This is a test route to find a user in the database
	const refdb = req.refdb;
	const snapshot = await refdb.once('value');
	const listOfUsers = snapshot.val();
	let leaderboard = [];
	for (var userID in listOfUsers) {
		let user = listOfUsers[userID];
		if (user.leaderboard != null) {
			if (user.leaderboard.totalGames > 0) {
				let statsJson = {
					"username": user.username,
					"gamesWon": user.leaderboard.gamesWon,
					"gamesLost": user.leaderboard.gamesLost,
					"totalGames": user.leaderboard.totalGames,
					"percentWon": user.leaderboard.gamesWon / user.leaderboard.totalGames * 100,
					"loseStreak": user.leaderboard.loseStreak,
					"averageEvaluation": user.leaderboard.averageEvaluation,
				}
				leaderboard.push(statsJson);
			}
		}
	}
	res.json(leaderboard);
})

router.post('/updateuser', async function (req, res, next) {
	// This is a test route to find a user in the database
	const refdb = req.refdb;
	const snapshot = await refdb.once('value');
	const listOfUsers = snapshot.val();
	const updatedAttribute = req.body.stats;
	let username = req.body.username;
	console.log("Updating user " + username + " in database");
	let user = getUserByName(listOfUsers, username);
	console.log("User found: " + user.username);

	let updatedUser = updateUser(user, updatedAttribute)
	let userID = username;
	// Get reference to the user in the database:
	try {
		const userRef = refdb.child(userInfo.userID);

		if (userRef != null) {
			// Update the user in the database:
			userRef.update(userInfo.userFound);
			// Log the updated user:
			const userSnapshot = await userRef.once('value');
			const userTEST = userSnapshot.val();
		} else {
			console.log("ERROR: User not found in database.")
		}
	} catch (error) {
		console.log(error)
		console.log("ERROR: User not found in database.")
	}

	res.json(userInfo);
})


router.post("/register", upload.none(),
	// body("email").isLength({min: 3}),
	async (req, res, next) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() })
		}
		const refdb = req.refdb;
		const snapshot = await refdb.once('value');
		const listOfUsers = snapshot.val();
		let user = getUserByName(listOfUsers, req.body.username);
		if (user) {
			return res.status(403).json({ email: "Username already in use" })
		} else {
			bcrypt.genSalt(10, (err, salt) => {
				bcrypt.hash(req.body.password, salt, (err, hash) => {
					if (err) throw err;
					let newUser = {
						email: req.body.username,
						username: req.body.username,
						password: hash,
						exp_level: 0,
						leaderboard: {
							gamesWon: 0,
							gamesLost: 0,
							totalGames: 0,
							loseStreak: 0
						}
					};
					refdb.push(newUser)
					return res.json({ success: true });
				});
			})
		}
	});

router.post('/login', upload.none(),
	async (req, res, next) => {
		const refdb = req.refdb;
		const snapshot = await refdb.once('value');
		const listOfUsers = snapshot.val();
		let user = getUserByName(listOfUsers, req.body.username);
		console.log("Logging in user " + req.body.username)
		if (!user) {
			return res.status(403).json({ message: "Login failed" });
		} else {
			console.log("User found in database")
			bcrypt.compare(req.body.password, user.password, (err, isMatch) => {
				if (err) throw err;
				if (isMatch) {
					const jwtPayload = {
						id: user._id,
						//email: user.email,
						username: user.username
					}
					jwt.sign(
						jwtPayload,
						process.env.SECRET,
						{
							expiresIn: 60 * 60
						},
						(err, token) => {
							console.log("Login success!")
							res.json({ success: true, token });
						}
					);
				}
				else {
					console.log("Login failed")
					return res.status(403).json({ message: "Login failed" });
				}
			})
		}

	});


function getUserByName(listOfUsers, userName) {
	let userFound = null;
	for (var user in listOfUsers) {
		// Check if a name in lowercase matches the username
		if (listOfUsers[user].username.toLowerCase() == userName.toLowerCase()) {
			userFound = listOfUsers[user];
			break;
		}
	}
	return userFound;
}

function updateUser(user, result) {
	if (!user.leaderboard) {
		user.leaderboard = {};
	}

	const defaultLeaderboard = {
		gamesWon: 0,
		gamesLost: 0,
		totalGames: 0,
		loseStreak: 0,
		totalEvaluation: 0,
		stateAmount: 0,
		averageEvaluation: 0,
	};

	// Initialize missing leaderboard attributes
	for (let key in defaultLeaderboard) {
		if (user.leaderboard[key] == null) {
			user.leaderboard[key] = defaultLeaderboard[key];
		}
	}

	// Update the leaderboard
	for (let key in result) {
		console.log("Updating " + key + " to " + result[key]);
		if (user.leaderboard[key] != null) {
			user.leaderboard[key] += result[key];
		} else {
			user.leaderboard[key] = result[key];
		}
	}

	// Calculate total games played
	user.leaderboard.totalGames = user.leaderboard.gamesWon + user.leaderboard.gamesLost;

	// Calculate average evaluation
	user.leaderboard.averageEvaluation = user.leaderboard.totalEvaluation / user.leaderboard.stateAmount;

	// Handle lose streaks
	if (result.gameWon == 0) {
		user.leaderboard.loseStreak += 1;
	} else {
		user.leaderboard.loseStreak = 0;
	}
	return user
}
module.exports = router;
