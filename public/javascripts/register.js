
if (document.readyState !== "loading") {
    initializeCodeLogin();
  } else {
    document.addEventListener("DOMContentLoaded", function () {
      initializeCodeLogin();
    });
  }

  
  function initializeCodeLogin() {
    document.getElementById("register-form").addEventListener("submit", registerUser);
}


function registerUser(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    fetch("/users/register", {
      method: "POST",
      body: formData
  })
  .then((response) => response.json())
  .then((data) => {
    console.log(data)
  if(data.email) {
    //document.getElementById('error-message').innerHTML = 'Email already in use';
    window.alert('Email already in use')    
    }
    else if(data.errors) {
        window.alert('Error: '+data.errors[0].msg+' in '+data.errors[0].path)
     //document.getElementById('error-message').innerHTML = 'Error: '+data.errors[0].msg+' in '+data.errors[0].path; 
    }
    else if(data.success == true) {
    window.location.href="/login";
    }
    else {
        window.alert("Something went wrong");
    }
    })
  
  
  }