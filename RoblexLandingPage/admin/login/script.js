const form = document.getElementById("admin-login-form");
const peekButton = document.querySelector(".peek");
const passwordField = form?.querySelector("input[name='password']");
const surface = document.querySelector("[data-collection-1-mode]");
const themeToggle = document.getElementById("theme-toggle");
const rememberToggle = document.getElementById("remember-toggle");
const rememberLabel = rememberToggle?.querySelector("span:last-child");

peekButton?.addEventListener("click", () => {
  if (!passwordField || !peekButton) return;
  const show = passwordField.type === "password";
  passwordField.type = show ? "text" : "password";
  peekButton.classList.toggle("peek--active", show);
});

themeToggle?.addEventListener("click", () => {
  const next =
    document.documentElement.dataset.collection1Mode === "dark" ? "light" : "dark";
  document.documentElement.dataset.collection1Mode = next;
  if (surface) surface.dataset.collection1Mode = next;
});

rememberToggle?.addEventListener("click", () => {
  const isActive = rememberToggle.classList.toggle("status-pill--active");
  rememberToggle.setAttribute("aria-pressed", String(isActive));
  if (rememberLabel) {
    rememberLabel.textContent = isActive ? "Выбрано" : "Не выбрано";
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
