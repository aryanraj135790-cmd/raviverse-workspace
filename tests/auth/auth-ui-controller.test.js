/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockLogoutUser } = vi.hoisted(() => ({
  mockLogoutUser: vi.fn(),
}));

vi.mock("../../js/auth/auth-action.js", () => ({
  logoutUser: mockLogoutUser,
}));

import { setupAuthUI } from "../../js/auth/auth-ui-controller.js";

describe("setupAuthUI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = "";
  });

  it("should safely do nothing when the profile button does not exist", () => {
    expect(() => setupAuthUI()).not.toThrow();
    expect(mockLogoutUser).not.toHaveBeenCalled();
  });

  it("should call logoutUser when the profile button is clicked", async () => {
    const profileButton = document.createElement("button");
    profileButton.id = "profile-button";

    document.body.appendChild(profileButton);

    setupAuthUI();

    mockLogoutUser.mockResolvedValue(undefined);

    profileButton.click();

    await Promise.resolve();

    expect(mockLogoutUser).toHaveBeenCalledTimes(1);
  });
});
