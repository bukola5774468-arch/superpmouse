// Password Protection System
// Strong security to prevent unauthorized access

// Set your password here (change this to your desired password)
const DASHBOARD_PASSWORD = "Moon2025!@#";

// Check if already authenticated
document.addEventListener('DOMContentLoaded', () => {
    const isAuthenticated = sessionStorage.getItem('dashboard_authenticated');
    
    if (isAuthenticated === 'true') {
        // Already logged in, show dashboard
        unlockDashboard();
    } else {
        // Show password screen
        document.getElementById('mainContent').style.display = 'none';
    }
    
    // Password input handlers
    const passwordInput = document.getElementById('passwordInput');
    const passwordSubmit = document.getElementById('passwordSubmit');
    const passwordError = document.getElementById('passwordError');
    
    // Submit on Enter key
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            checkPassword();
        }
    });
    
    // Submit on button click
    passwordSubmit.addEventListener('click', checkPassword);
    
    // Auto-focus password input
    passwordInput.focus();
    
    function checkPassword() {
        const enteredPassword = passwordInput.value;
        
        if (enteredPassword === DASHBOARD_PASSWORD) {
            // Correct password
            passwordError.textContent = '';
            sessionStorage.setItem('dashboard_authenticated', 'true');
            
            // Success animation
            document.querySelector('.password-container').classList.add('success');
            
            setTimeout(() => {
                unlockDashboard();
            }, 1000);
        } else {
            // Wrong password
            passwordError.textContent = '❌ Incorrect password. Access denied.';
            passwordInput.value = '';
            passwordInput.classList.add('shake');
            
            setTimeout(() => {
                passwordInput.classList.remove('shake');
            }, 500);
        }
    }
    
    function unlockDashboard() {
        const overlay = document.getElementById('passwordOverlay');
        const mainContent = document.getElementById('mainContent');
        
        // Fade out password screen
        overlay.style.opacity = '0';
        overlay.style.transform = 'scale(0.9)';
        
        setTimeout(() => {
            overlay.style.display = 'none';
            mainContent.style.display = 'block';
            
            // Fade in main content
            mainContent.style.opacity = '0';
            setTimeout(() => {
                mainContent.style.opacity = '1';
            }, 50);
        }, 500);
    }
});

// Disable right-click and view source shortcuts for security
document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
});

document.addEventListener('keydown', (e) => {
    // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
    if (
        e.keyCode === 123 || // F12
        (e.ctrlKey && e.shiftKey && e.keyCode === 73) || // Ctrl+Shift+I
        (e.ctrlKey && e.shiftKey && e.keyCode === 74) || // Ctrl+Shift+J
        (e.ctrlKey && e.keyCode === 85) // Ctrl+U
    ) {
        e.preventDefault();
        return false;
    }
});

// Add logout function (optional - can be called from console or button)
window.logout = function() {
    sessionStorage.removeItem('dashboard_authenticated');
    location.reload();
};

