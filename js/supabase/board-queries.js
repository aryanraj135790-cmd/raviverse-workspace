import { supabase } from "./client.js";

function mapProject(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    status: row.status,
    createdAt: row.created_at,
  };
}

function mapTask(row) {
  if (!row) return null;
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    description: row.description ?? "",
    status: row.status,
    priority: row.priority ?? null,
    dueDate: row.due_date ?? null,
    completedAt: row.completed_at,
    startedAt: row.started_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    projectName: row.projects?.name ?? null,
  };
}

export async function fetchBoardRawData() {
  const [projectsRes, tasksRes] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name, description, status, created_at")
      .is("deleted_at", null)
      .order("created_at", { ascending: true }),

    supabase
      .from("tasks")
      .select("*, projects(name)")
      .is("deleted_at", null)
      .order("created_at", { ascending: true }),
  ]);

  const failedResource = (projectsRes.error && "projects") || (tasksRes.error && "tasks");

  if (failedResource) {
    const primaryError = projectsRes.error || tasksRes.error;
    throw new Error(
      `Failed to fetch board resource [${failedResource}]: ${primaryError.message}`,
      { cause: primaryError },
    );
  }

  return {
    projects: (projectsRes.data || []).map(mapProject),
    tasks: (tasksRes.data || []).map(mapTask),
  };
}