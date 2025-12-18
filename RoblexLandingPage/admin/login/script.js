const form = document.getElementById("admin-login-form");
const peekButton = document.querySelector(".peek");
const passwordField = form?.querySelector("input[name='password']");

peekButton?.addEventListener("click", () => {
  if (!passwordField) return;
  const shouldReveal = passwordField.type === "password";
  passwordField.type = shouldReveal ? "text" : "password";
  peekButton.classList.toggle("peek--active", shouldReveal);
});

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const payload = Object.fromEntries(data.entries());

  // Placeholder: wire up to a secure admin auth endpoint when ready.
  console.table(payload);

  const button = form.querySelector(".primary-button");
  if (!button) {
    return;
  }

  const defaultLabel = button.textContent;
  button.disabled = true;
  button.textContent = "Проверяем доступ...";

  setTimeout(() => {
    button.disabled = false;
    button.textContent = defaultLabel;
    alert("Admin login endpoint is not wired up yet. Replace this stub with a call to your backend.");
  }, 900);
});
