import { describe, expect, it, vi } from "vitest";
import { createStore } from "../../js/store/create-store.js";

describe("createStore", () => {
  it("should notify subscribers with the new state after setState", () => {
    const store = createStore({ count: 0 });
    const listener = vi.fn();
    store.subscribe(listener);

    const nextState = { count: 1 };
    store.setState(() => nextState);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(nextState);
  });

  it("should replace the state reference (immutability contract)", () => {
    const store = createStore({ count: 0 });
    const before = store.getState();

    const after = store.setState((state) => ({ ...state, count: state.count + 1 }));

    expect(after).not.toBe(before);
    expect(after).toEqual({ count: 1 });
    expect(store.getState()).toEqual({ count: 1 });
  });

  it("should NOT notify subscribers when the updater returns the same reference", () => {
    const store = createStore({ count: 0 });
    const listener = vi.fn();
    store.subscribe(listener);

    const sameState = store.getState();
    store.setState(() => sameState);

    expect(listener).not.toHaveBeenCalled();
  });

  it("should stop notifying after unsubscribe", () => {
    const store = createStore({ count: 0 });
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    unsubscribe();
    store.setState((state) => ({ ...state, count: 1 }));

    expect(listener).not.toHaveBeenCalled();
  });

  it("should throw a TypeError when the updater is not a function", () => {
    const store = createStore({ count: 0 });

    expect(() => store.setState("loading")).toThrow(TypeError);
  });
});
