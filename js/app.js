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

// Delay Tool
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function isValidId(id) {
  return Number.isInteger(id) && id > 0;
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

// Validate Our API response
function validateRaviVerseData(data) {
  if (!data) {
    throw new Error(
      "Validation failure: Data does not exist (null or undefined).",
    );
  }

  if (typeof data !== "object" || Array.isArray(data)) {
    throw new Error(
      "Validation failure: Data is not a valid configuration object.",
    );
  }

  if (!Array.isArray(data.projects)) {
    throw new Error(
      "Validation failure: 'projects' property missing or is not an array.",
    );
  }

  if (!Array.isArray(data.tasks)) {
    throw new Error(
      "Validation failure: 'tasks' property missing or is not an array.",
    );
  }

  if (!Array.isArray(data.notes)) {
    throw new Error(
      "Validation failure: 'notes' property missing or is not an array.",
    );
  }
  if (!Array.isArray(data.activities)) {
    throw new Error(
      "Validation failure: 'activity' property missing or is not an array.",
    );
  }

  data.projects.forEach((project, index) => {
    validateProject(project, index);
  });

  data.tasks.forEach((task, index) => {
    validateTask(task, index);
  });

  data.notes.forEach((note, index) => {
    validateNote(note, index);
  });
  data.activities.forEach((activity, index) => {
    validateActivity(activity, index);
  });

  return data;
}

// Validate Our Project Data
function validateProject(project, index) {
  if (!project) {
    throw new Error(
      `Invalid project at index ${index}: Project cannot be null or undefined.`,
    );
  }
  if (
    !isValidId(project.id) ||
    typeof project.name !== "string" ||
    !project.name.trim()
  ) {
    throw new Error(
      `Invalid project at index ${index}: 'id' must be a positive integer and 'name' must be a non-empty string.`,
    );
  }
}

// Validate Our Task Data
function validateTask(task, index) {
  if (!task) {
    throw new Error(
      `Invalid task at index ${index}: Task cannot be null or undefined.`,
    );
  }

  if (
    !isValidId(task.id) ||
    typeof task.title !== "string" ||
    !task.title.trim() ||
    (task.status !== "completed" && task.status !== "pending")
  ) {
    throw new Error(
      `Invalid task at index ${index}: 'id' must be a positive integer, 'title' must be a non-empty string, and 'status' must be "completed" or "pending".`,
    );
  }
}

// Validate Our Notes Data
function validateNote(note, index) {
  if (!note) {
    throw new Error(
      `Invalid note at index ${index}: Note cannot be null or undefined.`,
    );
  }
  if (
    !isValidId(note.id) ||
    typeof note.title !== "string" ||
    !note.title.trim()
  ) {
    throw new Error(
      `Invalid note at index ${index}: 'id' must be a positive integer and 'title' must be a non-empty string.`,
    );
  }
}

// Validate Our Activity Data
function validateActivity(activity, index) {
  const prefix = typeof index === "number" ? `[Index ${index}] ` : "";
  if (!activity || typeof activity !== "object" || Array.isArray(activity)) {
    throw new Error(`${prefix}Activity must be a valid, non-null object.`);
  }
  const { id, type, entityType, entityId, createdAt } = activity;
  if (typeof id !== "number" || !Number.isInteger(id) || id <= 0) {
    throw new Error(
      `${prefix}Invalid 'id': Expected a positive integer, received: ${id}`,
    );
  }
  const allowedEntityTypes = ["project", "task", "note"];
  if (!allowedEntityTypes.includes(entityType)) {
    throw new Error(
      `${prefix}Invalid 'entityType': Expected one of [${allowedEntityTypes.join(", ")}], received: '${entityType}'`,
    );
  }
  const allowedTypes = [
    "project_created",
    "project_updated",
    "task_created",
    "task_updated",
    "task_completed",
    "note_created",
    "note_updated",
  ];
  if (!allowedTypes.includes(type)) {
    throw new Error(
      `${prefix}Invalid 'type': Received an unauthorized activity type string: '${type}'`,
    );
  }
  if (
    typeof entityId !== "number" ||
    !Number.isInteger(entityId) ||
    entityId <= 0
  ) {
    throw new Error(
      `${prefix}Invalid 'entityId': Expected a positive integer, received: ${entityId}`,
    );
  }
  if (typeof createdAt !== "string" || !createdAt.trim()) {
    throw new Error(
      `${prefix}Invalid 'createdAt': Expected a non-empty string, received: '${createdAt}'`,
    );
  }
  const parsedDate = Date.parse(createdAt);
  if (
    typeof createdAt !== "string" ||
    !createdAt.trim() ||
    Number.isNaN(parsedDate) ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(createdAt)
  ) {
    throw new Error(
      `${prefix}Invalid 'createdAt': Expected a valid parseable date string, received: '${createdAt}'`,
    );
  }
}

const activityMessages = {
  project_created: "Project created",
  project_updated: "Project updated",
  task_created: "Task created",
  task_updated: "Task updated",
  task_completed: "Task completed",
  note_created: "Note created",
  note_updated: "Note updated",
};

function transformActivity(activity) {
  return {
    id: activity.id,
    message: activityMessages[activity.type],
    entityType: activity.entityType,
    entityId: activity.entityId,
    createdAt: activity.createdAt,
  };
}

function transformActivities(activities) {
  return activities.map(transformActivity);
}

function getRecentActivities(activities, limit = 5) {
  return activities
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);
}

