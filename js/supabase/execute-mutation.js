import { logActivity } from "./activity-writes.js";

/**
 * Executes a DB mutation and guarantees audit logging upon success.
 *
 * @param {Object} params
 * @param {Function} params.action - Async database operation thunk.
 * @param {Object|Function} params.log - Activity payload or dynamic logger function.
 * @returns {Promise<any>} Returns the raw action result (caller shapes the thunk's return value).
 */

export async function executeMutation({ action, log } = {}) {
  if (!log) {
    throw new TypeError(
      "executeMutation: 'log' payload or function is required to enforce activity discipline.",
    );
  }

  if (typeof action !== "function") {
    throw new TypeError("executeMutation: 'action' must be a function.");
  }

  let result;

  try {
    result = await action();
  } catch (err) {
    throw new Error("Database mutation failed.", { cause: err });
  }

  try {
    const logPayload = typeof log === "function" ? log(result) : log;
    await logActivity(logPayload);
  } catch (logErr) {
    console.warn("Activity log failed after DB mutation succeeded:", logErr);
  }

  return result;
}
