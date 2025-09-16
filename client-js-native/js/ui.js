document.addEventListener('DOMContentLoaded', () => {
    // Check WebAuthn support and show warning if not supported
    if (!utils.isWebAuthnSupported()) {
        const warning = document.createElement('div');
        warning.className = 'message error';
        warning.style.margin = '1rem';
        warning.textContent = 'WebAuthn is not supported in this browser. Please use a modern browser that supports WebAuthn.';
        document.querySelector('main').prepend(warning);
    }

    // UI Elements
    const showRegisterBtn = document.getElementById('showRegister');
    const showLoginBtn = document.getElementById('showLogin');
    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');
    const registerFormElement = document.getElementById('registerFormElement');
    const loginFormElement = document.getElementById('loginFormElement');
    const registerMessage = document.getElementById('registerMessage');
    const loginMessage = document.getElementById('loginMessage');

    // Form switching
    showRegisterBtn.addEventListener('click', () => {
        registerForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
        showRegisterBtn.classList.remove('btn-outline');
        showRegisterBtn.classList.add('btn-solid');
        showLoginBtn.classList.remove('btn-solid');
        showLoginBtn.classList.add('btn-outline');
    });

    showLoginBtn.addEventListener('click', () => {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        showLoginBtn.classList.remove('btn-outline');
        showLoginBtn.classList.add('btn-solid');
        showRegisterBtn.classList.remove('btn-solid');
        showRegisterBtn.classList.add('btn-outline');
    });

    // Helper functions
    function showMessage(element, message, type) {
        element.textContent = message;
        element.className = `message ${type}`;
        element.classList.remove('hidden');
        setTimeout(() => {
            element.classList.add('hidden');
        }, 3000);
    }

    function setLoading(form, isLoading) {
        const btn = form.querySelector('button[type="submit"]');
        const inputs = form.querySelectorAll('input');
        if (isLoading) {
            btn.disabled = true;
            inputs.forEach(input => input.disabled = true);
            btn.innerHTML = `
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                ${form.id === 'registerFormElement' ? 'Registering...' : 'Authenticating...'}
            `;
        } else {
            btn.disabled = false;
            inputs.forEach(input => input.disabled = false);
            btn.textContent = form.id === 'registerFormElement' 
                ? 'Register with WebAuthn' 
                : 'Login with WebAuthn';
        }
    }

    // Handle errors in a user-friendly way
    function handleWebAuthnError(error) {
        let message = 'An error occurred. Please try again.';
        
        switch (error.name) {
            case 'NotAllowedError':
                message = 'Operation was denied. Please try again and accept the prompt.';
                break;
            case 'SecurityError':
                message = 'A security error occurred. Make sure you\'re using HTTPS.';
                break;
            case 'AbortError':
                message = 'Operation was aborted. Please try again.';
                break;
            case 'NotSupportedError':
                message = 'This operation is not supported by your device/browser.';
                break;
            case 'InvalidStateError':
                message = 'The authenticator is in an invalid state. Please try again.';
                break;
            default:
                if (error.message) {
                    message = error.message;
                }
        }
        
        return message;
    }

    // Register form handling
    registerFormElement.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('registerUsername').value;

        if (!username) {
            showMessage(registerMessage, 'Please enter a username', 'error');
            return;
        }

        try {
            setLoading(registerFormElement, true);
            await auth.register(username);
            showMessage(registerMessage, 'Registration successful!', 'success');
            document.getElementById('registerUsername').value = '';
        } catch (error) {
            showMessage(
                registerMessage,
                handleWebAuthnError(error),
                'error'
            );
        } finally {
            setLoading(registerFormElement, false);
        }
    });

    // Login form handling
    loginFormElement.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value;

        if (!username) {
            showMessage(loginMessage, 'Please enter a username', 'error');
            return;
        }

        try {
            setLoading(loginFormElement, true);
            await auth.login(username);
            showMessage(loginMessage, 'Login successful!', 'success');
            document.getElementById('loginUsername').value = '';
        } catch (error) {
            showMessage(
                loginMessage,
                handleWebAuthnError(error),
                'error'
            );
        } finally {
            setLoading(loginFormElement, false);
        }
    });
});
