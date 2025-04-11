document.addEventListener('DOMContentLoaded', () => {
    const signInBtn = document.querySelector('#sign-in-btn');
    const signUpBtn = document.querySelector('#sign-up-btn');
    const container = document.querySelector('.container');
    const signInForm = document.querySelector('.sign-in-form');
    const signUpForm = document.querySelector('.sign-up-form');
    const loginUsername = document.querySelector('#login-username');
    const loginPassword = document.querySelector('#login-password');
    const registerUsername = document.querySelector('#register-username');
    const registerEmail = document.querySelector('#register-email');
    const registerPassword = document.querySelector('#register-password');
    const registerConfirmPassword = document.querySelector('#register-confirm-password');

    // Switch to Sign Up form
    signUpBtn.addEventListener('click', () => {
        container.classList.add('sign-up-mode');
    });

    // Switch to Sign In form
    signInBtn.addEventListener('click', () => {
        container.classList.remove('sign-up-mode');
    });

    // Listen for messages from the parent window (React app)
    window.addEventListener('message', (event) => {
        // Make sure the message is from our parent window
        if (event.data && (event.data.type === 'auth-error' || event.data.type === 'auth-success')) {
            if (event.data.type === 'auth-error') {
                showError(event.data.action === 'login' ? loginPassword : registerPassword, event.data.message);
            } else {
                showSuccess(event.data.message);
                if (event.data.action === 'register') {
                    // Switch to login form after successful registration
                    setTimeout(() => {
                        container.classList.remove('sign-up-mode');
                        signUpForm.reset();
                    }, 1500);
                }
            }
        }
    });

    // Login form submission
    signInForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Basic validation
        if (!loginUsername.value.trim()) {
            showError(loginUsername, 'Username is required');
            return;
        }
        
        if (!loginPassword.value.trim()) {
            showError(loginPassword, 'Password is required');
            return;
        }
        
        // Send login data to parent window (React app)
        window.parent.postMessage({
            type: 'auth',
            action: 'login',
            username: loginUsername.value.trim(),
            password: loginPassword.value
        }, '*');
    });

    // Registration form submission
    signUpForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Reset previous error messages
        resetErrors();
        
        // Basic validation
        if (!registerUsername.value.trim()) {
            showError(registerUsername, 'Username is required');
            return;
        }
        
        if (!registerEmail.value.trim()) {
            showError(registerEmail, 'Email is required');
            return;
        } else if (!isValidEmail(registerEmail.value)) {
            showError(registerEmail, 'Please enter a valid email');
            return;
        }
        
        const labName = document.getElementById('register-lab-name');
        if (!labName || !labName.value.trim()) {
            showError(labName, 'Laboratory name is required');
            return;
        }
        
        if (!registerPassword.value) {
            showError(registerPassword, 'Password is required');
            return;
        } else if (registerPassword.value.length < 6) {
            showError(registerPassword, 'Password must be at least 6 characters');
            return;
        }
        
        if (registerPassword.value !== registerConfirmPassword.value) {
            showError(registerConfirmPassword, 'Passwords do not match');
            return;
        }
        
        // Send registration data to parent window (React app)
        window.parent.postMessage({
            type: 'auth',
            action: 'register',
            username: registerUsername.value.trim(),
            email: registerEmail.value.trim(),
            labName: labName.value.trim(),
            password: registerPassword.value
        }, '*');
    });

    // Helper functions
    function showError(input, message) {
        const formControl = input.parentElement;
        formControl.classList.add('error');
        
        // Create error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerText = message;
        
        // Only add if it doesn't already exist
        if (!formControl.querySelector('.error-message')) {
            formControl.appendChild(errorDiv);
        }
        
        // Style the input field
        input.style.borderColor = '#e74c3c';
        
        // Remove error after 3 seconds
        setTimeout(() => {
            formControl.classList.remove('error');
            if (formControl.querySelector('.error-message')) {
                formControl.removeChild(errorDiv);
            }
            input.style.borderColor = '';
        }, 3000);
    }
    
    function resetErrors() {
        document.querySelectorAll('.error-message').forEach(error => {
            error.remove();
        });
        
        document.querySelectorAll('input').forEach(input => {
            input.style.borderColor = '';
        });
    }
    
    function showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.innerText = message;
        
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
            document.body.removeChild(successDiv);
        }, 3000);
    }
    
    function isValidEmail(email) {
        const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }
});
