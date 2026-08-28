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

// Module State for Shared Lifecycle (Setup/Teardown)
let dashboardDom = null;
let latestRequestId = 0;

const initialDashboardState = {
  status: "idle",
  data: null,
  error: null,
};

const dashboardStore = createDashboardStore(initialDashboardState);

// --- Toast & UI Render Handlers (Dependency Injected) ---

// Lazy resolver: prefer mounted refs, fall back to a fresh DOM query
function resolveDashboardDom(dom = null) {
  return dom ?? dashboardDom ?? getDashboardDom();
}

function handleDashboardToast(state, successMessage) {
  if (state.status === "success" && successMessage) {
    showToast(successMessage, "success");
  }

  if (state.status === "error") {
    showToast("Failed to load dashboard. Please try again.", "error");
  }
}

function renderDashboardState(
  state,
  successMessage,
  dom = resolveDashboardDom(),
) {
  // If no DOM refs are provided or mounted, skip visual renders gracefully
  if (!dom) return;

  if (dom.refresh) {
    dom.refresh.disabled = state.status === "loading";
  }

  renderDashboardLoadingState(state, dom.statCards);

  renderRecentActivitiesLoadingState(
    state.status === "loading" && state.data === null,
    dom.recentActivityList,
  );

  renderRecentActivitiesRefreshState(
    state.status === "loading" && state.data !== null,
    dom.recentActivityList,
  );

  renderDashboardStatusMessage(dom.status, state.status);

  if (state.status === "success") {
    renderDashboardStats(state.data.stats, dom.statElements);

    renderRecentActivities(state.data.recentActivities, dom.recentActivityList);
  }

  handleDashboardToast(state, successMessage);
}

function transitionDashboard(
  store,
  status,
  data,
  error,
  successMessage,
  dom = resolveDashboardDom(),
) {
  const nextState = store.setState(status, data, error);
  renderDashboardState(nextState, successMessage, dom);
}

// --- Data & Lifecycle Handlers ---

async function loadDashboard(store, successMessage, dom = resolveDashboardDom()) {
  const requestId = ++latestRequestId;
  try {
    const currentState = store.getState();

    transitionDashboard(
      store,
      "loading",
      currentState.data,
      null,
      undefined,
      dom,
    );

    const dashboardData = await getDashboardData();

    // Guard against stale closure / race condition
    if (requestId !== latestRequestId) return;

    transitionDashboard(
      store,
      "success",
      dashboardData,
      null,
      successMessage,
      dom,
    );

    return store.getState();
  } catch (error) {
    if (requestId !== latestRequestId) return;

    if (error.cause) {
      console.error("Original System Error Details:", error.cause);
    }

    console.error("Dashboard Init Failed ->", error.message);

    transitionDashboard(store, "error", null, error, undefined, dom);

    return store.getState();
  }
}

function refreshDashboard() {
  return loadDashboard(dashboardStore, "Dashboard refreshed.");
}

function setupDashboardEvents() {
  const dom = resolveDashboardDom();
  if (!dom?.refresh) return;

  // Idempotent binding: remove first so re-mounts never double-bind
  dom.refresh.removeEventListener("click", refreshDashboard);
  dom.refresh.addEventListener("click", refreshDashboard);
}

function destroyDashboard() {
  if (dashboardDom?.refresh) {
    dashboardDom.refresh.removeEventListener("click", refreshDashboard);
  }

  const appView = document.querySelector("#app-view");
  if (appView) {
    appView.replaceChildren();
  }

  dashboardDom = null;
}

function initDashboard() {
  const appView = document.querySelector("#app-view");
  if (!appView) {
    console.error("Critical: #app-view container was not found in the DOM.");
    return;
  }

  // Compose & Mount View
  const dashboardView = createDashboardView();
  appView.replaceChildren(dashboardView);

  // Resolve DOM References
  dashboardDom = getDashboardDom();

  // Bind Events
  setupDashboardEvents();

  // Load Data with resolved DOM refs
  return loadDashboard(dashboardStore, "Dashboard loaded.", dashboardDom);
}

export {
  handleDashboardToast,
  renderDashboardState,
  transitionDashboard,
  loadDashboard,
  refreshDashboard,
  setupDashboardEvents,
  initDashboard,
  destroyDashboard,
};
