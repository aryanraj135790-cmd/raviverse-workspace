/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
const {
  dashboardStatusElement,
  dashboardRefreshElement,
  dashboardStatElements,
  dashboardStatCards,
  recentActivityListElement,
  renderDashboardStats,
  renderDashboardLoadingState,
  renderRecentActivities,
  renderRecentActivitiesLoadingState,
  renderDashboardStatusMessage,
  renderRecentActivitiesRefreshState,
  showToast,
} = vi.hoisted(() => ({
  dashboardStatusElement: document.createElement("p"),
  dashboardRefreshElement: document.createElement("button"),
  dashboardStatElements: {
    projects: document.createElement("span"),
    tasks: document.createElement("span"),
  },
  dashboardStatCards: {
    projects: document.createElement("article"),
    tasks: document.createElement("article"),
  },
  recentActivityListElement: document.createElement("ul"),
  renderDashboardStats: vi.fn(),
  renderDashboardLoadingState: vi.fn(),
  renderRecentActivities: vi.fn(),
  renderRecentActivitiesLoadingState: vi.fn(),
  renderDashboardStatusMessage: vi.fn(),
  renderRecentActivitiesRefreshState: vi.fn(),
  showToast: vi.fn(),
}));
vi.mock("../../js/dashboard/dashboard-dom.js", () => ({
  getDashboardDom: () => ({
    status: dashboardStatusElement,
    refresh: dashboardRefreshElement,
    statElements: dashboardStatElements,
    statCards: dashboardStatCards,
    recentActivityList: recentActivityListElement,
  }),
}));
vi.mock("../../js/dashboard/dashboard-renderer.js", () => ({
  renderDashboardStats,
  renderDashboardLoadingState,
  renderRecentActivities,
  renderRecentActivitiesLoadingState,
  renderDashboardStatusMessage,
  renderRecentActivitiesRefreshState,
}));
vi.mock("../../js/ui/toast.js", () => ({
  showToast,
}));
// The controller transitively imports the Supabase data layer (whose
// client.js loads a browser-only CDN URL) — mock at the vendor boundary.
vi.mock("../../js/supabase/dashboard-queries.js", () => ({
  fetchDashboardRawData: vi.fn(),
}));
import {
  renderDashboardState,
  transitionDashboard,
} from "../../js/dashboard/dashboard-controller.js";

