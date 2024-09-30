var express = require('express');
var router = express.Router();

const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');

const fs = require('fs');
const jwt = require("jsonwebtoken");
const validateToken = require('../auth/validateToken.js');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage })
/* GET users listing. */
router.get('/', function (req, res, next) {
	res.send('Users API');
});

const DEFAULT_USER_JSON = {
	username: "",
	email: "",
	password: "",

	gameStats: {
		gameSummaries: [],
		rating: 0.5,
		gamesWon: 0,
		gamesLost: 0,
		totalGames: 0,
		loseStreak: 0,
		totalEvaluation: 0,
		stateAmount: 0,
		averageEvaluation: 0,
	}
};



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
	console.log("Finding query " + JSON.stringify(req.query))
	const refdb = req.refdb;
	const snapshot = await refdb.once('value');
	const listOfUsers = snapshot.val();
	let user = getUserByName(listOfUsers, req.query.username)
	console.log("User found: " + JSON.stringify(user))
	let updatedUser = null;
	// If user is not found, return 404
	if (user == null) {
		console.log("User not found.")
		res.status(404).send("User not found.");
		return; // Ensure the function exits if user is not found
	} else {
		// Set the user's attributes to default values if they are missing
		updatedUser = setDefaultValues(user);
	}
	console.log("Returning user: " + JSON.stringify(updatedUser))
	res.json(updatedUser);
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

function checkGameSummaryValid(gameSummary) {
	if (gameSummary == null) {
		return false;
	}
	if (gameSummary.players == null) {
		return false;
	}
	if (gameSummary.finishingOrder == null) {
		return false;
	}
	return true;
}

router.post('/updateuser', async function (req, res, next) {
	const refdb = req.refdb;
	const snapshot = await refdb.once('value');
	const listOfUsers = snapshot.val();
	const gameSummary = req.body.gameSummary;

	if (!checkGameSummaryValid(gameSummary)) {
		res.status(400).send("Invalid game summary.")
	}

	let username = req.body.username;
	let userToUpdate = req.body.username;

	// If the user is bot (indicated by gameSummary.players[idx].isBot), update MoskaBot instead
	// Find idx of the user in the gameSummary
	let idx = getIndexInGameSummary(gameSummary, username);
	if (idx == -1) {
		console.log("User '" + username + "' not found in game summary.")
		res.status(404).send("User not found in game summary.");
		return;
	}
	// Check if the user is a bot
	if (gameSummary.players[idx].isBot) {
		console.log("User '" + username + "' is a bot.")
		userToUpdate = "MoskaBot";
	}

	let user = getUserByName(listOfUsers, userToUpdate);
	if (user == null) {
		console.log("User '" + userToUpdate + "' not found: " + JSON.stringify(user));
		res.status(404).send("User not found.");
		return;
	}

	user.username = username;

	let updatedUser = createUpdatedUserStats(user, gameSummary)
	// Swap to 'MoskaBot' if the user is a bot
	updatedUser.username = userToUpdate;

	let userID = userToUpdate;

	// Get reference to the user in the database:
	try {
		const userRef = refdb.child(userID);
		if (userRef != null) {
			// Update the user in the database:
			userRef.update(updatedUser);
			// Log the updated user:
			const userSnapshot = await userRef.once('value');
			const userTEST = userSnapshot.val();
		} else {
			console.log("ERROR: User not found in database.")
			res.status(404).send("User not found in database.")
		}
	} catch (error) {
		console.log(error)
		console.log("ERROR: User not found in database.")
		res.status(404).send("User not found in database.")
	}

	res.json(updatedUser);
})

function getIndexInGameSummary(gameSummary, username) {
	let idx = -1;
	for (let i = 0; i < gameSummary.players.length; i++) {
		if (gameSummary.players[i].username == username) {
			idx = i;
			break;
		}
	}
	return idx;
}

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

