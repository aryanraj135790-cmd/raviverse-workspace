/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import { renderAuthView } from "../../js/auth/auth-renderer";
describe("renderAuthView", () => {
  it("should render a Sign In heading in login mode", () => {
    const authView = document.createElement("main");

    renderAuthView(authView, {
      mode: "login",
      status: "idle",
    });

    expect(authView.querySelector("h1").textContent).toBe("Sign In");
  });
  it("should render an accessible Sign In form", () => {
    const authView = document.createElement("main");

    renderAuthView(authView, {
      mode: "login",
      status: "idle",
    });

    // Base structure assertions
    expect(authView.querySelector("form")).not.toBeNull();
    expect(authView.querySelector("form button[type='submit']")).not.toBeNull();

    // Email input assertions
    const emailInput = authView.querySelector("form input[type='email']");
    expect(emailInput).not.toBeNull();
    expect(emailInput.getAttribute("id")).toBe("auth-email");
    expect(emailInput.required).toBe(true);

    // Email label assertions
    const emailLabel = authView.querySelector("form label[for='auth-email']");
    expect(emailLabel).not.toBeNull();

    // Password input assertions
    const passwordInput = authView.querySelector("form input[type='password']");
    expect(passwordInput).not.toBeNull();
    expect(passwordInput.getAttribute("id")).toBe("auth-password");
    expect(passwordInput.required).toBe(true);

    // Password label assertions
    const passwordLabel = authView.querySelector(
      "form label[for='auth-password']",
    );
    expect(passwordLabel).not.toBeNull();
  });
  it("should render a Sign Up form when mode is signup", () => {
    const authView = document.createElement("main");

    renderAuthView(authView, {
      mode: "signup",
      status: "idle",
    });

    // Verify <h1> exists with text "Sign Up"
    const heading = authView.querySelector("h1");
    expect(heading).not.toBeNull();
    expect(heading.textContent).toBe("Sign Up");

    // Verify <form> exists
    expect(authView.querySelector("form")).not.toBeNull();

    // Verify Email input exists
    expect(authView.querySelector("form input[type='email']")).not.toBeNull();

    // Verify Password input exists
    expect(
      authView.querySelector("form input[type='password']"),
    ).not.toBeNull();

    // Verify Submit button exists and has text "Sign Up"
    const submitButton = authView.querySelector("form button[type='submit']");
    expect(submitButton).not.toBeNull();
    expect(submitButton.textContent).toBe("Sign Up");
  });
  it("should show a loading state when status is loading", () => {
    const authView = document.createElement("main");

    renderAuthView(authView, {
      mode: "login",
      status: "loading",
    });

    expect(authView.querySelector("form")).not.toBeNull();
    const submitButton = authView.querySelector("form button[type='submit']");
    expect(submitButton.disabled).toBe(true);
    const loadingIndicator = authView.querySelector('[role="status"]');
    expect(loadingIndicator).not.toBeNull();
  });
  it("should render an authentication error message", () => {
    const authView = document.createElement("main");

    renderAuthView(authView, {
      mode: "login",
      status: "error",
      error: "Invalid email or password",
    });

    // Verify the form still exists
    expect(authView.querySelector("form")).not.toBeNull();

    // Verify the error message exists with the correct role and content
    const errorMessage = authView.querySelector('[role="alert"]');
    expect(errorMessage).not.toBeNull();
    expect(errorMessage.textContent).toBe("Invalid email or password");
  });
  it("should render a Sign up switch in login mode", () => {
    const authView = document.createElement("main");

    renderAuthView(authView, {
      mode: "login",
      status: "idle",
    });

    const modeButton = authView.querySelector(".auth-mode-button");

    expect(modeButton).not.toBeNull();
    expect(modeButton.textContent).toBe("Sign up");
    expect(modeButton.dataset.authMode).toBe("signup");
  });

  it("should render a Sign in switch in signup mode", () => {
    const authView = document.createElement("main");

    renderAuthView(authView, {
      mode: "signup",
      status: "idle",
    });

    const modeButton = authView.querySelector(".auth-mode-button");

    expect(modeButton).not.toBeNull();
    expect(modeButton.textContent).toBe("Sign in");
    expect(modeButton.dataset.authMode).toBe("login");
  });
});
