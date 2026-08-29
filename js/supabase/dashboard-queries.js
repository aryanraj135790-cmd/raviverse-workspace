import { supabase } from "./client.js";

function mapProject(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.name,
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
    status: row.status,
    completedAt: row.completed_at,
  };
}

function mapNote(row) {
  if (!row) return null;
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    createdAt: row.created_at,
  };
}

function mapActivity(row) {
  if (!row) return null;
  return {
    id: row.id,
    type: row.type,
    entityType: row.entity_type,
    entityId: row.entity_id,
    entityName: row.entity_name,
    deprecated: row.deprecated,
    createdAt: row.created_at,
  };
}

export async function fetchDashboardRawData() {
  const [projectsRes, tasksRes, notesRes, activitiesRes] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name, description, status, created_at")
      .is("deleted_at", null),

    supabase
      .from("tasks")
      .select("id, project_id, title, status, completed_at")
      .is("deleted_at", null),

    supabase
      .from("notes")
      .select("id, project_id, title, created_at")
      .is("deleted_at", null),

    supabase
      .from("activities")
      .select(
        "id, type, entity_type, entity_id, entity_name, deprecated, created_at",
      )
      .is("deprecated", false)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const failedResource =
    (projectsRes.error && "projects") ||
    (tasksRes.error && "tasks") ||
    (notesRes.error && "notes") ||
    (activitiesRes.error && "activities");

  if (failedResource) {
    const primaryError =
      projectsRes.error ||
      tasksRes.error ||
      notesRes.error ||
      activitiesRes.error;

    throw new Error(
      `Failed to fetch dashboard resource [${failedResource}]: ${primaryError.message}`,
      { cause: primaryError },
    );
  }

  return {
    projects: (projectsRes.data || []).map(mapProject),
    tasks: (tasksRes.data || []).map(mapTask),
    notes: (notesRes.data || []).map(mapNote),
    activities: (activitiesRes.data || []).map(mapActivity),
  };
}
