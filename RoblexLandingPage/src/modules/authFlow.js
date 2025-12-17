const API_BASE = 'https://backendroblex.up.railway.app';

export function showAuthCard(cardId) {
  const authCard = document.getElementById('auth-card');
  const verifyCard = document.getElementById('verify-card');
  const authMessage = document.getElementById('auth-message');
  const verifyMessage = document.getElementById('verify-message');
  if (!authCard || !verifyCard) return;

  authCard.style.display = 'none';
  verifyCard.style.display = 'none';
  if (authMessage) authMessage.textContent = '';
  if (verifyMessage) verifyMessage.textContent = '';

  if (cardId === 'register' || cardId === 'login') {
    authCard.style.display = 'block';
  } else if (cardId === 'verify') {
    verifyCard.style.display = 'block';
  }
}

export function initAuthFlow() {
  const authForm = document.getElementById('auth-form');
  const authMessage = document.getElementById('auth-message');
  const tabs = document.querySelectorAll('.auth-tab');
  const verifyForm = document.getElementById('verify-form');
  const verifyMessage = document.getElementById('verify-message');
  let registeredEmail = '';

  if (!authForm || !verifyForm || !tabs.length) return;

  let mode = 'login';

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      mode = tab.dataset.mode || 'login';
      authMessage.style.color = '#ff9b9b';
      authMessage.textContent = '';
    });
  });

  authForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    authMessage.style.color = '#ff9b9b';
    authMessage.textContent = '';
    const email = authForm.email.value.trim();
    const password = authForm.password.value;
    const submitButton = authForm.querySelector('.auth-submit');

    if (!email || !password) {
      authMessage.textContent = 'Email and password required';
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = 'Processing...';

    try {
      const response = await fetch(`${API_BASE}/api/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403 && data.error && data.error.includes('verified')) {
          registeredEmail = email;
          const verifyEmailField = document.getElementById('verify-email');
          if (verifyEmailField) verifyEmailField.value = email;
          if (verifyMessage) {
            verifyMessage.textContent = 'Please enter the 6-digit code sent to your email.';
          }
          showAuthCard('verify');
          return;
        }

        authMessage.style.color = '#ff9b9b';
        authMessage.textContent = data.error || 'Request failed';
        return;
      }

      if (mode === 'register') {
        registeredEmail = email;
        const verifyEmailField = document.getElementById('verify-email');
        if (verifyEmailField) verifyEmailField.value = email;
        if (verifyMessage) {
          verifyMessage.innerHTML = `
                    <span class="success-instruction">aź?. Registration Successful!</span>
                    <br>
                    <span class="success-instruction-detail">
                        A 6-digit code has been sent to your email. Please enter it below.
                    </span>
                `;
        }
        showAuthCard('verify');
        authForm.reset();
      } else if (mode === 'login') {
        authMessage.style.color = '#9bffa7';
        authMessage.textContent = 'Logged in! Redirecting to dashboard...';
      }
    } catch (error) {
      console.error(error);
      authMessage.style.color = '#ff9b9b';
      authMessage.textContent = 'Network error. Check console.';
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Continue';
    }
  });

  verifyForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    verifyMessage.style.color = '#ff9b9b';
    verifyMessage.textContent = '';

    const email = verifyForm.email.value || registeredEmail;
    const code = verifyForm.code.value;
    const submitButton = verifyForm.querySelector('#verify-submit');

    if (code.length !== 6 || isNaN(code)) {
      verifyMessage.textContent = 'Please enter a valid 6-digit code.';
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = 'Verifying...';

    try {
      const response = await fetch(`${API_BASE}/api/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (response.ok) {
        verifyMessage.style.color = '#9bffa7';
        verifyMessage.textContent = 'aź?. Verification complete! You can now log in.';
        verifyForm.reset();
        setTimeout(() => {
          showAuthCard('login');
        }, 2000);
      } else {
        verifyMessage.style.color = '#ff9b9b';
        verifyMessage.textContent = data.error || 'Invalid code or email. Please try again.';
      }
    } catch (error) {
      console.error(error);
      verifyMessage.style.color = '#ff9b9b';
      verifyMessage.textContent = 'Network error during verification.';
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Verify Account';
    }
  });
}
