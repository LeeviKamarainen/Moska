if (document.readyState !== "loading") {
    console.log("Loading!")
      initializeCodeMenu()
    } else {
        console.log("Loading!")
        
    document.addEventListener("DOMContentLoaded", function () {
      initializeCodeMenu()
    });
    }

async function initializeCodeMenu() {
  
    let startGameButton = document.getElementById('start-game');
    let reconnectButton = document.getElementById('reconnect');
    startGameButton.addEventListener("click", function() {
        fetch('/startgame')
          .then(response => response.text())
          .then(updatedHTML => {
            
            // Replace the existing HTML with the updated HTML
            document.open();
            document.write(updatedHTML);
            document.gameStart = "gamestart";
            document.close();
            
          });
    })

    reconnectButton.addEventListener("click", function() {
      fetch('/startgame')
        .then(response => response.text())
        .then(updatedHTML => {
          
          // Replace the existing HTML with the updated HTML
          document.open();
          document.gameStart = "gamereconnect";
          document.write(updatedHTML);
          document.close();
          
        });
  })


}