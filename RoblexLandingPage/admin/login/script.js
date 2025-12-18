const form = document.getElementById('admin-login-form');
const peekButton = document.querySelector('.peek');
const passwordField = form?.querySelector("input[name='password']");
const surface = document.querySelector('[data-collection-1-mode]');
const themeToggle = document.getElementById('theme-toggle');
const rememberToggle = document.getElementById('remember-toggle');
const rememberLabel = rememberToggle?.querySelector('span:last-child');

const REMEMBER_ON = 'Выбрано';
const REMEMBER_OFF = 'Не выбрано';
const BTN_DEFAULT = 'Продолжить';
const BTN_PENDING = 'Проверяем доступ...';
const TO_LIGHT = 'Переключить на светлую тему';
const TO_DARK = 'Переключить на тёмную тему';
const STORAGE_KEY = 'roblex-admin-theme';

peekButton?.addEventListener('click', () => {
  if (!passwordField || !peekButton) return;
  const show = passwordField.type === 'password';
  passwordField.type = show ? 'text' : 'password';
  peekButton.classList.toggle('peek--active', show);
});

const applyTheme = (mode) => {
  if (!surface) return;
  surface.dataset.collection1Mode = mode;
  themeToggle?.setAttribute('aria-label', mode === 'dark' ? TO_LIGHT : TO_DARK);
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch (err) {
    console.debug('Unable to persist theme', err);
  }
};

const storedTheme = (() => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch (err) {
    return null;
  }
})();

const initialTheme = storedTheme || surface?.dataset.collection1Mode || 'dark';
applyTheme(initialTheme);

themeToggle?.addEventListener('click', () => {
  const current = surface?.dataset.collection1Mode === 'light' ? 'light' : 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
});

rememberToggle?.addEventListener('click', () => {
  const isActive = rememberToggle.classList.toggle('status-pill--active');
  rememberToggle.setAttribute('aria-pressed', String(isActive));
  if (rememberLabel) {
    rememberLabel.textContent = isActive ? REMEMBER_ON : REMEMBER_OFF;
  }
});

form?.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const payload = Object.fromEntries(data.entries());
  payload.remember =
    rememberToggle?.classList.contains('status-pill--active') || false;

  console.table(payload);

  const button = form.querySelector('.Buttons');
  if (!button) return;
  const defaultLabel = button.textContent?.trim() || BTN_DEFAULT;
  button.disabled = true;
  button.textContent = BTN_PENDING;

  setTimeout(() => {
    button.disabled = false;
    button.textContent = defaultLabel;
    alert('Admin login endpoint is not wired up yet. Replace this stub with a call to your backend.');
  }, 900);
});
