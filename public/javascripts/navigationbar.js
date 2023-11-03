if (document.readyState !== "loading") {
    initializeCodeNav();
  } else {
    document.addEventListener("DOMContentLoaded", function () {
      initializeCodeNav();
    });
  }

  async function initializeCodeNav() {
   
   let loginHref =  document.getElementById("login");
   let logoutHref = document.getElementById("logout");

   logoutHref.addEventListener("click", function() {
    localStorage.removeItem('auth_token');
    });
   // Check for authToken:
   let authToken = localStorage.getItem('auth_token');
   console.log(authToken)
  if (authToken != null) {
      // Validate the auth token by fetching users/validateuser route:
      let response = fetch("/users/validateuser", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + authToken
        }
      })
      let auth = await response.then(res => res.json());
   if(auth) {
    loginHref.style.display = 'none'
    logoutHref.style.display = 'block'
   }
  }
  else {
    loginHref.style.display = 'block'
    logoutHref.style.display = 'none'
   }
}