import { fetchBoardRawData } from "../supabase/board-queries.js";
import { groupTasksByProject } from "./group-tasks.js";

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