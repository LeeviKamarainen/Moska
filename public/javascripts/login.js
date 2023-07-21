
if (document.readyState !== "loading") {
    initializeCodeLogin();
  } else {
    document.addEventListener("DOMContentLoaded", function () {
      initializeCodeLogin();
    });
  }

  function initializeCodeLogin() {
    document.getElementById("login-form").addEventListener("submit", loginUser);
}


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
        window.location.href="/";
    }
    else{
        if(data.message) {
            window.alert('Invalid credentials')  
          //document.getElementById('error-message').innerHTML = 'Invalid credentials';
        } else {
            //document.getElementById('error-message').innerHTML = "Very strange error!";
            
            window.alert('Very strange error!')  
        }
      }
    })
}



function storeToken(token) {
  localStorage.setItem('auth_token', token);
}