## TODO
This lists features and bugs that are not yet implemented or fixed.

---

### Frontend

#### **Bugs**

| Description                                           | Current Behaviour                                  | Desired Behaviour                                  | Estimated Changes                     |
|-------------------------------------------------------|----------------------------------------------------|---------------------------------------------------|---------------------------------------|
| The game ending message is ugly in multiplayer.  | The message indicates an error, even though there is no error            | Correct and informative message after game ends.   | Update multiplayer end-game logic.    |
| Evaluation plot is not shown after multiplayer games. | Plot is missing from the interface.                | Display evaluation plot correctly.                 | Fix rendering logic for multiplayer.  |
| Leaderboard default sorting is reversed.              | Sorted in reverse order by default.                | Correct the default sorting to ascending order.    | Adjust leaderboard sorting algorithm. |

#### **Tests**

- Add automated test coverage for multiplayer games.

#### **Features**

| Description                                           | Current Behaviour                                  | Desired Behaviour                                  | Estimated Changes                     |
|-------------------------------------------------------|----------------------------------------------------|---------------------------------------------------|---------------------------------------|
| Add a 'face' next to each player (human, squirrel, AI)| No avatar or face next to player names.            | Show customizable avatars next to each player.     | Implement avatar selection/display.   |
| Show error message to user if the game crashes.       | Game hangs with timer animation when it crashes.   | Display an appropriate error message on crash.     | Implement error-handling logic.       |
| Allow replaying past games.                           | No replay functionality for past games.            | Users should be able to replay past games.         | Add replay logic for game history.    |
| Show the user's estimated rank on the leaderboard.    | Only displays rank position.                       | Display estimated rank alongside leaderboard rank. | Adjust leaderboard display logic.     |
| Add more game configuration options at launch.        | Limited configuration options when launching.      | Add model level and other config options.          | Expand game settings interface.       |
| Add cleaner font to the game interface.               | Current font may not be user-friendly or clear.    | Implement a cleaner and more readable font.        | Update font styles across the UI.     |

---

### Backend

#### **Bugs**

| Description                                           | Current Behaviour                                  | Desired Behaviour                                  | Estimated Changes                     |
|-------------------------------------------------------|----------------------------------------------------|---------------------------------------------------|---------------------------------------|
| Website requires 'www' in the URL to work.            | Website only loads with 'www' in the URL.          | Remove 'www' requirement, move to Azure hosting.   | Change DNS settings, move to Azure.   |
| Run app with PM2 for automatic restarts.              | App does not automatically restart on crashes.     | Use PM2 to ensure app restarts after crashes.      | Integrate PM2 process management.     |

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

