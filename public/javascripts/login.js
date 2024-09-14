
if (document.readyState !== "loading") {
	initializeCodeLogin();
} else {
	document.addEventListener("DOMContentLoaded", function () {
		initializeCodeLogin();
	});
}

/**
 * Initializes the login functionality by adding an event listener to the login form.
 * The event listener triggers the loginUser function when the form is submitted.
 */
function initializeCodeLogin() {
	document.getElementById("login-form").addEventListener("submit", loginUser);
}


/**
 * Handles the user login process by preventing the default form submission,
 * sending a POST request to the server with the form data, and processing the response.
 *
 * @param {Event} event - The event object representing the form submission event.
 */
function loginUser(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    console.log(event.target)
    fetch("/users/login", {
        method: "POST",
        body: formData
    })
    .then((response) => response.json())
    .then((data) => {
      console.log(data)
    if(data.token) {
        storeToken(data.token);
        socket.connect('http://localhost:3000', {
          query: {"token": localStorage.getItem('auth_token')}
        }); 
        window.location.href="/";
    }
    else{
        if(data.message) {
            window.alert('Invalid credentials');
        } else {
            window.alert('Very strange error!');
        }
      }
    })
}

/**
 * Stores the provided authentication token in the local storage.
 *
 * @param {string} token - The authentication token to be stored.
 */
function storeToken(token) {
	localStorage.setItem('auth_token', token);
}