beforeEach(() => {
  vi.clearAllMocks();
});
describe("renderDashboardState", () => {
  it("should disable the refresh button while dashboard is loading", () => {
    dashboardRefreshElement.disabled = false;
    renderDashboardState({
      status: "loading",
      data: null,
      error: null,
    });
    expect(dashboardRefreshElement.disabled).toBe(true);
  });
  it("should enable the refresh button when dashboard is not loading", () => {
    dashboardRefreshElement.disabled = true;
    renderDashboardState({
      status: "success",
      data: {
        stats: {
          projects: 5,
          tasks: 12,
        },
        recentActivities: [],
      },
      error: null,
    });
    expect(dashboardRefreshElement.disabled).toBe(false);
  });
  it("should render dashboard loading state", () => {
    const state = {
      status: "loading",
      data: null,
      error: null,
    };
    renderDashboardState(state);
    expect(renderDashboardLoadingState).toHaveBeenCalledWith(
      state,
      dashboardStatCards,
    );
  });
  it("should render recent activity loading state on initial dashboard load", () => {
    const state = {
      status: "loading",
      data: null,
      error: null,
    };
    renderDashboardState(state);
    expect(renderRecentActivitiesLoadingState).toHaveBeenCalledWith(
      true,
      recentActivityListElement,
    );
  });
  it("should render recent activity refresh state when refreshing existing dashboard data", () => {
    const state = {
      status: "loading",
      data: {
        stats: {
          projects: 5,
          tasks: 12,
        },
        recentActivities: [],
      },
      error: null,
    };
    renderDashboardState(state);
    expect(renderRecentActivitiesRefreshState).toHaveBeenCalledWith(
      true,
      recentActivityListElement,
    );
  });
  it("should disable activity loading states when dashboard is not loading", () => {
    const state = {
      status: "success",
      data: {
        stats: {
          projects: 5,
          tasks: 12,
        },
        recentActivities: [],
      },
      error: null,
    };
    renderDashboardState(state);
    expect(renderRecentActivitiesLoadingState).toHaveBeenCalledWith(
      false,
      recentActivityListElement,
    );
    expect(renderRecentActivitiesRefreshState).toHaveBeenCalledWith(
      false,
      recentActivityListElement,
    );
  });
  it("should render the dashboard status message", () => {
    const state = {
      status: "success",
      data: {
        stats: {
          projects: 5,
          tasks: 12,
        },
        recentActivities: [],
      },
      error: null,
    };
    renderDashboardState(state);
    expect(renderDashboardStatusMessage).toHaveBeenCalledWith(
      dashboardStatusElement,
      "success",
    );
  });
  it("should render dashboard data when state is successful", () => {
    const state = {
      status: "success",
      data: {
        stats: {
          projects: 5,
          tasks: 12,
        },
        recentActivities: [
          {
            message: "Task completed",
            entityType: "task",
            entityId: 2,
            createdAt: "2026-08-20T10:00:00Z",
          },
        ],
      },
      error: null,
    };
    renderDashboardState(state);
    expect(renderDashboardStats).toHaveBeenCalledWith(
      state.data.stats,
      dashboardStatElements,
    );
    expect(renderRecentActivities).toHaveBeenCalledWith(
      state.data.recentActivities,
      recentActivityListElement,
    );
  });
  it("should not render dashboard data when state is not successful", () => {
    const state = {
      status: "loading",
      data: null,
      error: null,
    };
    renderDashboardState(state);
    expect(renderDashboardStats).not.toHaveBeenCalled();
    expect(renderRecentActivities).not.toHaveBeenCalled();
  });
  it("should show success toast when dashboard state is successful", () => {
    const state = {
      status: "success",
      data: {
        stats: {
          projects: 5,
          tasks: 12,
        },
        recentActivities: [],
      },
      error: null,
    };
    renderDashboardState(state, "Dashboard loaded.");
    expect(showToast).toHaveBeenCalledWith("Dashboard loaded.", "success");
  });
  it("should show error toast when dashboard state is an error", () => {
    const state = {
      status: "error",
      data: null,
      error: new Error("Failed to fetch dashboard data"),
    };
    renderDashboardState(state);
    expect(showToast).toHaveBeenCalledWith(
      "Failed to load dashboard. Please try again.",
      "error",
    );
  });
  it("should not show success toast when success message is not provided", () => {
    const state = {
      status: "success",
      data: {
        stats: {
          projects: 5,
          tasks: 12,
        },
        recentActivities: [],
      },
      error: null,
    };
    renderDashboardState(state);
    expect(showToast).not.toHaveBeenCalled();
  });
  it("should transition dashboard state and render the next state", () => {
    const dashboardData = {
      stats: {
        projects: 5,
        tasks: 12,
      },
      recentActivities: [],
    };
    const nextState = {
      status: "success",
      data: dashboardData,
      error: null,
    };
    const store = {
      setState: vi.fn().mockReturnValue(nextState),
    };
    transitionDashboard(
      store,
      "success",
      dashboardData,
      null,
      "Dashboard loaded.",
    );
    expect(store.setState).toHaveBeenCalledWith("success", dashboardData, null);
    expect(renderDashboardStatusMessage).toHaveBeenCalledWith(
      dashboardStatusElement,
      "success",
    );
    expect(renderDashboardStats).toHaveBeenCalledWith(
      dashboardData.stats,
      dashboardStatElements,
    );
    expect(renderRecentActivities).toHaveBeenCalledWith(
      dashboardData.recentActivities,
      recentActivityListElement,
    );
    expect(showToast).toHaveBeenCalledWith("Dashboard loaded.", "success");
  });
});
