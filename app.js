// Configuration
const API_BASE_URL = 'http://localhost:3000/api';
const BUILD_VERSION = '1.0.0';

// DOM Elements
const emailForm = document.getElementById('emailForm');
const emailInput = document.getElementById('emailInput');
const submitBtn = document.getElementById('submitBtn');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const tryAgainBtn = document.getElementById('tryAgainBtn');
const downloadAgainBtn = document.getElementById('downloadAgainBtn');

// State
let currentToken = null;

// Email validation regex (Stricter: requires at least 2 char TLD)
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Form submission handler
emailForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();

    // Reset previous errors
    resetErrorState();

    // Validate email
    if (!email) {
        showError('Lütfen e-posta adresinizi girin.');
        return;
    }

    if (!emailRegex.test(email)) {
        showError('Geçerli bir e-posta adresi giriniz.');
        return;
    }

    // Disable form
    setFormLoading(true);

    try {
        // Send signup request
        const response = await fetch(`${API_BASE_URL}/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                build: BUILD_VERSION
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Bir hata oluştu.');
        }

        // Store token
        currentToken = data.token;

        // Show success and download ebook
        showSuccess();
        downloadEbook(data.token);

    } catch (error) {
        console.error('Signup error:', error);
        showError(error.message || 'Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
        setFormLoading(false);
    }
});

// Try again button handler (keeps form visible now)
tryAgainBtn.addEventListener('click', () => {
    errorMessage.classList.remove('show');
    emailInput.focus();
});

// Download again button handler
downloadAgainBtn.addEventListener('click', () => {
    if (currentToken) {
        downloadEbook(currentToken);
    }
});

// Set form loading state
function setFormLoading(isLoading) {
    submitBtn.disabled = isLoading;
    emailInput.disabled = isLoading;

    if (isLoading) {
        submitBtn.innerHTML = `
            <span class="btn-text">Yükleniyor...</span>
            <svg class="btn-icon spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" opacity="0.25"></circle>
                <path d="M12 2a10 10 0 0 1 10 10" opacity="0.75"></path>
            </svg>
        `;
    } else {
        submitBtn.innerHTML = `
            <span class="btn-text">OKUMAYA BAŞLA</span>
        `;
    }
}

// Show success message
function showSuccess() {
    emailForm.style.display = 'none';
    errorMessage.classList.remove('show');
    successMessage.classList.add('show');
}

// Show error message
function showError(message) {
    // Shake the input
    emailInput.classList.add('shake');

    // Remove shake class after animation lets it play again
    setTimeout(() => {
        emailInput.classList.remove('shake');
    }, 500);

    // Using the button to show temporary error feedback is a nice pattern for minimal forms
    const originalBtnContent = submitBtn.innerHTML;
    submitBtn.innerHTML = `<span class="btn-text" style="color: var(--c-white);">${message}</span>`;
    submitBtn.style.background = 'var(--c-dark-grey)';

    setTimeout(() => {
        submitBtn.innerHTML = originalBtnContent;
        submitBtn.style.background = ''; // Reset to default
    }, 3000);
}

function resetErrorState() {
    errorMessage.classList.remove('show');
}

// Hide all messages (Deprecated but kept for compatibility if called elsewhere)
function hideMessages() {
    emailForm.style.display = 'block';
    successMessage.classList.remove('show');
    errorMessage.classList.remove('show');
}

// Download ebook
function downloadEbook(token) {
    // Create a temporary link and trigger download
    const downloadUrl = `${API_BASE_URL}/ebook/${token}`;

    // Use a hidden iframe to trigger the download
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = downloadUrl;
    document.body.appendChild(iframe);

    // Remove iframe after download starts
    setTimeout(() => {
        document.body.removeChild(iframe);
    }, 2000);
}

// Add spinner animation
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }
    
    .spinner {
        animation: spin 1s linear infinite;
    }
`;
document.head.appendChild(style);
