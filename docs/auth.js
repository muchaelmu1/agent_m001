// ========== SESSION MANAGEMENT ==========

class AuthManager {
  constructor() {
    this.users = this.loadUsersFromStorage() || this.getDefaultUsers();
    this.currentUser = this.loadCurrentUserFromStorage();
    this.initEventListeners();
    this.checkAuthStatus();
  }

  // Load/Save from localStorage
  loadUsersFromStorage() {
    try {
      return JSON.parse(localStorage.getItem('serveai_users') || '');
    } catch {
      return null;
    }
  }

  saveUsersToStorage() {
    localStorage.setItem('serveai_users', JSON.stringify(this.users));
  }

  loadCurrentUserFromStorage() {
    try {
      const user = localStorage.getItem('serveai_current_user');
      if (user && this.isSessionValid()) {
        return JSON.parse(user);
      }
      this.clearSession();
      return null;
    } catch {
      return null;
    }
  }

  saveCurrentUserToStorage(user) {
    localStorage.setItem('serveai_current_user', JSON.stringify(user));
    localStorage.setItem('serveai_session_time', Date.now().toString());
  }

  clearSession() {
    localStorage.removeItem('serveai_current_user');
    localStorage.removeItem('serveai_session_time');
    localStorage.removeItem('serveai_remember_me');
  }

  isSessionValid() {
    const sessionTime = localStorage.getItem('serveai_session_time');
    if (!sessionTime) return false;
    
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    return Date.now() - parseInt(sessionTime) < oneWeek;
  }

  // Default demo users
  getDefaultUsers() {
    return [
      {
        id: '1',
        name: 'Demo User',
        email: 'demo@serveai.com',
        password: 'demo123', // Hash in production!
        company: 'Demo Company',
        createdAt: new Date(),
        agents: 3,
        status: 'active'
      }
    ];
  }

  // ========== LOGIN ==========
  login(email, password, rememberMe) {
    const errors = {};

    if (!email) errors.email = 'Email is required';
    else if (!this.isValidEmail(email)) errors.email = 'Invalid email format';

    if (!password) errors.password = 'Password is required';
    else if (password.length < 6) errors.password = 'Password must be at least 6 characters';

    if (Object.keys(errors).length > 0) {
      return { success: false, errors };
    }

    // Find user (in production, validate against a backend)
    const user = this.users.find(u => u.email === email);

    if (!user) {
      return { 
        success: false, 
        general: 'Email not found. Create an account first.'
      };
    }

    // Check password (in production, use bcrypt!)
    if (user.password !== password) {
      return { 
        success: false, 
        general: 'Incorrect password. Please try again.'
      };
    }

    // Successful login
    this.currentUser = user;
    this.saveCurrentUserToStorage(user);
    
    if (rememberMe) {
      localStorage.setItem('serveai_remember_me', email);
    }

    return { success: true };
  }

  // ========== SIGNUP ==========
  signup(name, email, company, password, confirm) {
    const errors = {};

    if (!name || name.trim().length < 2) 
      errors.name = 'Full name is required';

    if (!email) 
      errors.email = 'Email is required';
    else if (!this.isValidEmail(email)) 
      errors.email = 'Invalid email format';
    else if (this.users.find(u => u.email === email)) 
      errors.email = 'Email already registered';

    if (!company || company.trim().length < 2) 
      errors.company = 'Company name is required';

    if (!password) 
      errors.password = 'Password is required';
    else if (password.length < 8) 
      errors.password = 'Password must be at least 8 characters';
    else if (!this.isStrongPassword(password)) 
      errors.password = 'Password must include uppercase, lowercase, and numbers';

    if (password !== confirm) 
      errors.confirm = 'Passwords do not match';

    if (Object.keys(errors).length > 0) {
      return { success: false, errors };
    }

    // Create new user
    const newUser = {
      id: Date.now().toString(),
      name: name.trim(),
      email: email.toLowerCase(),
      company: company.trim(),
      password: password, // Hash in production!
      createdAt: new Date(),
      agents: 0,
      status: 'active'
    };

    this.users.push(newUser);
    this.saveUsersToStorage();
    this.currentUser = newUser;
    this.saveCurrentUserToStorage(newUser);

    return { success: true };
  }

  // ========== PASSWORD RESET ==========
  requestPasswordReset(email) {
    if (!email || !this.isValidEmail(email)) {
      return { success: false, error: 'Invalid email address' };
    }

    const user = this.users.find(u => u.email === email);
    
    if (!user) {
      // Don't reveal if email exists (security best practice)
      return { 
        success: true, 
        message: 'If that email exists, we\'ve sent a reset link'
      };
    }

    // In production, send actual email with reset token
    console.log(`[DEMO] Reset link would be sent to ${email}`);
    
    return { 
      success: true, 
      message: 'Check your email for a password reset link'
    };
  }

