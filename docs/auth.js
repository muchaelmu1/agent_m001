
const form_signup = document.getElementById('signup-form');

form_signup.addEventListener("submit", (e) => {
  e.preventDefault();
    try {
            const username = document.getElementById("signup-name").value;
          const email = document.getElementById('signup-email').value;
          const signup_company = document.getElementById('signup-company').value;
          const signup_password = document.getElementById('signup-password').value;
          const confirm_password = document.getElementById('signup-confirm').value;
          const terms = document.getElementById('terms');
          const error = document.getElementById('signup-general-error'); 
          const response = await fetch("http://serveai-2.onrender.com/api/auth/signup",{
            method: "POST",
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              username,
              email,
              password,
              signup_company,
              confirm_password
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
      const response = await fetch('https://serveai-2.onrender.com/api/auth/signin',{
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
  if (e){ e.preventDefault();}
  
  document.getElementById('login-panel').classList.toggle('hidden');
  document.getElementById('forgot-panel').classList.toggle('hidden');
  auth.clearAllErrors();
}
