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
        socket.emit('gamestart',"true")
        window.location.href = "/game";
    })


}