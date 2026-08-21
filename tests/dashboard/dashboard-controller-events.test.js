/**
 * @vitest-environment jsdom
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

const { dashboardRefreshElement, getDashboardData, showToast } = vi.hoisted(
  () => ({
    dashboardRefreshElement: document.createElement("button"),
    getDashboardData: vi.fn(),
    showToast: vi.fn(),
  }),
);

vi.mock("../../js/dashboard/dashboard-dom.js", () => ({
  getDashboardStatusElement: () => document.createElement("p"),
  getDashboardRefreshElement: () => dashboardRefreshElement,
  getDashboardStatElements: () => ({}),
  getDashboardStatCards: () => ({}),
  getRecentActivityListElement: () => document.createElement("ul"),
}));

vi.mock("../../js/dashboard/dashboard-data.js", () => ({
  getDashboardData,
}));

vi.mock("../../js/ui/toast.js", () => ({
  showToast,
}));

import {
  setupDashboardEvents,
  refreshDashboard,
  initDashboard,
} from "../../js/dashboard/dashboard-controller.js";

beforeEach(() => {
  vi.clearAllMocks();
});
describe("setupDashboardEvents", () => {
  it("should register a click event listener on the dashboard refresh button", () => {
    const addEventListenerSpy = vi.spyOn(
      dashboardRefreshElement,
      "addEventListener",
    );
    setupDashboardEvents();
    expect(addEventListenerSpy).toHaveBeenCalledWith(
      "click",
      expect.any(Function),
    );
    addEventListenerSpy.mockRestore();
  });
  it("should refresh the dashboard when the refresh button is clicked", async () => {
    const mockDashboardData = {
      stats: {
        projects: 5,
        tasks: 12,
      },
      recentActivities: [],
    };
    getDashboardData.mockResolvedValue(mockDashboardData);
    const addEventListenerSpy = vi.spyOn(
      dashboardRefreshElement,
      "addEventListener",
    );
    setupDashboardEvents();
    const clickHandler = addEventListenerSpy.mock.calls.find(
      ([eventName]) => eventName === "click",
    )[1];
    await clickHandler();
    expect(getDashboardData).toHaveBeenCalledTimes(1);
    addEventListenerSpy.mockRestore();
  });
});
describe("refreshDashboard", () => {
  it("should refresh dashboard data with the refresh success message", async () => {
    const mockDashboardData = {
      stats: {
        projects: 5,
        tasks: 12,
      },
      recentActivities: [],
    };
    getDashboardData.mockResolvedValue(mockDashboardData);
    const result = await refreshDashboard();
    expect(getDashboardData).toHaveBeenCalledTimes(1);
    expect(result.status).toBe("success");
    expect(result.data).toEqual(mockDashboardData);
    expect(showToast).toHaveBeenCalledWith("Dashboard refreshed.", "success");
  });
});
describe("initDashboard", () => {
  it("should initialize dashboard data with the load success message", async () => {
    const mockDashboardData = {
      stats: {
        projects: 5,
        tasks: 12,
      },
      recentActivities: [],
    };
    getDashboardData.mockResolvedValue(mockDashboardData);
    const result = await initDashboard();
    expect(getDashboardData).toHaveBeenCalledTimes(1);
    expect(result.status).toBe("success");
    expect(result.data).toEqual(mockDashboardData);
    expect(showToast).toHaveBeenCalledWith("Dashboard loaded.", "success");
  });
});
