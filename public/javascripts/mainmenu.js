if (document.readyState !== "loading") {
	initializeCodeMenu()
} else {
	document.addEventListener("DOMContentLoaded", function () {
		initializeCodeMenu()
	});
}

/**
 * Initializes the code menu by setting up event listeners for the start game and reconnect buttons.
 * 
 * This function adds click event listeners to the 'start-game' and 'reconnect' buttons. When these buttons
 * are clicked, it sends a fetch request to the '/startgame' endpoint and updates the HTML content of the
 * document based on the response. It also sets a custom property on the document to indicate the type of
 * action performed ('gamestart' or 'gamereconnect').
 * 
 * @async
 * @function initializeCodeMenu
 * @returns {Promise<void>} A promise that resolves when the event listeners are set up.
 */
async function initializeCodeMenu() {

	let startGameButton = document.getElementById('start-game');
	let reconnectButton = document.getElementById('reconnect');
	startGameButton.addEventListener("click", function () {
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

	reconnectButton.addEventListener("click", function () {
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