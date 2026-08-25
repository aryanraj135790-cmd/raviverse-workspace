/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from "vitest";
import { renderAppView } from "../../js/auth/auth-view-controller.js";

describe("renderAppView", () => {
  let authView;
  let workspaceView;
  let profileButton;
  beforeEach(() => {
    document.body.innerHTML = "";

    authView = document.createElement("main");
    authView.id = "auth-view";

    workspaceView = document.createElement("div");
    workspaceView.id = "workspace-view";
    profileButton = document.createElement("button");
    profileButton.id = "profile-button";

    document.body.append(authView, workspaceView, profileButton);
  });

  it("should show workspace view and hide auth view when authenticated", () => {
    renderAppView({
      status: "authenticated",
    });

    expect(authView.hidden).toBe(true);
    expect(workspaceView.hidden).toBe(false);
    expect(profileButton.hidden).toBe(false);
  });

  it("should show auth view and hide workspace view when unauthenticated", () => {
    renderAppView({
      status: "unauthenticated",
    });

    expect(authView.hidden).toBe(false);
    expect(workspaceView.hidden).toBe(true);
    expect(profileButton.hidden).toBe(true);
  });
  it("should safely render when the profile button does not exist", () => {
    profileButton.remove();

    expect(() =>
      renderAppView({
        status: "authenticated",
      }),
    ).not.toThrow();

    expect(authView.hidden).toBe(true);
    expect(workspaceView.hidden).toBe(false);
  });
});
