const form_signup = document.getElementById('signup-form');

form_signup.addEventListener('submit', async (e) => {
    e.preventDefault();

    const errorElement = document.getElementById('signup-general-error');

    try {
        const username = document.getElementById('signup-name').value.trim();
        const email = document.getElementById('signup-email').value.trim();
        const company = document.getElementById('signup-company').value.trim();
        const password = document.getElementById('signup-password').value;
        const confirm_password = document.getElementById('signup-confirm').value;
        const terms = document.getElementById('terms').checked;

        // Frontend validation
        if (!username || !email || !password) {
            errorElement.innerText =
                "Please provide username, email, and password.";
            return;
        }

        if (password !== confirm_password) {
            errorElement.innerText = "Passwords do not match.";
            return;
        }

        if (!terms) {
            errorElement.innerText =
                "Please accept the terms and conditions.";
            return;
        }

        const response = await fetch(
            'https://serveai-2.onrender.com/api/auth/signup',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username,
                    email,
                    password,
                    company: company || null
                })
            }
        );

        const result = await response.json();

        if (response.ok) {
            // Store JWT returned by the backend
            if (result.token) {
                localStorage.setItem('token', result.token);
            }

            errorElement.innerText =
                result.message || "Signup successful!";

            window.location.href = './dashboard.html';
        } else {
            errorElement.innerText =
                result.message || "Signup failed.";
        }

    } catch (err) {
        console.error("Signup error:", err);

        errorElement.innerText =
            "Unable to connect to the server. Please try again.";
    }
});


const form_signin = document.getElementById('login-form');

form_signin.addEventListener('submit', async (e) => {
    e.preventDefault();

    const errorElement =
        document.getElementById('login-password-error');

    try {
        const email =
            document.getElementById('login-email').value.trim();

        const password =
            document.getElementById('login-password').value;

        const remember_me =
            document.getElementById('remember-me').checked;

        if (!email || !password) {
            errorElement.innerText =
                "Please enter your email and password.";
            return;
        }

        const response = await fetch(
            'https://serveai-2.onrender.com/api/auth/signin',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    password,
                    remember_me
                })
            }
        );

        const result = await response.json();

        if (response.ok) {
            // Store JWT returned by the backend
            if (result.token) {
                localStorage.setItem('token', result.token);
            }

            window.location.href = './dashboard.html';

        } else {
            errorElement.innerText =
                result.message || "Invalid credentials.";
        }

    } catch (err) {
        console.error("Signin error:", err);

        errorElement.innerText =
            "Unable to connect to the server. Please try again.";
    }
});


// Toggle between login and signup forms
function toggleForm() {
    document
        .getElementById('login-panel')
        .classList.toggle('hidden');

    document
        .getElementById('signup-panel')
        .classList.toggle('hidden');
}


// Toggle forgot password
function toggleForgot(e) {
    if (e) {
        e.preventDefault();
    }

    document
        .getElementById('login-panel')
        .classList.toggle('hidden');

    document
        .getElementById('forgot-panel')
        .classList.toggle('hidden');

    if (typeof auth !== 'undefined' && auth.clearAllErrors) {
        auth.clearAllErrors();
    }
}