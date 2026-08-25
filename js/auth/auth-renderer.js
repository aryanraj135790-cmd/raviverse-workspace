export function renderAuthView(authView, state) {
  switch (state.mode) {
    case "login":
    case "signup": {
      const isLogin = state.mode === "login";
      const mainText = isLogin ? "Sign In" : "Sign Up";

      const authCard = document.createElement("section");
      authCard.className = "auth-card";

      const brand = document.createElement("div");
      brand.className = "auth-brand";
      brand.textContent = "RaviVerse Workspace";

      const authHeader = document.createElement("header");
      authHeader.className = "auth-header";

      const heading = document.createElement("h1");
      heading.textContent = mainText;

      const description = document.createElement("p");
      description.textContent = isLogin
        ? "Welcome back. Sign in to continue to your workspace."
        : "Create your RaviVerse Workspace account.";

      authHeader.append(heading, description);

      const form = document.createElement("form");
      form.className = "auth-form";

      // Email
      const emailField = document.createElement("div");
      emailField.className = "auth-field";

      const emailLabel = document.createElement("label");
      emailLabel.setAttribute("for", "auth-email");
      emailLabel.textContent = "Email";

      const emailInput = document.createElement("input");
      emailInput.type = "email";
      emailInput.id = "auth-email";
      emailInput.name = "email";
      emailInput.autocomplete = "email";
      emailInput.placeholder = "you@example.com";
      emailInput.required = true;

      emailField.append(emailLabel, emailInput);

      // Password
      const passwordField = document.createElement("div");
      passwordField.className = "auth-field";

      const passwordLabel = document.createElement("label");
      passwordLabel.setAttribute("for", "auth-password");
      passwordLabel.textContent = "Password";

      const passwordInput = document.createElement("input");
      passwordInput.type = "password";
      passwordInput.id = "auth-password";
      passwordInput.name = "password";
      passwordInput.autocomplete = isLogin
        ? "current-password"
        : "new-password";
      passwordInput.placeholder = "Enter your password";
      passwordInput.required = true;

      passwordField.append(passwordLabel, passwordInput);

      // Error
      if (state.status === "error") {
        const errorMessage = document.createElement("p");
        errorMessage.className = "auth-error";
        errorMessage.setAttribute("role", "alert");
        errorMessage.textContent = state.error;

        form.append(errorMessage);
      }

      // Submit
      const submitButton = document.createElement("button");
      submitButton.type = "submit";
      submitButton.className = "auth-submit";
      submitButton.textContent =
        state.status === "loading" ? "Signing in..." : mainText;

      if (state.status === "loading") {
        submitButton.disabled = true;

        const loadingIndicator = document.createElement("span");
        loadingIndicator.className = "auth-loading";
        loadingIndicator.setAttribute("role", "status");
        loadingIndicator.setAttribute("aria-live", "polite");
        loadingIndicator.textContent = "Authenticating...";

        form.append(loadingIndicator);
      }

      const footer = document.createElement("p");
      footer.className = "auth-footer";
      footer.textContent = "Secure workspace access";

      const modeSwitch = document.createElement("p");
      modeSwitch.className = "auth-mode-switch";

      const modeText = document.createElement("span");
      modeText.textContent = isLogin
        ? "Don't have an account?"
        : "Already have an account?";

      const modeButton = document.createElement("button");
      modeButton.type = "button";
      modeButton.className = "auth-mode-button";
      modeButton.dataset.authMode = isLogin ? "signup" : "login";
      modeButton.textContent = isLogin ? "Sign up" : "Sign in";

      modeSwitch.append(modeText, modeButton);

      form.append(emailField, passwordField, submitButton, modeSwitch);

      authCard.append(brand, authHeader, form, footer);
      authView.replaceChildren(authCard);

      break;
    }

    default:
      break;
  }
}
