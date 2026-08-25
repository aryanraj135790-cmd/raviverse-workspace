export function setupAuthForm(authView, onSubmit, onModeChange) {
  if (!authView) return;

  authView.addEventListener("submit", (event) => {
    const form = event.target;

    if (!(form instanceof HTMLFormElement)) return;

    event.preventDefault();

    const formData = new FormData(form);

    const email = formData.get("email");
    const password = formData.get("password");

    onSubmit({
      email,
      password,
    });
  });

  authView.addEventListener("click", (event) => {
    const modeButton = event.target.closest(
      ".auth-mode-button, .auth-mode-switch",
    );

    if (!modeButton) return;

    const nextMode =
      modeButton.dataset.authMode ??
      (modeButton.textContent.trim() === "Sign up" ? "signup" : "login");

    onModeChange?.(nextMode);
  });
}
