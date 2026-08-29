import { supabase } from "./client.js";
import { getAuthenticatedUserId } from "./auth.js";

export const ACTIVITY_TYPE = {
  PROJECT_CREATED: "project_created",
  PROJECT_UPDATED: "project_updated",
  PROJECT_DELETED: "project_deleted",
  TASK_CREATED: "task_created",
  TASK_UPDATED: "task_updated",
  TASK_COMPLETED: "task_completed",
  TASK_REOPENED: "task_reopened",
  TASK_DELETED: "task_deleted",
  NOTE_CREATED: "note_created",
  NOTE_UPDATED: "note_updated",
  NOTE_DELETED: "note_deleted",
};

export const ENTITY_TYPE = {
  PROJECT: "project",
  TASK: "task",
  NOTE: "note",
};

/**
 * Append one immutable event to the activities log.
 * Call AFTER the entity mutation succeeds — never before.
 *
 * @param {object} event
 * @param {string} event.type      one of ACTIVITY_TYPE
 * @param {string} event.entityType one of ENTITY_TYPE
 * @param {string} event.entityName  name snapshot (survives hard delete)
 * @param {number|null} [event.entityId] null when the entity is gone
 * @param {boolean} [event.deprecated=false] true ONLY for hard-delete tombstones
 */

export async function logActivity({
  type,
  entityType,
  entityName,
  entityId = null,
  deprecated = false,
}) {
  const user_id = await getAuthenticatedUserId();

  const { error } = await supabase.from("activities").insert({
    user_id,
    type,
    entity_type: entityType,
    entity_id: entityId,
    entity_name: entityName,
    deprecated,
  });

  if (error) {
    throw new Error(`Failed to log activity: ${error.message}`, {
      cause: error,
    });
  }
}
