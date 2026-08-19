import { getDashboardData } from "./dashboard/dashboard-data.js";
import { createDashboardStore } from "./dashboard/dashboard-store.js";
// Format numbers
function formatStatNumber(num) {
  if (typeof num !== "number" || !Number.isFinite(num)) {
    return num;
  }
  const absNum = Math.abs(num);
  if (absNum < 1000) {
    return num.toString();
  }
  const units = ["", "K", "M", "B", "T"];
  const i = Math.min(Math.floor(Math.log10(absNum) / 3), units.length - 1);
  const scaled = num / Math.pow(1000, i);
  const formatted = scaled.toFixed(1);
  return (
    (formatted.endsWith(".0") ? formatted.slice(0, -2) : formatted) + units[i]
  );
}

// Update Dashboard Stats
function renderDashboardStats(data, elementsMap) {
  if (!elementsMap || typeof elementsMap !== "object") {
    throw new Error("Invalid elements map provided to renderDashboardStats.");
  }
  if (!data || typeof data !== "object") {
    throw new Error(`Invalid data object provided: ${JSON.stringify(data)}`);
  }

  Object.entries(data).forEach(([key, value]) => {
    const statElement = elementsMap[key];

    if (statElement) {
      const nextValue = String(formatStatNumber(value));
      // Prevent unnecessary DOM updates
      if (statElement.textContent !== nextValue) {
        statElement.textContent = nextValue;
      }
    } else {
      console.warn(
        `Dashboard element for stat key "${key}" was not found in the elements map.`,
      );
    }
  });
}

// Get Dashboard Stats
function getDashboardStatElements() {
  const dashboardStatElements = document.querySelectorAll(
    "[data-dashboard-stat]",
  );
  return Array.from(dashboardStatElements).reduce(
    (accumulator, currentElement) => {
      const statKey = currentElement.getAttribute("data-dashboard-stat");
      accumulator[statKey] = currentElement;
      return accumulator;
    },
    {},
  );
}

// Get dashboard status element
function getDashboardStatusElement() {
  return document.querySelector("#dashboard-status");
}

// Get dashboard refresh element
function getDashboardRefreshElement() {
  return document.querySelector("#dashboard-refresh");
}

// Recent Activity List Element
function getRecentActivityListElement() {
  return document.querySelector("#recent-activity-list");
}

// Get toast container
let currentToast = null;
let currentToastTimer = null;
function getToastContainer() {
  return document.querySelector("#toast-container");
}

function renderRecentActivities(activities) {
  const listElement = getRecentActivityListElement();
  if (!listElement) return;
  listElement.replaceChildren();
  if (activities.length === 0) {
    const li = document.createElement("li");
    const p = document.createElement("p");
    p.textContent = "No recent activity yet.";
    li.appendChild(p);
    listElement.appendChild(li);
    return;
  }
  activities.forEach((item) => {
    const li = document.createElement("li");
    li.classList.add("recent-activity-li");
    const p = document.createElement("p");
    p.textContent = item.message;
    const span = document.createElement("span");
    const entityLabel =
      item.entityType.charAt(0).toUpperCase() + item.entityType.slice(1);
    span.textContent = `${entityLabel} #${item.entityId}`;
    const time = document.createElement("time");
    time.textContent = formatActivityDate(item.createdAt);
    li.append(p, span, time);
    listElement.appendChild(li);
  });
}

function formatActivityDate(createdAt) {
  if (!createdAt) return "";
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "";
  const diffInSeconds = Math.floor((new Date() - date) / 1000);
  const rtf = new Intl.RelativeTimeFormat("en", {
    numeric: "auto",
  });
  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) {
    return rtf.format(-Math.floor(diffInSeconds / 60), "minute");
  }
  if (diffInSeconds < 86400) {
    return rtf.format(-Math.floor(diffInSeconds / 3600), "hour");
  }
  return rtf.format(-Math.floor(diffInSeconds / 86400), "day");
}

function renderRecentActivitiesLoadingState(isLoading) {
  const listElement = getRecentActivityListElement();
  if (!listElement) return;
  if (isLoading) {
    listElement.replaceChildren();
    for (let i = 0; i < 5; i++) {
      const li = document.createElement("li");
      li.classList.add("recent-activity-li", "is-loading");
      const message = document.createElement("span");
      message.classList.add("activity-message-loading");
      const entity = document.createElement("span");
      entity.classList.add("activity-entity-loading");
      const time = document.createElement("time");
      time.classList.add("activity-time-loading");
      li.append(message, entity, time);
      listElement.append(li);
    }
  }
}

