import sunIcon from "./assets/icons-sun.svg";
import moonIcon from "./assets/icons-moon.svg";

const form = document.getElementById("admin-login-form");
const peekButton = document.querySelector(".peek");
const passwordField = form?.querySelector("input[name='password']");
const surface = document.querySelector("[data-collection-1-mode]");
const themeToggle = document.getElementById("theme-toggle");
const themeIcon = themeToggle?.querySelector("[data-theme-icon]");
const rememberToggle = document.getElementById("remember-toggle");
const rememberLabel = rememberToggle?.querySelector("span:last-child");
const THEME_ICONS = {
  dark: sunIcon,
  light: moonIcon,
};

peekButton?.addEventListener("click", () => {
  if (!passwordField || !peekButton) return;
  const show = passwordField.type === "password";
  passwordField.type = show ? "text" : "password";
  peekButton.classList.toggle("peek--active", show);
});

const applyTheme = (next) => {
  if (!surface) return;
  surface.dataset.collection1Mode = next;
  themeToggle?.setAttribute(
    "aria-label",
    next === "dark" ? "??????????? ?? ??????? ????" : "??????????? ?? ?????? ????"
  );
  const iconSrc = next === "dark" ? THEME_ICONS.dark : THEME_ICONS.light;
  const iconAlt =
    next === "dark" ? "??????????? ?? ?????? ????" : "??????????? ?? ??????? ????";
  if (themeIcon) {
    themeIcon.src = iconSrc;
    themeIcon.alt = iconAlt;
  }
};

if (surface) {
  applyTheme(surface.dataset.collection1Mode || "dark");
}

themeToggle?.addEventListener("click", () => {
  const current = surface?.dataset.collection1Mode || "dark";
  const next = current === "dark" ? "light" : "dark";
  applyTheme(next);
});

rememberToggle?.addEventListener("click", () => {
  const isActive = rememberToggle.classList.toggle("status-pill--active");
  rememberToggle.setAttribute("aria-pressed", String(isActive));
  if (rememberLabel) {
    rememberLabel.textContent = isActive ? "???????" : "?? ???????";
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
  const defaultLabel = button.textContent?.trim() || "??????????";
  button.disabled = true;
  button.textContent = "????????? ??????...";

  setTimeout(() => {
    button.disabled = false;
    button.textContent = defaultLabel;
    alert("Admin login endpoint is not wired up yet. Replace this stub with a call to your backend.");
  }, 900);
});
