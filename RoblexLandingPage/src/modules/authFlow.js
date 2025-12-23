const API_BASE = 'https://api.roblex.io';

export function initAuthFlow() {
  const form = document.getElementById('auth-form');
  const tabs = document.querySelectorAll('.auth-tab');
  const message = document.getElementById('auth-message');
  const panel = document.querySelector('.auth-panel');
  if (!form || !tabs.length || !panel) return;

  const defaultMode = (panel.dataset.defaultMode || '').trim().toLowerCase();
  let mode = defaultMode === 'register' ? 'register' : 'login';

  function setMode(nextMode) {
    mode = nextMode;
    panel.dataset.mode = mode;
    tabs.forEach((tab) => {
      tab.classList.toggle('active', tab.dataset.mode === mode);
    });
    if (message) {
      message.style.color = '#ff9b9b';
      message.textContent = '';
    }
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      setMode(tab.dataset.mode || 'login');
    });
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!message) return;

    message.style.color = '#ff9b9b';
    message.textContent = '';

    const email = form.email.value.trim();
    const password = form.password.value;
    const submitButton = form.querySelector('.auth-submit');

    if (!email || !password) {
      message.textContent = 'Email and password required';
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
        message.textContent = data.error || 'Request failed';
        return;
      }

      if (mode === 'register') {
        message.style.color = '#9bffa7';
        message.textContent = 'Account created. You can now log in.';
        setMode('login');
        form.reset();
      } else {
        message.style.color = '#9bffa7';
        message.textContent = 'Welcome back! Redirecting to dashboard...';
      }
    } catch (error) {
      console.error(error);
      message.textContent = 'Network error. Try again shortly.';
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Continue';
    }
  });

  setMode(mode);
}
