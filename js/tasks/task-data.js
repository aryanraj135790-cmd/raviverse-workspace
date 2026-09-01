import { supabase } from "../supabase/client.js";

function mapProject(project) {
  if (!project) return null;
  return {
    id: project.id,
    name: project.name,
    slug: project.slug,
    description: project.description,
    status: project.status,
    createdAt: project.created_at,
  };
}

function mapTask(task) {
  if (!task) return null;
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    projectId: task.project_id,
    createdAt: task.created_at,
    priority: task.priority,
    dueDate: task.due_date,
    completedAt: task.completed_at,
  };
}

export async function getTaskData() {
  const [projectsRes, tasksRes] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name, slug, description, status, created_at")
      .is("deleted_at", null),

    supabase
      .from("tasks")
      .select(
        "id, title, description, status, project_id, priority, due_date, created_at, completed_at",
      )
      .is("deleted_at", null),
  ]);

  // Handle Query Errors
  const failedRequest =
    (projectsRes.error && "projects") || (tasksRes.error && "tasks");

  if (failedRequest) {
    const errorObj = projectsRes.error || tasksRes.error;
    throw new Error(
      `Failed to fetch tasks resource [${failedRequest}]: ${errorObj.message}`,
      { cause: errorObj },
    );
  }

  const projects = (projectsRes.data || []).map(mapProject);
  const tasks = (tasksRes.data || []).map(mapTask);

  const tasksByProjectId = new Map(projects.map((p) => [p.id, []]));
  const validTasks = [];
  for (const task of tasks) {
    const group = tasksByProjectId.get(task.projectId);

    if (!group) {
      throw new Error(
        `Task ${task.id} references unknown project_id ${task.projectId}`,
        { cause: { taskId: task.id, projectId: task.projectId } },
      );
    }

    group.push(task);
    validTasks.push(task);
  }

  const groupedData = projects.map((project) => ({
    ...project,
    tasks: tasksByProjectId.get(project.id) || [],
  }));

  return { groupedData };
}