function getDashboardRecentActivities(activities) {
  return transformActivities(getRecentActivities(activities, 5));
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

// Fetch Data From Server
async function getRaviVerseData() {
  await delay(3000);
  let response;
  try {
    response = await fetch("../data/raviverse.json");
  } catch (networkError) {
    throw new Error("Network failure: Unable to fetch RaviVerse data.", {
      cause: networkError,
    });
  }
  if (!response.ok) {
    throw new Error(`HTTP failure: Server returned ${response.status}.`, {
      cause: new Error(response.statusText || "Unknown HTTP error"),
    });
  }
  let data;
  try {
    data = await response.json();
  } catch (jsonError) {
    throw new Error("Data parsing failure: Invalid RaviVerse JSON.", {
      cause: jsonError,
    });
  }

  return validateRaviVerseData(data);
}
// Calculate dashboard statistics
function calculateDashboardStats(raviVerseData) {
  const taskStats = raviVerseData.tasks.reduce(
    (acc, curr) => ({
      totalTasks: acc.totalTasks + 1,
      completedTasks:
        acc.completedTasks + (curr.status === "completed" ? 1 : 0),
      pendingTasks: acc.pendingTasks + (curr.status === "pending" ? 1 : 0),
    }),
    {
      totalTasks: 0,
      completedTasks: 0,
      pendingTasks: 0,
    },
  );

  return {
    projects: raviVerseData.projects.length,
    tasks: taskStats.totalTasks,
    notes: raviVerseData.notes.length,
    completedTasks: taskStats.completedTasks,
    pendingTasks: taskStats.pendingTasks,
  };
}
// Get and transform dashboard data
async function getDashboardData() {
  const raviVerseData = await getRaviVerseData();
  return {
    stats: calculateDashboardStats(raviVerseData),
    recentActivities: getDashboardRecentActivities(
      raviVerseData.activities ?? [],
    ),
  };
}

// State Manager
function createDashboardState(currentState, status, data = null, error = null) {
  const validStatuses = ["idle", "loading", "success", "error"];

  if (typeof status !== "string" || !validStatuses.includes(status.trim())) {
    throw new Error(
      `Invalid status: "${status}". Expected one of: ${validStatuses.join(", ")}`,
    );
  }
  const cleanStatus = status.trim();
  const safeData = currentState.data ?? null;
  let nextData;
  if (cleanStatus === "idle") {
    nextData = null;
  } else if (cleanStatus === "success") {
    nextData = data;
  } else {
    nextData = safeData;
  }
  return {
    status: cleanStatus,
    data: nextData,
    error: cleanStatus === "error" ? error : null,
  };
}

// Data Store
function createDashboardStore(initialState) {
  let currentState = initialState;
  return {
    getState: function () {
      return currentState;
    },
    setState: function (status, data, error) {
      currentState = createDashboardState(currentState, status, data, error);
      return currentState;
    },
  };
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