// Modify the user object to have default values if missing
function setDefaultValues(user) {
	let defaultUserJson = DEFAULT_USER_JSON;

	// Get the current user json
	let currentUserJson = user;

	// Initialize missing attributes
	for (let key in defaultUserJson) {
		if (currentUserJson[key] == null) {
			currentUserJson[key] = defaultUserJson[key];
		}
		// Initialize missing gameStats attributes
		if (key == "gameStats") {
			for (let gameStatsKey in defaultUserJson.gameStats) {
				if (currentUserJson.gameStats[gameStatsKey] == null) {
					currentUserJson.gameStats[gameStatsKey] = defaultUserJson.gameStats[gameStatsKey];
				}
			}
		}
	}
	return currentUserJson;
}


function createUpdatedUserStats(user, gameSummary) {
	/* The gameSummary should be something like
	{
		players: [
		{},
		{},
		{},
		{}
		],
		finishingOrder:["p1", "p3", "p2", "p4"],

	}
	where each user is something like
	{username: "p4",
	rating: 1350,
	evaluations:[0.5,0.8...],
	finishingState:160
	}
	*/

	// Get the current user json
	let currentUserJson = setDefaultValues(user);

	// Calculate the new stats
	let updatedGameStats = currentUserJson.gameStats;
	updatedGameStats.totalGames = updatedGameStats.gameSummaries.length;
	
	let lost = false;
	if (gameSummary.finishingOrder[gameSummary.finishingOrder.length - 1] == user.username) {
		console.log("User " + user.username + " lost the game.")
		lost = true;
	}

	updatedGameStats.gamesWon = lost ? updatedGameStats.gamesWon : updatedGameStats.gamesWon + 1;
	updatedGameStats.gamesLost = lost ? updatedGameStats.gamesLost + 1 : updatedGameStats.gamesLost;

	let totalGameEvaluation = 0;
	let stateAmount = 0;
	console.log("Gamesummary: " + JSON.stringify(gameSummary))
	console.log("User: " + JSON.stringify(user))

	// Find the player idx with the username
	let playerIdx = getIndexInGameSummary(gameSummary, user.username);
	if (playerIdx == -1) {
		console.log("ERROR: User " + user.username + " not found in game summary.")
		return null;
	}

	for (let i = 0; i < gameSummary.players[playerIdx].evaluations.length; i++) {
		totalGameEvaluation += gameSummary.players[playerIdx].evaluations[i];
		stateAmount += 1;
	}

	updatedGameStats.totalEvaluation += totalGameEvaluation;
	updatedGameStats.stateAmount += stateAmount;
	updatedGameStats.averageEvaluation = updatedGameStats.totalEvaluation / updatedGameStats.stateAmount;

	updatedGameStats.loseStreak = lost ? updatedGameStats.loseStreak + 1 : 0;

	// Remove the 'evaluations' attribute all gameSummary objects, and all players
	for (let i = 0; i < gameSummary.players.length; i++) {
		delete gameSummary.players[i].evaluations;
	}
	for (let i = 0; i < updatedGameStats.gameSummaries.length; i++) {
		for (let j = 0; j < updatedGameStats.gameSummaries[i].players.length; j++) {
			delete updatedGameStats.gameSummaries[i].players[j].evaluations
		}
	}

	updatedGameStats.gameSummaries.push(gameSummary);

	let rating = updatedGameStats.rating;
	let opponentRatings = [];

	// Get the ratings of all players except the user
	for (let i = 0; i < gameSummary.players.length; i++) {
		// Check that gameSummary.players[i] is not the user
		if (gameSummary.players[i].username != user.username) {
			opponentRatings.push(gameSummary.players[i].rating);
		}
	}

	// If the ratings are > 10, set them to 0.5
	for (let i = 0; i < opponentRatings.length; i++) {
		if (opponentRatings[i] > 10) {
			opponentRatings[i] = 0.5;
		}
	}
	if (rating > 10) {
		rating = 0.5;
	}


	// Calculate the new rating
	let newRating = updateRating(lost, rating, opponentRatings);
	updatedGameStats.rating = newRating;

	let updatedUser = currentUserJson;
	updatedUser.gameStats = updatedGameStats;

	return updatedUser
}


