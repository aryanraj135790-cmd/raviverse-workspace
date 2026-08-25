/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockLoginUser, mockSignupUser, mockSetupAuthForm, mockRenderAuthView } =
  vi.hoisted(() => ({
    mockLoginUser: vi.fn(),
    mockSignupUser: vi.fn(),
    mockSetupAuthForm: vi.fn(),
    mockRenderAuthView: vi.fn(),
  }));

vi.mock("../../js/auth/auth-action.js", () => ({
  loginUser: mockLoginUser,
  signupUser: mockSignupUser,
}));

vi.mock("../../js/auth/auth-form-handler.js", () => ({
  setupAuthForm: mockSetupAuthForm,
}));

vi.mock("../../js/auth/auth-renderer.js", () => ({
  renderAuthView: mockRenderAuthView,
}));

import { setupAuthOperation } from "../../js/auth/auth-operation-controller.js";

describe("setupAuthOperation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  function createAuthViewWithForm() {
    const authView = document.createElement("div");
    authView.id = "auth-view";

    const form = document.createElement("form");

    authView.appendChild(form);
    document.body.appendChild(authView);

    return { authView, form };
  }
  it("should connect the form to the login operation", () => {
    const form = document.createElement("form");

    setupAuthOperation(form, "login");

    expect(mockSetupAuthForm).toHaveBeenCalledTimes(1);
    expect(mockSetupAuthForm).toHaveBeenCalledWith(
      form,
      expect.any(Function),
      expect.any(Function),
    );
  });

  it("should connect the form to the signup operation", () => {
    const { form } = createAuthViewWithForm();

    setupAuthOperation(form, "login");

    expect(mockSetupAuthForm).toHaveBeenCalledTimes(1);

    expect(mockSetupAuthForm).toHaveBeenCalledTimes(1);
    expect(mockSetupAuthForm).toHaveBeenCalledWith(
      form,
      expect.any(Function),
      expect.any(Function),
    );
  });

  it("should call loginUser with submitted credentials", async () => {
    const { form } = createAuthViewWithForm();

    setupAuthOperation(form, "login");

    expect(mockSetupAuthForm).toHaveBeenCalledTimes(1);

    const submitHandler = mockSetupAuthForm.mock.calls[0][1];

    mockLoginUser.mockResolvedValue({
      data: {
        user: {
          id: "user-1",
        },
      },
      error: null,
    });

    await submitHandler({
      email: "test@example.com",
      password: "password123",
    });

    expect(mockLoginUser).toHaveBeenCalledWith(
      "test@example.com",
      "password123",
    );

    form.remove();
  });

  it("should call signupUser with submitted credentials", async () => {
    const form = document.createElement("form");
    document.body.appendChild(form);

    setupAuthOperation(form, "signup");

    const submitHandler = mockSetupAuthForm.mock.calls[0][1];

    mockSignupUser.mockResolvedValue({
      data: {
        user: {
          id: "user-1",
        },
      },
      error: null,
    });

    await submitHandler({
      email: "test@example.com",
      password: "password123",
    });

    expect(mockSignupUser).toHaveBeenCalledWith(
      "test@example.com",
      "password123",
    );

    form.remove();
  });
  it("should switch auth mode to signup", () => {
    const { form } = createAuthViewWithForm();

    setupAuthOperation(form, "login");

    expect(mockSetupAuthForm).toHaveBeenCalledTimes(1);
    const modeChangeHandler = mockSetupAuthForm.mock.calls[0][2];

    modeChangeHandler("signup");

    expect(mockRenderAuthView).toHaveBeenCalled();
  });
  it("should switch auth mode to login", () => {
    const form = document.createElement("form");

    setupAuthOperation(form, "signup");

    const modeChangeHandler = mockSetupAuthForm.mock.calls[0][2];

    modeChangeHandler("login");

    expect(mockRenderAuthView).toHaveBeenCalled();
  });
});
