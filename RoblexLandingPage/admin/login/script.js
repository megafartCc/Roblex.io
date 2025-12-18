const form = document.getElementById("admin-login-form");
const peekButton = document.querySelector(".peek");
const passwordField = form?.querySelector("input[name='password']");
const rootSurface = document.querySelector(".Dark");
const themeToggle = document.getElementById("theme-toggle");
const rememberToggle = document.getElementById("remember-toggle");
const rememberText = rememberToggle?.querySelector(".status-pill__text");

peekButton?.addEventListener("click", () => {
  if (!passwordField) return;
  const show = passwordField.type === "password";
  passwordField.type = show ? "text" : "password";
  peekButton.classList.toggle("peek--active", show);
});

themeToggle?.addEventListener("click", () => {
  if (!rootSurface) return;
  const next = rootSurface.dataset.mode === "light" ? "dark" : "light";
  rootSurface.dataset.mode = next;
});

rememberToggle?.addEventListener("click", () => {
  const isActive = rememberToggle.classList.toggle("status-pill--active");
  rememberToggle.setAttribute("aria-pressed", isActive ? "true" : "false");
  if (rememberText) {
    rememberText.textContent = isActive ? "Выбрано" : "Не выбрано";
  }
});

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const payload = Object.fromEntries(data.entries());
  payload.remember = rememberToggle?.classList.contains("status-pill--active") || false;

  console.table(payload);

  const button = form.querySelector(".Buttons");
  if (!button) return;

  const defaultLabel = button.textContent?.trim() || "Продолжить";
  button.disabled = true;
  button.textContent = "Проверяем доступ...";

  setTimeout(() => {
    button.disabled = false;
    button.textContent = defaultLabel;
    alert("Admin login endpoint is not wired up yet. Replace this stub with a call to your backend.");
  }, 900);
});
