import { ACTIVITY_TYPE, ENTITY_TYPE } from "./activity-writes.js";
import { getAuthenticatedUserId } from "./auth.js";
import { supabase } from "./client.js";
import { executeMutation } from "./execute-mutation.js";

// Create New Task
export function createTask(taskData) {
  return executeMutation({
    action: async () => {
      const user_id = await getAuthenticatedUserId();
      const { data, error } = await supabase
        .from("tasks")
        .insert({ ...taskData, user_id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    log: (result) => ({
      type: ACTIVITY_TYPE.TASK_CREATED,
      entityType: ENTITY_TYPE.TASK,
      entityId: result?.id,
      entityName: result?.title || taskData.title,
    }),
  });
}

// Delete Task (Soft Delete with Pre-Fetch Snapshot)
export async function deleteTask(taskId) {
  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("title")
    .eq("id", taskId)
    .single();

  if (taskError) {
    throw new Error("Failed to fetch task before delete", { cause: taskError });
  }

  return executeMutation({
    action: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", taskId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    log: {
      type: ACTIVITY_TYPE.TASK_DELETED,
      entityType: ENTITY_TYPE.TASK,
      entityId: taskId,
      entityName: task.title,
    },
  });
}

// Update Task (Generic fields update)
export async function updateTask(taskId, updates) {
  return executeMutation({
    action: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", taskId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    log: (result) => ({
      type: ACTIVITY_TYPE.TASK_UPDATED,
      entityType: ENTITY_TYPE.TASK,
      entityId: taskId,
      entityName: result?.title,
    }),
  });
}

// Complete Task
export async function completeTask(taskId) {
  return executeMutation({
    action: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", taskId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    log: (result) => ({
      type: ACTIVITY_TYPE.TASK_COMPLETED,
      entityType: ENTITY_TYPE.TASK,
      entityId: taskId,
      entityName: result?.title,
    }),
  });
}

// Reopen Task
export async function reopenTask(taskId) {
  return executeMutation({
    action: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .update({
          status: "todo",
          completed_at: null,
        })
        .eq("id", taskId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    log: (result) => ({
      type: ACTIVITY_TYPE.TASK_REOPENED,
      entityType: ENTITY_TYPE.TASK,
      entityId: taskId,
      entityName: result?.title,
    }),
  });
}