  // ========== LOGOUT ==========
  logout() {
    this.currentUser = null;
    this.clearSession();
    window.location.href = 'auth.html';
  }

  // ========== VALIDATION HELPERS ==========
  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  isStrongPassword(password) {
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    return hasUpper && hasLower && hasNumber;
  }

  getPasswordStrength(password) {
    if (!password) return 0;
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*]/.test(password)) strength++;
    
    return Math.min(strength, 3); // 0-3 scale
  }

  // ========== CHECK AUTH STATUS ==========
  checkAuthStatus() {
    // If logged in, redirect to dashboard
    if (this.currentUser && window.location.pathname.includes('auth.html')) {
      window.location.href = 'dashboard.html';
    }
    
    // If not logged in and on dashboard, redirect to auth
    if (!this.currentUser && window.location.pathname.includes('dashboard.html')) {
      window.location.href = 'auth.html';
    }
  }

  // ========== EVENT LISTENERS ==========
  initEventListeners() {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const forgotForm = document.getElementById('forgot-form');
    const passwordInput = document.getElementById('signup-password');

    if (loginForm) {
      loginForm.addEventListener('submit', (e) => this.handleLoginSubmit(e));
    }

    if (signupForm) {
      signupForm.addEventListener('submit', (e) => this.handleSignupSubmit(e));
    }

    if (forgotForm) {
      forgotForm.addEventListener('submit', (e) => this.handleForgotSubmit(e));
    }

    if (passwordInput) {
      passwordInput.addEventListener('input', (e) => this.updatePasswordStrength(e));
    }
  }

  handleLoginSubmit(e) {
    e.preventDefault();
    this.clearAllErrors();

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const rememberMe = document.getElementById('remember-me').checked;

    const result = this.login(email, password, rememberMe);

    if (result.success) {
      this.showMessage('Signing in...', 'success');
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 500);
    } else {
      if (result.errors) {
        Object.entries(result.errors).forEach(([field, message]) => {
          this.showFieldError(`login-${field}-error`, message);
        });
      }
      if (result.general) {
        this.showFieldError('login-general-error', result.general);
      }
    }
  }

  handleSignupSubmit(e) {
    e.preventDefault();
    this.clearAllErrors();

    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const company = document.getElementById('signup-company').value;
    const password = document.getElementById('signup-password').value;
    const confirm = document.getElementById('signup-confirm').value;
    const terms = document.getElementById('terms').checked;

    if (!terms) {
      this.showFieldError('signup-general-error', 'You must agree to the terms');
      return;
    }

    const result = this.signup(name, email, company, password, confirm);

    if (result.success) {
      this.showMessage('Account created! Redirecting...', 'success');
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 500);
    } else {
      if (result.errors) {
        Object.entries(result.errors).forEach(([field, message]) => {
          this.showFieldError(`signup-${field}-error`, message);
        });
      }
      if (result.general) {
        this.showFieldError('signup-general-error', result.general);
      }
    }
  }

  handleForgotSubmit(e) {
    e.preventDefault();
    this.clearAllErrors();

    const email = document.getElementById('forgot-email').value;
    const result = this.requestPasswordReset(email);

    if (result.success) {
      const msgEl = document.getElementById('forgot-success');
      msgEl.textContent = result.message;
      msgEl.classList.add('show');
      document.getElementById('forgot-email').value = '';
    } else {
      this.showFieldError('forgot-email-error', result.error);
    }
  }

  updatePasswordStrength(e) {
    const password = e.target.value;
    const strength = this.getPasswordStrength(password);
    const bar = document.querySelector('.strength-bar');

    if (bar) {
      bar.classList.remove('weak', 'fair', 'good');
      if (strength === 1) bar.classList.add('weak');
      else if (strength === 2) bar.classList.add('fair');
      else if (strength >= 3) bar.classList.add('good');
    }
  }

  showFieldError(elementId, message) {
    const el = document.getElementById(elementId);
    if (el) {
      el.textContent = message;
      el.classList.add('show');
    }
  }

  clearAllErrors() {
    document.querySelectorAll('.error-msg').forEach(el => {
      el.classList.remove('show');
      el.textContent = '';
    });
  }

  showMessage(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);
  }
}

// Initialize auth manager
const auth = new AuthManager();

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