function renderRecentActivitiesRefreshState(isRefreshing) {
  const listElement = getRecentActivityListElement();

  if (!listElement) return;

  if (isRefreshing) {
    listElement.classList.add("is-refreshing");
  } else {
    listElement.classList.remove("is-refreshing");
  }
}

//Orchestrator for UI rendering
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
  if (!statusElement) return;
  switch (state.status) {
    case "idle":
      statusElement.textContent = "Dashboard is ready.";
      break;
    case "loading":
      statusElement.textContent = "Loading dashboard...";
      break;
    case "success":
      statusElement.textContent = "Dashboard loaded.";
      renderDashboardStats(state.data.stats, dashboardStatElements);
      renderRecentActivities(state.data.recentActivities);
      if (successMessage) {
        showToast(successMessage, "success");
      }
      break;
    case "error":
      statusElement.textContent = "Failed to load dashboard. Please try again.";
      showToast("Failed to load dashboard. Please try again.", "error");
      break;
  }
}

// Small Orchestration Helper
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

//Dashboard Event Listeners
function setupDashboardEvents() {
  const refreshButton = getDashboardRefreshElement();
  if (!refreshButton) return;
  refreshButton.addEventListener("click", refreshDashboard);
}

// Get dashboard cards
function getDashboardStatCards() {
  const statElements = getDashboardStatElements();
  return Object.fromEntries(
    Object.entries(statElements).map(([key, element]) => [
      key,
      element.parentElement,
    ]),
  );
}

// Manage loading visuals
function renderDashboardLoadingState(state, statCards) {
  Object.values(statCards).forEach((card) => {
    switch (state.status) {
      case "loading":
        if (state.data !== null) {
          card.classList.add("is-refreshing");
          card.classList.remove("is-loading");
        } else {
          card.classList.add("is-loading");
          card.classList.remove("is-refreshing");
        }
        break;
      default:
        card.classList.remove("is-loading", "is-refreshing");
        break;
    }
  });
}

// Toast System
function showToast(message, type) {
  const toastContainer = getToastContainer();
  if (currentToastTimer) {
    clearTimeout(currentToastTimer);
    currentToastTimer = null;
  }
  if (currentToast) {
    currentToast.remove();
    currentToast = null;
  }
  const duration = type === "success" ? 3000 : 5000;
  currentToast = document.createElement("div");
  currentToast.textContent = message;
  currentToast.classList.add("toast", `toast-${type}`);
  toastContainer.append(currentToast);
  const targetToast = currentToast;
  currentToastTimer = setTimeout(() => {
    removeToastWithAnimation(targetToast);
  }, duration);
}
function removeToastWithAnimation(toast) {
  if (!toast || !toast.isConnected) {
    cleanupToastState(toast);
    return;
  }
  if (currentToastTimer) {
    clearTimeout(currentToastTimer);
    currentToastTimer = null;
  }
  toast.classList.add("toast-exit");
  const computedStyle = window.getComputedStyle(toast);
  const hasAnimation =
    computedStyle.animationName !== "none" &&
    parseFloat(computedStyle.animationDuration) > 0;
  let isCleanedUp = false;
  const performRemoval = () => {
    if (isCleanedUp) return;
    isCleanedUp = true;
    toast.remove();
    cleanupToastState(toast);
  };

  if (hasAnimation) {
    toast.addEventListener("animationend", performRemoval, { once: true });
    const durationMs =
      (parseFloat(computedStyle.animationDuration) || 0) * 1000;
    setTimeout(performRemoval, durationMs + 100);
  } else {
    performRemoval();
  }
}
function cleanupToastState(toast) {
  if (currentToast === toast) {
    currentToast = null;
    currentToastTimer = null;
  }
}

const initialDashboardState = {
  status: "idle",
  data: null,
  error: null,
};
const dashboardStore = createDashboardStore(initialDashboardState);
const dashboardStatElements = getDashboardStatElements();
const dashboardStatCards = getDashboardStatCards();
// Dashboard Orchestration Initialization
function initDashboard() {
  return loadDashboard(dashboardStore, "Dashboard loaded.");
}

setupDashboardEvents();
initDashboard();
