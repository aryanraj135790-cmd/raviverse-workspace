import { describe, expect, it, vi } from "vitest";

vi.mock("../../js/supabase/auth.js", () => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
}));

import { initializeAuth } from "../../js/auth/auth-controller.js";
import { getSession, onAuthStateChange } from "../../js/supabase/auth.js";

describe("initializeAuth", () => {
  it("should report an authenticated state when a session exists", async () => {
    const session = {
      user: {
        id: "user-1",
      },
    };

    getSession.mockResolvedValue({
      data: {
        session,
      },
      error: null,
    });

    onAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        },
      },
    });

    const onStateChange = vi.fn();

    await initializeAuth(onStateChange);

    expect(onStateChange).toHaveBeenCalledWith({
      status: "authenticated",
      session,
      user: session.user,
    });
  });
  it("should report an unauthenticated state when a session not exists", async () => {
    const session = null;

    getSession.mockResolvedValue({
      data: {
        session,
      },
      error: null,
    });

    onAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        },
      },
    });

    const onStateChange = vi.fn();

    await initializeAuth(onStateChange);

    expect(onStateChange).toHaveBeenCalledWith({
      status: "unauthenticated",
      session,
      user: null,
      mode: "login",
    });
  });
  it("should update auth state when the auth state changes", async () => {
    const session = {
      user: {
        id: "user-2",
      },
    };

    getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    let authCallback;

    onAuthStateChange.mockImplementation((callback) => {
      authCallback = callback;

      return {
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          },
        },
      };
    });

    const onStateChange = vi.fn();

    await initializeAuth(onStateChange);

    authCallback("SIGNED_IN", session);

    expect(onStateChange).toHaveBeenCalledTimes(2);

    expect(onStateChange).toHaveBeenLastCalledWith({
      status: "authenticated",
      session,
      user: session.user,
    });
  });
  it("should update auth state to unauthenticated when the user signs out", async () => {
    const session = {
      user: {
        id: "user-2",
      },
    };

    getSession.mockResolvedValue({
      data: { session },
      error: null,
    });

    let authCallback;

    onAuthStateChange.mockImplementation((callback) => {
      authCallback = callback;

      return {
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          },
        },
      };
    });

    const onStateChange = vi.fn();

    await initializeAuth(onStateChange);

    authCallback("SIGNED_OUT", null);

    expect(onStateChange).toHaveBeenCalledTimes(2);

    expect(onStateChange).toHaveBeenLastCalledWith({
      status: "unauthenticated",
      session: null,
      user: null,
      mode: "login",
    });
  });
  it("should report an unauthenticated state when initial session retrieval fails", async () => {
    const error = new Error("Session retrieval failed");
    getSession.mockResolvedValue({
      data: null,
      error,
    });

    onAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        },
      },
    });

    const onStateChange = vi.fn();

    await initializeAuth(onStateChange);

    expect(onStateChange).toHaveBeenCalledTimes(1);

    expect(onStateChange).toHaveBeenLastCalledWith({
      status: "unauthenticated",
      session: null,
      user: null,
      mode: "login",
    });
  });
  it("should unsubscribe from auth state changes when cleanup is called", async () => {
    const unsubscribe = vi.fn();
    const session = {
      user: { id: "user-1" },
    };

    getSession.mockResolvedValue({
      data: { session },
      error: null,
    });

    onAuthStateChange.mockReturnValue({
      data: {
        subscription: { unsubscribe },
      },
    });

    const onStateChange = vi.fn();

    const cleanup = await initializeAuth(onStateChange);

    expect(onStateChange).toHaveBeenCalledTimes(1);
    cleanup();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
  it("should report login mode when no initial session exists", async () => {
    getSession.mockResolvedValue({
      data: {
        session: null,
      },
      error: null,
    });

    onAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        },
      },
    });

    const onStateChange = vi.fn();

    await initializeAuth(onStateChange);

    expect(onStateChange).toHaveBeenLastCalledWith({
      status: "unauthenticated",
      mode: "login",
      session: null,
      user: null,
    });
  });
});
