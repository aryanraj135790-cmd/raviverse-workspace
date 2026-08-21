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

export { getDashboardData, calculateDashboardStats };
