## TODO
This lists features and bugs that are not yet implemented or fixed.

---

### Frontend

#### **Bugs**

| Description | Current Behaviour | Desired Behaviour | Estimated Changes |
|-------------------------------------------------------|----------------------------------------------------|---------------------------------------------------|---------------------------------------|
| The game ending message is ugly in multiplayer.  | The message indicates an error, even though there is no error. | Show the evaluation progression, or just show 'Game finished'.   | - |
| Evaluation plot is not shown after multiplayer games. | Plot is missing from the interface. | Display evaluation plot correctly. | - |
| Leaderboard default sorting is reversed -> incorrect. | Currently sorted in reverse order by default. | Correct the default sorting to ascending order. | Swap default sorting direction. |

#### **Features**

| Description | Current Behaviour | Desired Behaviour | Estimated Changes |
|-------------------------------------------------------|----------------------------------------------------|---------------------------------------------------|---------------------------------------|
| Add a 'face' next to each player (human, squirrel, AI) | Only name listed | Show a face-like image next to each player, can be random at first. | Probably in renderGame.js |
| Show an error message to user if the game crashes. | Game hangs with timer animation when it crashes, atleast in singleplayer. | Display an appropriate error message on crash. | Move same code as in multiplayer, to a singleplayer. |
| Allow replaying past games. | No replay functionality for past games, and no way to view own past games. | Users should be able to replay past games by doing forward-backward. | Add a separate page where the user can select one of their previous (succesful) games and start replaying it. |
| Show the user's estimated rank on the leaderboard. | Users have no rank. | Show an estimated rank for the user's skill level. | Change what is saved for each player, and add logic to calculate the leaderboard rank. |
| Add cleaner font to the game interface. | Current font is very simple, and small. | Implement a cleaner and more readable font. | Update font styles across the UI, especially in Game view. |

---


#### **Tests**

- Add automated test coverage for multiplayer games.

### Backend

#### **Bugs**

| Description | Current Behaviour | Desired Behaviour | Estimated Changes |
|-------------------------------------------------------|----------------------------------------------------|---------------------------------------------------|---------------------------------------|
| Website requires 'www' in the URL to work. | Website only loads with 'www' in the URL. | Remove 'www' requirement, move to Azure hosting. | Move the app to Azure. |
| Run app with PM2 for more security and automatic restarts. | App does not automatically restart on crashes. | App can be starterd with `pm2 app.js`| Download, and make sure it works. |

#### **Tests**

- Add test to handle user cookie expiration before a game ends.

#### **Features and Improvements**

| Description                                           | Current Behaviour                                  | Desired Behaviour                                  | Estimated Changes                     |
|-------------------------------------------------------|----------------------------------------------------|---------------------------------------------------|---------------------------------------|
| Add more configuration options for launching the game.| Limited configuration options.                     | Provide more detailed options (model level, etc.). | Expand backend game launch logic.     |
| Redirect to /game/:gameId instead of just changing view when starting a game. | Current page doesn't change URL when starting a game. | Redirect to a unique URL for each game session. | Update frontend routing and backend game session handling. |
| Extend user data storage to include full game data.   | Only summary of past games (won/lost) is stored.   | Save full game data, JSON sequence for replays.    | Update backend to store and manage full game records. |
| Save game data to each player's profile.              | No game data is saved to player profiles.          | Store detailed game data within player profiles.   | Update player data model.             |
| Save chat history during games.                      | No chat history is saved after games.              | Store and display chat history for each game.      | Implement chat history storage.       |
| Update MoskaEngine while maintaining compatibility with old version. | Old MoskaEngine version is still used.             | Update to newer version but ensure AI compatibility with the old version. | Implement versioning and compatibility layers. |

---

