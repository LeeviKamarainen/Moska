if (document.readyState !== "loading") {
    initializeCode();
  } else {
    document.addEventListener("DOMContentLoaded", function () {
      initializeCode();
    });
  }

  function initializeCode() {
   
   let loginHref =  document.getElementById("login");
   let logoutHref = document.getElementById("logout");

   logoutHref.addEventListener("click", function() {
    localStorage.removeItem('auth_token');
    });
   // Check for authToken:
   let authToken = localStorage.getItem('auth_token');
   if(authToken) {
    loginHref.style.display = 'none'
    logoutHref.style.display = 'block'
   }
   else {
    loginHref.style.display = 'block'
    logoutHref.style.display = 'none'
   }
}