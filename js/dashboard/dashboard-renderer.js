import { getRecentActivityListElement } from "./dashboard-dom.js";
// Formatting helpers
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

// Dashboard rendering
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
function renderDashboardStatusMessage(statusElement, status) {
  if (!statusElement) return;
  switch (status) {
    case "idle":
      statusElement.textContent = "Dashboard is ready.";
      break;

    case "loading":
      statusElement.textContent = "Loading dashboard...";
      break;

    case "success":
      statusElement.textContent = "Dashboard loaded.";
      break;

    case "error":
      statusElement.textContent = "Failed to load dashboard. Please try again.";
      break;
  }
}

// Recent activity rendering
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
export {
  renderDashboardStats,
  renderDashboardLoadingState,
  renderRecentActivities,
  renderRecentActivitiesLoadingState,
  renderDashboardStatusMessage,
  renderRecentActivitiesRefreshState,
};
