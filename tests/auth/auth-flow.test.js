/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockLoginUser, mockSignupUser } = vi.hoisted(() => ({
  mockLoginUser: vi.fn(),
  mockSignupUser: vi.fn(),
}));

vi.mock("../../js/auth/auth-action.js", () => ({
  loginUser: mockLoginUser,
  signupUser: mockSignupUser,
}));

import { renderAuthView } from "../../js/auth/auth-renderer.js";
import { setupAuthOperation } from "../../js/auth/auth-operation-controller.js";

describe("Authentication Integration Flows", () => {
  let authView;

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = "";

    authView = document.createElement("main");
    authView.id = "auth-view";
    document.body.appendChild(authView);
  });

  it("should allow retry submission after authentication error", async () => {
    renderAuthView(authView, {
      mode: "login",
      status: "idle",
      error: null,
    });

    const initialForm = authView.querySelector("form");
    expect(initialForm).not.toBeNull();

    setupAuthOperation(initialForm, "login");

    mockLoginUser.mockRejectedValueOnce(new Error("Invalid email or password"));

    const emailInput = initialForm.querySelector("input[name='email']");
    const passwordInput = initialForm.querySelector("input[name='password']");

    emailInput.value = "test@example.com";
    passwordInput.value = "password123";

    initialForm.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );

    await vi.waitFor(() => {
      const alertMessage = authView.querySelector('[role="alert"]');

      expect(alertMessage).not.toBeNull();
      expect(alertMessage.textContent).toBe("Invalid email or password");
    });

    const errorForm = authView.querySelector("form");

    expect(errorForm).not.toBeNull();
    expect(errorForm).not.toBe(initialForm);

    mockLoginUser.mockResolvedValueOnce({
      user: { email: "test@example.com" },
    });

    const newEmailInput = errorForm.querySelector("input[name='email']");
    const newPasswordInput = errorForm.querySelector("input[name='password']");

    newEmailInput.value = "test@example.com";
    newPasswordInput.value = "password123";

    errorForm.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );

    await vi.waitFor(() => {
      expect(mockLoginUser).toHaveBeenCalledTimes(2);
    });
  });
});
