import { describe, expect, it, beforeEach } from "vitest";
import { createDashboardStore } from "../../js/dashboard/dashboard-store.js";

describe("createDashboardStore", () => {
  let store;
  beforeEach(() => {
    store = createDashboardStore({
      status: "idle",
      data: null,
      error: null,
    });
  });
  it("should transition from idle to loading", () => {
    const nextState = store.setState("loading");

    expect(nextState).toEqual({
      status: "loading",
      data: null,
      error: null,
    });
  });
  it("should preserve existing data when transitioning from success to loading", () => {
    const dashboardData = {
      stats: {
        tasks: 10,
      },
    };

    store.setState("success", dashboardData);

    const nextState = store.setState("loading");

    expect(nextState).toEqual({
      status: "loading",
      data: dashboardData,
      error: null,
    });
  });
  it("should preserve existing data when transitioning from loading to error", () => {
    const dashboardData = {
      stats: {
        tasks: 10,
      },
    };

    store.setState("success", dashboardData);

    const error = new Error("Network failure");
    const nextState = store.setState("error", null, error);

    expect(nextState).toEqual({
      status: "error",
      data: dashboardData,
      error,
    });
  });
  it("should replace existing data when transitioning to success", () => {
    const oldData = {
      stats: {
        tasks: 10,
      },
    };

    const newData = {
      stats: {
        tasks: 15,
      },
    };

    store.setState("success", oldData);

    const nextState = store.setState("success", newData);

    expect(nextState).toEqual({
      status: "success",
      data: newData,
      error: null,
    });
  });
  it("should throw an error for an invalid status", () => {
    expect(() => store.setState("unknown")).toThrow(
      'Invalid status: "unknown". Expected one of: idle, loading, success, error',
    );
  });
});
