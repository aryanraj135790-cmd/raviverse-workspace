/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { createAuthStore } from "../../js/auth/auth-store.js"; // Adjust path to your file structure

describe("createAuthStore and state validation mechanics", () => {
  it("should initialize with idle status, login mode, and null error", () => {
    const store = createAuthStore({
      status: "idle",
      mode: "login",
      error: null,
    });
    const state = store.getState();

    expect(state.status).toBe("idle");
    expect(state.mode).toBe("login");
    expect(state.error).toBeNull();
  });

  it("should transition to loading status with login mode and clear/null error", () => {
    const store = createAuthStore({
      status: "idle",
      mode: "login",
      error: null,
    });
    const newState = store.setState("loading", "login");

    expect(newState.status).toBe("loading");
    expect(newState.mode).toBe("login");
    expect(newState.error).toBeNull();
  });

  it("should transition to error status and preserve the error string payload", () => {
    const store = createAuthStore({
      status: "loading",
      mode: "login",
      error: null,
    });
    const newState = store.setState("error", "login", "Invalid credentials");

    expect(newState.status).toBe("error");
    expect(newState.mode).toBe("login");
    expect(newState.error).toBe("Invalid credentials");
  });

  it("should wipe out and clear previous error string when transitioning back to loading", () => {
    const store = createAuthStore({
      status: "error",
      mode: "login",
      error: "Invalid credentials",
    });
    const newState = store.setState("loading", "login");

    expect(newState.status).toBe("loading");
    expect(newState.error).toBeNull();
  });

  it("should clear any error structure completely when setting status to success", () => {
    const store = createAuthStore({
      status: "loading",
      mode: "login",
      error: null,
    });
    const newState = store.setState("success", "login");

    expect(newState.status).toBe("success");
    expect(newState.error).toBeNull();
  });

  it("should configure and sustain signup mode elements properly", () => {
    const store = createAuthStore({
      status: "idle",
      mode: "signup",
      error: null,
    });
    const state = store.getState();

    expect(state.status).toBe("idle");
    expect(state.mode).toBe("signup");
    expect(state.error).toBeNull();
  });

  it("should crash and throw an explicit error message if given an invalid status keyword", () => {
    const store = createAuthStore({
      status: "idle",
      mode: "login",
      error: null,
    });

    expect(() => {
      store.setState("not-a-valid-status", "login");
    }).toThrowError(/Invalid status/);
  });

  it("should crash and throw an explicit error message if given an invalid authentication mode", () => {
    const store = createAuthStore({
      status: "idle",
      mode: "login",
      error: null,
    });

    expect(() => {
      store.setState("idle", "not-a-valid-mode");
    }).toThrowError(/Invalid mode/);
  });

  it("should retrieve the live runtime data model using getState", () => {
    const store = createAuthStore({
      status: "idle",
      mode: "login",
      error: null,
    });

    store.setState("loading", "signup");
    const liveState = store.getState();

    expect(liveState.status).toBe("loading");
    expect(liveState.mode).toBe("signup");
  });

  it("should return the freshly built and processed state tree configuration from a setState invocation", () => {
    const store = createAuthStore({
      status: "idle",
      mode: "login",
      error: null,
    });
    const returnedState = store.setState("loading", "login");
    const activeState = store.getState();

    expect(returnedState).toEqual(activeState);
  });
  it("should notify subscribers when the state changes", () => {
    const store = createAuthStore({
      status: "idle",
      mode: "login",
      error: null,
    });

    const listener = vi.fn();

    store.subscribe(listener);

    const nextState = store.setState("loading", "login");

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(nextState);
  });

  it("should stop notifying a subscriber after unsubscribe", () => {
    const store = createAuthStore({
      status: "idle",
      mode: "login",
      error: null,
    });

    const listener = vi.fn();

    const unsubscribe = store.subscribe(listener);

    unsubscribe();

    store.setState("loading", "login");

    expect(listener).not.toHaveBeenCalled();
  });
});