function adjustRatingEstimateSoftmax(lost, rating, opponentRatings, learning_rate = 0.05) {
    // Combine the player's rating with the opponent's ratings
    const all_ratings = [rating].concat(opponentRatings);
    
    // Softmax function for all rating estimates
    const exp_ratings = all_ratings.map(est => Math.exp(est));
    const sum_exp_ratings = exp_ratings.reduce((a, b) => a + b, 0);
    const softmax_probabilities = exp_ratings.map(est => est / sum_exp_ratings);

    // True probability: 1 if the player lost, 0 if they won
    const true_proba = lost ? 1 : 0;

    // Player's softmax probability (first element since player is first in the list)
    const player_softmax_proba = softmax_probabilities[0];

    // Compute the gradient (difference between true and softmax probability)
    const gradient = true_proba - player_softmax_proba;

    // Adjust the player's rating using the gradient and learning rate
    const new_rating = rating + learning_rate * gradient;

    return new_rating;
}



function updateRating(lost, rating, opponentRatings) {
	let newRating = adjustRatingEstimateSoftmax(lost, rating, opponentRatings);
	return newRating;
}





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

/*
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
}*/

function updateUser(listOfUsers, username, updatedAttribute) {
	let userFound = null;
	let userID = null;
	console.log("Updating user " + username + " in database")
	for (var user in listOfUsers) {
		if (listOfUsers[user].username.toLowerCase() == username.toLowerCase()) {
			userFound = listOfUsers[user];
			userID = user;

			if (userFound.leaderboard == null) { // Initialize users leaderboard if they don't have one
				userFound.leaderboard = {
				}
			}
			if (userFound.leaderboard.gamesWon == null) {
				userFound.leaderboard.gamesWon = 0;
			}
			if (userFound.leaderboard.gamesLost == null) {
				userFound.leaderboard.gamesLost = 0;
			}
			if (userFound.leaderboard.totalGames == null) {
				userFound.leaderboard.totalGames = 0;
			}
			if (userFound.leaderboard.loseStreak == null) {
				userFound.leaderboard.loseStreak = 0;
			}
			// Initialize totalEvaluation and the amount of states played accross all games. This is needed to calculate the average evaluation of the user:
			if (userFound.leaderboard.totalEvaluation == null) {
				userFound.leaderboard.totalEvaluation = 0;
			}
			if (userFound.leaderboard.stateAmount == null) {
				userFound.leaderboard.stateAmount = 0;
			}
			if (userFound.leaderboard.averageEvaluation == null) {
				userFound.leaderboard.averageEvaluation = 0;
			}
			if (userFound.leaderboard.gamesForfeited == null) {
				userFound.leaderboard.gamesForfeited = 0;
			}

			// Update the leaderboard:
			userFound.leaderboard.gamesWon = userFound.leaderboard.gamesWon + updatedAttribute.gameWon;
			userFound.leaderboard.gamesLost = userFound.leaderboard.gamesLost + updatedAttribute.gameLost;
			// Calculate total games played:
			userFound.leaderboard.totalGames = userFound.leaderboard.gamesWon + userFound.leaderboard.gamesLost;

			// Calculate forfeited games:
			userFound.leaderboard.gamesForfeited = userFound.leaderboard.gamesForfeited + updatedAttribute.gameForfeited;

			// Calculate average evaluation:
			userFound.leaderboard.totalEvaluation = userFound.leaderboard.totalEvaluation + updatedAttribute.totalEvaluation;
			userFound.leaderboard.stateAmount = userFound.leaderboard.stateAmount + updatedAttribute.stateAmount;
			userFound.leaderboard.averageEvaluation = userFound.leaderboard.totalEvaluation / userFound.leaderboard.stateAmount;
			// Handle lose streaks:
			if (updatedAttribute.gameWon == 0) { // If the user lost the game
				userFound.leaderboard.loseStreak = userFound.leaderboard.loseStreak + 1;
			} else {
				userFound.leaderboard.loseStreak = 0;
			}
			break;
		}
	}
	return { "userFound": userFound, "userID": userID };
}
module.exports = router;
