/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { setupAuthForm } from "../../js/auth/auth-form-handler.js";

describe("setupAuthForm", () => {
  it("should safely do nothing if no auth view is provided", () => {
    const onSubmit = vi.fn();

    expect(() => setupAuthForm(null, onSubmit)).not.toThrow();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("should delegate form submission, extract credentials, and pass them to onSubmit", () => {
    const authView = document.createElement("main");
    const form = document.createElement("form");

    const emailInput = document.createElement("input");
    emailInput.name = "email";
    emailInput.value = "test@example.com";

    const passwordInput = document.createElement("input");
    passwordInput.name = "password";
    passwordInput.value = "password123";

    form.append(emailInput, passwordInput);
    authView.appendChild(form);
    document.body.appendChild(authView);

    const onSubmit = vi.fn();

    setupAuthForm(authView, onSubmit);

    const submitEvent = new Event("submit", {
      cancelable: true,
      bubbles: true,
    });

    const preventDefaultSpy = vi.spyOn(submitEvent, "preventDefault");

    form.dispatchEvent(submitEvent);

    expect(preventDefaultSpy).toHaveBeenCalledTimes(1);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password123",
    });

    authView.remove();
  });

  it("should ignore non-form events", () => {
    const authView = document.createElement("main");
    document.body.appendChild(authView);

    const onSubmit = vi.fn();

    setupAuthForm(authView, onSubmit);

    const submitEvent = new Event("submit", {
      cancelable: true,
      bubbles: true,
    });

    authView.dispatchEvent(submitEvent);

    expect(onSubmit).not.toHaveBeenCalled();

    authView.remove();
  });
  it("should call onModeChange with signup when the Sign up button is clicked", () => {
    const authView = document.createElement("main");

    const switchButton = document.createElement("button");
    switchButton.type = "button";
    switchButton.className = "auth-mode-switch";
    switchButton.textContent = "Sign up";

    authView.appendChild(switchButton);
    document.body.appendChild(authView);

    const onSubmit = vi.fn();
    const onModeChange = vi.fn();

    setupAuthForm(authView, onSubmit, onModeChange);

    switchButton.click();

    expect(onModeChange).toHaveBeenCalledTimes(1);
    expect(onModeChange).toHaveBeenCalledWith("signup");
    expect(onSubmit).not.toHaveBeenCalled();

    authView.remove();
  });
  it("should call onModeChange with login when the Sign in button is clicked", () => {
    const authView = document.createElement("main");

    const switchButton = document.createElement("button");
    switchButton.type = "button";
    switchButton.className = "auth-mode-switch";
    switchButton.textContent = "Sign in";

    authView.appendChild(switchButton);
    document.body.appendChild(authView);

    const onSubmit = vi.fn();
    const onModeChange = vi.fn();

    setupAuthForm(authView, onSubmit, onModeChange);

    switchButton.click();

    expect(onModeChange).toHaveBeenCalledTimes(1);
    expect(onModeChange).toHaveBeenCalledWith("login");
    expect(onSubmit).not.toHaveBeenCalled();

    authView.remove();
  });
});
