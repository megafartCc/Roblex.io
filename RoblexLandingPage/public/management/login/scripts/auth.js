const form = document.getElementById('auth-form');
const passwordInput = form?.querySelector('input[name="password"]');
const passwordToggle = document.getElementById('toggle-password');
const messageEl = document.getElementById('form-message');
const themeToggle = document.getElementById('theme-toggle');
const page = document.querySelector('.page');

const setMessage = (text, tone = 'muted') => {
  if (!messageEl) return;
  messageEl.textContent = text;
  messageEl.dataset.tone = tone;
};

passwordToggle?.addEventListener('click', () => {
  if (!passwordInput) return;
  const isHidden = passwordInput.type === 'password';
  passwordInput.type = isHidden ? 'text' : 'password';
  passwordToggle.setAttribute('aria-label', isHidden ? 'Скрыть пароль' : 'Показать пароль');
});

themeToggle?.addEventListener('click', () => {
  page?.classList.toggle('theme-contrast');
});

form?.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  const email = formData.get('email');
  const password = formData.get('password');

  if (!email || !password) {
    setMessage('Заполните почту и пароль.', 'warn');
    return;
  }

  setMessage('Проверяем доступ...', 'info');

  setTimeout(() => {
    setMessage('Демо: действие не подключено к бэкенду.', 'muted');
  }, 750);
});
