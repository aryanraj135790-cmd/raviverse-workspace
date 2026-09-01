import { fetchBoardRawData } from "../supabase/board-queries.js";

// Group tasks by their project. Tasks without a project land in a
// pseudo-group keyed as null, rendered as "Unassigned".
function groupTasksByProject(projects, tasks) {
  const groups = projects.map((project) => ({
    project,
    tasks: tasks.filter((task) => task.projectId === project.id),
  }));

  const orphans = tasks.filter(
    (task) => !projects.some((project) => project.id === task.projectId),
  );

  if (orphans.length > 0) {
    groups.push({ project: null, tasks: orphans });
  }

  return groups;
}

// Get and shape board data
async function getBoardData() {
  const rawData = await fetchBoardRawData();

  return {
    projects: rawData.projects,
    tasks: rawData.tasks,
    groups: groupTasksByProject(rawData.projects, rawData.tasks),
  };
}

export { getBoardData, groupTasksByProject };