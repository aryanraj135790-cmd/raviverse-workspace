import { getRaviVerseData } from "../api/raviverse-api.js";
import { getDashboardRecentActivities } from "../transformation/activity-transformer.js";

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
export { getDashboardData };
export { createDashboardStore };
