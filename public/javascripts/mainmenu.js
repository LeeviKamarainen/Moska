if (document.readyState !== "loading") {
    console.log("Loading!")
      initializeCode()
    } else {
        console.log("Loading!")
        
    document.addEventListener("DOMContentLoaded", function () {
    
        initializeCode()
    });
    }

async function initializeCode() {

    let startGameButton = document.getElementById('start-game');
    let reconnectButton = document.getElementById('reconnect');
    let gameData = {userId: ""}
    
    startGameButton.addEventListener("click", function() {
        console.log("TEST")
        fetch('/startgame')
          .then(response => response.text())
          .then(updatedHTML => {
            
            // Replace the existing HTML with the updated HTML
            //socket.on('start',)
            document.open();
            document.write(updatedHTML);
            document.close();
            
          });
    })


}