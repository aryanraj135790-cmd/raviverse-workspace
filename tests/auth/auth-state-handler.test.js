/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockRenderAppView, mockRenderAuthView, mockSetupAuthOperation } =
  vi.hoisted(() => ({
    mockRenderAppView: vi.fn(),
    mockRenderAuthView: vi.fn(),
    mockSetupAuthOperation: vi.fn(),
  }));

vi.mock("../../js/auth/auth-view-controller.js", () => ({
  renderAppView: mockRenderAppView,
}));

vi.mock("../../js/auth/auth-renderer.js", () => ({
  renderAuthView: mockRenderAuthView,
}));

vi.mock("../../js/auth/auth-operation-controller.js", () => ({
  setupAuthOperation: mockSetupAuthOperation,
}));

import { handleAuthState } from "../../js/auth/auth-state-handler.js";

describe("handleAuthState", () => {
  let authViewElement;

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = "";

    authViewElement = document.createElement("main");
    authViewElement.id = "auth-view";

    document.body.appendChild(authViewElement);
  });

  it("should render the app view and auth view when state is unauthenticated", () => {
    const unauthenticatedState = {
      status: "unauthenticated",
      session: null,
      user: null,
      mode: "login",
    };

    mockRenderAuthView.mockImplementation((authView) => {
      const form = document.createElement("form");
      authView.appendChild(form);
    });

    handleAuthState(unauthenticatedState);

    expect(mockRenderAppView).toHaveBeenCalledWith(unauthenticatedState);

    expect(mockRenderAuthView).toHaveBeenCalledWith(
      authViewElement,
      unauthenticatedState,
    );

    expect(mockSetupAuthOperation).toHaveBeenCalledWith(
      authViewElement.querySelector("form"),
      "login",
    );
  });

  it("should render only the app view when state is authenticated", () => {
    const authenticatedState = {
      status: "authenticated",
      session: {
        token: "abc-123",
      },
      user: {
        email: "user@example.com",
      },
    };

    handleAuthState(authenticatedState);

    expect(mockRenderAppView).toHaveBeenCalledWith(authenticatedState);

    expect(mockRenderAuthView).not.toHaveBeenCalled();
    expect(mockSetupAuthOperation).not.toHaveBeenCalled();
  });
});
