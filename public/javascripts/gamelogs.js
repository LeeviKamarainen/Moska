
if (document.readyState !== "loading") {
    initializeCodeGameLogs();
  } else {
    document.addEventListener("DOMContentLoaded", function () {
      initializeCodeGameLogs();
    });
  }

  function initializeCodeGameLogs() {
    let gameLogs = document.getElementById('gamelogs')
    console.log(gameLogs)
    socket.emit("gamelogs","true");

    gameLogs.innerHTML = "";
    socket.on("rendergamelogs", (gamelogdata) => {
        console.log(gamelogdata.gamelogs)
        if(gamelogdata.gamelogs == "No game in progress!") {
            const listItem = document.createElement("li");
            listItem.textContent = gamelogdata.gamelogs;
            gameLogs.appendChild(listItem);
        } else {
            for (let index = 0; index < gamelogdata.gamelogs.length; index++) {
                const element = gamelogdata.gamelogs[index];
                const listItem = document.createElement("li");
                listItem.textContent = element;
                gameLogs.appendChild(listItem);
            }
        }
     })
}