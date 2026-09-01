// Shared, pure grouping helper used by both board-data.js (fetch shaping)
// and board-store.js (post-mutation regrouping). One source of truth so the
// grouping rule never drifts between the data layer and the store.

/**
 * Group tasks by their project. Tasks without a known project land in a
 * pseudo-group keyed as `null`, rendered as "Unassigned".
 *
 * @param {Array} projects - project rows `{ id, name, ... }`.
 * @param {Array} tasks    - task rows `{ id, projectId, ... }`.
 * @returns {Array<{ project: object|null, tasks: object[] }>}
 */
function groupTasksByProject(projects, tasks) {
  const safeProjects = Array.isArray(projects) ? projects : [];
  const safeTasks = Array.isArray(tasks) ? tasks : [];

  const groups = safeProjects.map((project) => ({
    project,
    tasks: safeTasks.filter((task) => task.projectId === project.id),
  }));

  const orphans = safeTasks.filter(
    (task) => !safeProjects.some((project) => project.id === task.projectId),
  );

  if (orphans.length > 0) {
    groups.push({ project: null, tasks: orphans });
  }

  return groups;
}

export { groupTasksByProject };