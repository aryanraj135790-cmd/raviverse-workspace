import { showToast } from "../ui/toast.js";
import { getDashboardDom } from "./dashboard-dom.js";
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
import { createDashboardView } from "./dashboard-view.js";

function handleDashboardToast(state, successMessage) {
  if (state.status === "success" && successMessage) {
    showToast(successMessage, "success");
  }

  if (state.status === "error") {
    showToast("Failed to load dashboard. Please try again.", "error");
  }
}

function renderDashboardState(state, successMessage) {
  if (dashboardDom.refresh) {
    dashboardDom.refresh.disabled = state.status === "loading";
  }

  renderDashboardLoadingState(state, dashboardDom.statCards);

  renderRecentActivitiesLoadingState(
    state.status === "loading" && state.data === null,
    dashboardDom.recentActivityList,
  );

  renderRecentActivitiesRefreshState(
    state.status === "loading" && state.data !== null,
    dashboardDom.recentActivityList,
  );

  renderDashboardStatusMessage(dashboardDom.status, state.status);

  if (state.status === "success") {
    renderDashboardStats(state.data.stats, dashboardDom.statElements);

    renderRecentActivities(
      state.data.recentActivities,
      dashboardDom.recentActivityList,
    );
  }

  handleDashboardToast(state, successMessage);
}

function transitionDashboard(store, status, data, error, successMessage) {
  const nextState = store.setState(status, data, error);
  renderDashboardState(nextState, successMessage);
}

async function loadDashboard(store, successMessage) {
  try {
    const currentState = store.getState();

    transitionDashboard(store, "loading", currentState.data, null);

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
  if (!dashboardDom.refresh) return;
  dashboardDom.refresh.addEventListener("click", refreshDashboard);
}

function initDashboard() {
  const appView = document.querySelector("#app-view");
  if (!appView) {
    console.error("Critical: #app-view container was not found in the DOM.");
    return;
  }

  const dashboardView = createDashboardView();
  appView.replaceChildren(dashboardView);
  dashboardDom = getDashboardDom();

  return loadDashboard(dashboardStore, "Dashboard loaded.");
}

let dashboardDom = getDashboardDom();
const initialDashboardState = {
  status: "idle",
  data: null,
  error: null,
};
const dashboardStore = createDashboardStore(initialDashboardState);

export {
  handleDashboardToast,
  renderDashboardState,
  transitionDashboard,
  loadDashboard,
  refreshDashboard,
  setupDashboardEvents,
  initDashboard,
};
