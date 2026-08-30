const form_signup = document.getElementById('signup-form');

// Added "async" before the arrow function to support "await"
form_signup.addEventListener('submit', async (e) => { 
    e.preventDefault();
    const errorElement = document.getElementById('signup-general-error'); // Renamed variable to avoid shadowing
    
    try { 
        // Added missing quote marks around all element IDs
        const username = document.getElementById('signup-name').value; 
        const email = document.getElementById('signup-email').value; 
        const signup_company = document.getElementById('signup-company').value; 
        const signup_password = document.getElementById('signup-password').value; 
        const confirm_password = document.getElementById('signup-confirm').value; 
        const terms = document.getElementById('terms').checked; // Changed .value to .checked for a checkbox

        // URL changed to HTTPS to match signin and prevent mixed-content blocks
        const response = await fetch('https://onrender.com', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            // Changed "password" key to "signup_password" to match the extracted variable name
            body: JSON.stringify({ username, email, signup_password, signup_company, confirm_password }) 
        }); 
        
        const result = await response.json(); 
        
        if (response.ok) { 
            // Server response text is usually nested in the JSON payload (result.message), not the response object
            errorElement.innerText = result.message || "Signup successful!"; 
            window.location.href = './dashboard.html'; // Fixed formatting path syntax
        } else {
            // Display server validation/error messages if response is not ok
            errorElement.innerText = result.message || "Signup failed.";
        }
    } catch (err) { 
        errorElement.innerText = err.message || "An unexpected error occurred."; 
    } 
});

const form_signin = document.getElementById('login-form'); 

// Added "async" before the arrow function
form_signin.addEventListener('submit', async (e) => { 
    e.preventDefault(); 
    const errorElement = document.getElementById('login-password-error');
    
    try { 
        // Added missing ".value" to extract strings, and ".checked" for the checkbox
        const email = document.getElementById('login-email').value; 
        const password = document.getElementById('login-password').value; 
        const remember_me = document.getElementById('remember-me').checked; 

        const response = await fetch('https://serveai-2.onrender.com/api/auth/signin', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ email, password, remember_me }) 
        }); 
        
        const result = await response.json(); 
        
        if (response.ok) { 
            window.location.href = './dashboard.html'; 
        } else {
            errorElement.innerText = result.message || "Invalid credentials.";
        }
    } catch (err) { 
        errorElement.innerText = err.message || "An unexpected error occurred."; 
    } 
});

// Toggle between login and signup forms 
function toggleForm() { 
    document.getElementById('login-panel').classList.toggle('hidden'); 
    document.getElementById('signup-panel').classList.toggle('hidden'); 
} 

// Toggle forgot password 
function toggleForgot(e) { 
    if (e) { e.preventDefault(); } 
    document.getElementById('login-panel').classList.toggle('hidden'); 
    document.getElementById('forgot-panel').classList.toggle('hidden'); 
    
    // Wrapped in a check to ensure the 'auth' object exists globally before calling it
    if (typeof auth !== 'undefined' && auth.clearAllErrors) {
        auth.clearAllErrors(); 
    }
}
