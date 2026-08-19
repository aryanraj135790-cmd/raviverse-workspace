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
export { getDashboardRecentActivities };
