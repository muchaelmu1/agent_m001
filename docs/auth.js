
const form_signup = document.getElementById('login-form');

form_signup.addEventListener("submit", (e) => {
  e.preventDefault();
    try {
            const username = document.getElementById("signup-name");
          const email = document.getElementById('signup-email');
          const signup_company = document.getElementById('signup-company');
          const signup_password = document.getElementById('signup-password');
          const confirm_password = document.getElementById('signup-confirm');
          const terms = document.getElementById('terms');
          const error = document.getElementById('signup-general-error'); 
          const response = await fetch("http://localhost:8080/api/auth/signup",{
            method: "POST",
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              username,
              email,
              password,
              signup_company,
              confirm_password,
              terms
            })
          });
          const result = await response.json();
          if(response.ok){
            error.innerText = response.message;
            window.location.href = '.dashboard.html';
        }
    } catch (error) {
      const error = document.getElementById('signup-general-error');
      error.innerText = error;
    }
});

const form_signin = document.getElementById("login-form");

form_signin.addEventListener("submit", (e)=>{
  e.preventDefault();
 try {
      const email = document.getElementById('login-email');
      const password = document.getElementById('login-password');
      const remember_me = document.getElementById('remember-me');
      const response = await fetch('http://localhost:8080/api/auth/signin',{
       method: "POST",
       headers: {
         "Content-Type": "application/json"
       },
       body: JSON.stringify({
         email,
         password,
         remember_me
        })
       });
       const result = await response.json();
       if(response.ok){
         window.location.href = './dashboard.html';
       }
 } catch (error) {
   const error = document.getElementById('login-password-error');
   error.innerText = error;
 }
  
});

// Toggle between login and signup forms
function toggleForm() {
  document.getElementById('login-panel').classList.toggle('hidden');
  document.getElementById('signup-panel').classList.toggle('hidden');
  auth.clearAllErrors();
}

// Toggle forgot password
function toggleForgot(e) {
  if (e) e.preventDefault();
  
  document.getElementById('login-panel').classList.toggle('hidden');
  document.getElementById('forgot-panel').classList.toggle('hidden');
  auth.clearAllErrors();
}
