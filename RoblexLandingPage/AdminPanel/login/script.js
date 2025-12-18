const form = document.getElementById("admin-login-form");

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const payload = Object.fromEntries(data.entries());

  // Placeholder: wire up to a secure admin auth endpoint when ready.
  console.table(payload);

  const button = form.querySelector("button");
  button.disabled = true;
  button.textContent = "Checking credentials...";

  setTimeout(() => {
    button.disabled = false;
    button.textContent = "Access Console";
    alert("Admin login endpoint is not wired up yet. Replace this stub with a call to your backend.");
  }, 900);
});