/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockSignIn, mockSignOut, mockSignUp } = vi.hoisted(() => ({
  mockSignIn: vi.fn(),
  mockSignOut: vi.fn(),
  mockSignUp: vi.fn(),
}));

vi.mock("../../js/supabase/auth.js", () => ({
  signIn: mockSignIn,
  signOut: mockSignOut,
  signUp: mockSignUp,
}));

import {
  loginUser,
  logoutUser,
  signupUser,
} from "../../js/auth/auth-action.js";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("loginUser", () => {
  it("should successfully login with valid credentials", async () => {
    const loginData = {
      user: {
        id: "user-1",
      },
      session: {
        access_token: "token",
      },
    };

    mockSignIn.mockResolvedValue({
      data: loginData,
      error: null,
    });

    await expect(loginUser("test@example.com", "password123")).resolves.toEqual(
      loginData,
    );

    expect(mockSignIn).toHaveBeenCalledTimes(1);
    expect(mockSignIn).toHaveBeenCalledWith("test@example.com", "password123");
  });
});

describe("logoutUser", () => {
  it("should successfully logout when signOut succeeds", async () => {
    mockSignOut.mockResolvedValue({
      error: null,
    });

    await expect(logoutUser()).resolves.toBeUndefined();

    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it("should throw the logout error when signOut fails", async () => {
    const logoutError = new Error("Logout failed");

    mockSignOut.mockResolvedValue({
      error: logoutError,
    });

    await expect(logoutUser()).rejects.toBe(logoutError);

    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });
  it("should throw the login error when signIn fails", async () => {
    const loginError = new Error("Invalid login credentials");

    mockSignIn.mockResolvedValue({
      data: null,
      error: loginError,
    });

    await expect(loginUser("test@example.com", "wrong-password")).rejects.toBe(
      loginError,
    );

    expect(mockSignIn).toHaveBeenCalledTimes(1);
    expect(mockSignIn).toHaveBeenCalledWith(
      "test@example.com",
      "wrong-password",
    );
  });
  describe("signupUser", () => {
    it("should successfully signup with valid credentials", async () => {
      const signupData = {
        user: {
          id: "user-1",
        },
        session: null,
      };

      mockSignUp.mockResolvedValue({
        data: signupData,
        error: null,
      });

      await expect(
        signupUser("test@example.com", "password123"),
      ).resolves.toEqual(signupData);

      expect(mockSignUp).toHaveBeenCalledTimes(1);
      expect(mockSignUp).toHaveBeenCalledWith(
        "test@example.com",
        "password123",
      );
    });
  });
  it("should throw the signup error when signUp fails", async () => {
    const signupError = new Error("Signup failed");

    mockSignUp.mockResolvedValue({
      data: null,
      error: signupError,
    });

    await expect(signupUser("test@example.com", "password123")).rejects.toBe(
      signupError,
    );

    expect(mockSignUp).toHaveBeenCalledTimes(1);
    expect(mockSignUp).toHaveBeenCalledWith("test@example.com", "password123");
  });
});
