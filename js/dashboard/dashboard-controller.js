import { showToast } from "../ui/toast.js";
import {
  getDashboardStatusElement,
  getDashboardRefreshElement,
  getDashboardStatElements,
  getDashboardStatCards,
} from "./dashboard-dom.js";
import {
  renderDashboardStats,
  renderDashboardLoadingState,
  renderRecentActivities,
  renderRecentActivitiesLoadingState,
  renderDashboardStatusMessage,
  renderRecentActivitiesRefreshState,
} from "./dashboard-renderer.js";
import { getDashboardData } from "./dashboard-data.js";
import { createDashboardStore } from "./dashboard-store.js";
function handleDashboardToast(state, successMessage) {
  if (state.status === "success" && successMessage) {
    showToast(successMessage, "success");
  }

  if (state.status === "error") {
    showToast("Failed to load dashboard. Please try again.", "error");
  }
}
function renderDashboardState(state, successMessage) {
  const statusElement = getDashboardStatusElement();
  const refreshButton = getDashboardRefreshElement();

  if (refreshButton) {
    refreshButton.disabled = state.status === "loading";
  }
  renderDashboardLoadingState(state, dashboardStatCards);
  renderRecentActivitiesLoadingState(
    state.status === "loading" && state.data === null,
  );
  renderRecentActivitiesRefreshState(
    state.status === "loading" && state.data !== null,
  );
  renderDashboardStatusMessage(statusElement, state.status);
  if (state.status === "success") {
    renderDashboardStats(state.data.stats, dashboardStatElements);
    renderRecentActivities(state.data.recentActivities);
  }
  handleDashboardToast(state, successMessage);
}
function transitionDashboard(store, status, data, error, successMessage) {
  const nextState = store.setState(status, data, error);
  renderDashboardState(nextState, successMessage);
}
async function loadDashboard(store, successMessage) {
  try {
    transitionDashboard(store, "loading");
    const dashboardData = await getDashboardData();
    transitionDashboard(store, "success", dashboardData, null, successMessage);
    return store.getState();
  } catch (error) {
    if (error.cause) {
      console.error("Original System Error Details:", error.cause);
    }
    console.error("Dashboard Init Failed ->", error.message);
    transitionDashboard(store, "error", null, error);
    return store.getState();
  }
}
function refreshDashboard() {
  return loadDashboard(dashboardStore, "Dashboard refreshed.");
}
function setupDashboardEvents() {
  const refreshButton = getDashboardRefreshElement();
  if (!refreshButton) return;
  refreshButton.addEventListener("click", refreshDashboard);
}
function initDashboard() {
  return loadDashboard(dashboardStore, "Dashboard loaded.");
}
const initialDashboardState = {
  status: "idle",
  data: null,
  error: null,
};
const dashboardStore = createDashboardStore(initialDashboardState);
const dashboardStatElements = getDashboardStatElements();
const dashboardStatCards = getDashboardStatCards();
export {
  handleDashboardToast,
  renderDashboardState,
  transitionDashboard,
  loadDashboard,
  refreshDashboard,
  setupDashboardEvents,
  initDashboard,
};
