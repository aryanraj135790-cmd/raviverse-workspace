/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi } from "vitest";
import { createDashboardStore } from "../../js/dashboard/dashboard-store.js";
import { getDashboardData } from "../../js/dashboard/dashboard-data.js";
import {
  loadDashboard,
  handleDashboardToast,
} from "../../js/dashboard/dashboard-controller.js";
vi.mock("../../js/dashboard/dashboard-data.js", () => ({
  getDashboardData: vi.fn(),
}));
vi.mock("../../js/ui/toast.js", () => ({
  showToast: vi.fn(),
}));
describe("loadDashboard", () => {
  it("should load dashboard data successfully", async () => {
    const initialState = {
      status: "idle",
      data: null,
      error: null,
    };
    const store = createDashboardStore(initialState);
    const mockDashboardData = {
      stats: {
        projects: 5,
        tasks: 12,
      },
      recentActivities: [],
    };
    getDashboardData.mockResolvedValue(mockDashboardData);
    const result = await loadDashboard(store, "Dashboard loaded.");
    expect(getDashboardData).toHaveBeenCalledTimes(1);
    expect(result.status).toBe("success");
    expect(result.data).toEqual(mockDashboardData);
    expect(result.error).toBeNull();
  });
  it("should handle dashboard data loading error", async () => {
    const initialState = {
      status: "idle",
      data: null,
      error: null,
    };
    const store = createDashboardStore(initialState);
    const mockError = new Error("Failed to fetch dashboard data");
    getDashboardData.mockRejectedValue(mockError);
    const result = await loadDashboard(store, "error");
    expect(result.status).toBe("error");
    expect(result.data).toBeNull();
    expect(result.error).toBe(mockError);
  });
  it("should set dashboard state to loading while data is being fetched", async () => {
    const initialState = {
      status: "idle",
      data: null,
      error: null,
    };
    const store = createDashboardStore(initialState);
    let resolveRequest;
    const pendingRequest = new Promise((resolve) => {
      resolveRequest = resolve;
    });
    getDashboardData.mockReturnValue(pendingRequest);
    const dashboardPromise = loadDashboard(store, "Dashboard loaded.");
    expect(store.getState().status).toBe("loading");
    resolveRequest({
      stats: {
        projects: 5,
        tasks: 12,
      },
      recentActivities: [],
    });
    await dashboardPromise;
  });
  it("should log the original system error when error has a cause", async () => {
    const initialState = {
      status: "idle",
      data: null,
      error: null,
    };
    const store = createDashboardStore(initialState);
    const originalError = new Error("Database connection failed");
    const dashboardError = new Error("Failed to load dashboard", {
      cause: originalError,
    });
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    getDashboardData.mockRejectedValue(dashboardError);
    const result = await loadDashboard(store, "Dashboard loaded.");
    expect(result.status).toBe("error");
    expect(result.error).toBe(dashboardError);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Original System Error Details:",
      originalError,
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Dashboard Init Failed ->",
      dashboardError.message,
    );

    consoleErrorSpy.mockRestore();
  });
  it("should keep fresh data when an earlier request resolves out of order", async () => {
    const store = createDashboardStore({
      status: "idle",
      data: null,
      error: null,
    });

    const staleData = {
      stats: { projects: 1, tasks: 1 },
      recentActivities: ["stale activity"],
    };

    const freshData = {
      stats: { projects: 99, tasks: 99 },
      recentActivities: ["fresh activity"],
    };

    let lateResolve;
    const latePromise = new Promise((resolve) => {
      lateResolve = resolve;
    });

    getDashboardData
      .mockReturnValueOnce(latePromise)
      .mockResolvedValueOnce(freshData);

    const firstLoadPromise = loadDashboard(store, "First request");

    await Promise.resolve();

    await loadDashboard(store, "Second request");

    expect(store.getState().data).toEqual(freshData);
    expect(store.getState().status).toBe("success");

    lateResolve(staleData);
    await firstLoadPromise;

    await Promise.resolve();

    expect(store.getState().data).toEqual(freshData);
    expect(store.getState().status).toBe("success");
  });
});
