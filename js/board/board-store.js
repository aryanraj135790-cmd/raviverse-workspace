import { createStore } from "../store/create-store.js";
import { groupTasksByProject } from "./group-tasks.js";

// Task statuses mirror the `task_status` enum ({ todo, in_progress, completed }).
// `todo` matches the DB column default, so the optimistic create never claims a
// status the database enum could not store.
const TASK_STATUS = {
  ACTIVE: "todo",
  COMPLETED: "completed",
  IN_PROGRESS: "in_progress",
};

const VALID_STATUSES = ["idle", "loading", "success", "error"];

function createBoardState(currentState, status, data = null, error = null) {
  if (typeof status !== "string" || !VALID_STATUSES.includes(status.trim())) {
    throw new Error(
      `Invalid status: "${status}". Expected one of: ${VALID_STATUSES.join(", ")}`,
    );
  }

  const cleanStatus = status.trim();
  const safeData = currentState.data ?? null;

  let nextData;
  if (cleanStatus === "idle") {
    nextData = null;
  } else if (cleanStatus === "success") {
    nextData = data;
  } else {
    nextData = safeData;
  }

  return {
    status: cleanStatus,
    data: nextData,
    error: cleanStatus === "error" ? error : null,
  };
}

// ADR-005: optimistic mutation state lives beside the main dataset.
// pendingMutation: { kind, snapshot, optimisticTaskId } — snapshot holds the
// previous data reference so rollback is a single setState away.
function createBoardStore(initialState) {
  const store = createStore({
    ...initialState,
    pendingMutation: null,
  });

  function publish(updater) {
    return store.setState((prevState) => {
      const next = updater(prevState);
      return next === prevState ? prevState : { ...next };
    });
  }

  function withGroups(data) {
    const tasks = data?.tasks ?? [];
    const projects = data?.projects ?? [];
    return {
      ...data,
      groups: groupTasksByProject(projects, tasks),
    };
  }

  return {
    getState: store.getState,
    subscribe: store.subscribe,

    setStatus: (status, data, error) =>
      store.setState((currentState) =>
        createBoardState(currentState, status, data, error),
      ),

    // --- ADR-005 optimistic mutations ---

    beginMutation(kind) {
      publish((prevState) => ({
        ...prevState,
        pendingMutation: {
          kind,
          snapshot: prevState.data,
          optimisticTaskId: null,
        },
      }));
      return store.getState();
    },

    // Optimistic create: task gets a temporary negative id until DB confirms.
    // Normalizes the form's snake_case `project_id` into the camelCase model
    // the board uses (matches board-queries mapTask), so the card groups correctly.
    applyOptimisticCreate(taskData) {
      const tempId = -Date.now();
      const optimisticTask = {
        ...taskData,
        id: tempId,
        projectId: taskData.projectId ?? taskData.project_id ?? null,
        status: taskData.status ?? TASK_STATUS.ACTIVE,
        completedAt: taskData.completedAt ?? null,
      };
      publish((prevState) => {
        const tasks = [...(prevState.data?.tasks ?? []), optimisticTask];
        const projects = prevState.data?.projects ?? [];
        return {
          ...prevState,
          data: withGroups({ ...prevState.data, tasks, projects }),
          pendingMutation: {
            ...prevState.pendingMutation,
            kind: "create",
            optimisticTaskId: tempId,
          },
        };
      });
      return tempId;
    },

    confirmCreate(realTask) {
      publish((prevState) => {
        const tempId = prevState.pendingMutation?.optimisticTaskId;
        const tasks = (prevState.data?.tasks ?? []).map((task) =>
          task.id === tempId ? { ...realTask } : task,
        );
        return {
          ...prevState,
          data: withGroups({ ...prevState.data, tasks }),
          pendingMutation: null,
        };
      });
    },

    // Optimistic update: merge updates into the task immediately.
    applyOptimisticUpdate(taskId, updates) {
      publish((prevState) => {
        const tasks = (prevState.data?.tasks ?? []).map((task) =>
          task.id === taskId ? { ...task, ...updates } : task,
        );
        return {
          ...prevState,
          data: withGroups({ ...prevState.data, tasks }),
        };
      });
    },

    // Optimistic soft delete: remove the card immediately.
    applyOptimisticDelete(taskId) {
      publish((prevState) => {
        const tasks = (prevState.data?.tasks ?? []).filter(
          (task) => task.id !== taskId,
        );
        return {
          ...prevState,
          data: withGroups({ ...prevState.data, tasks }),
        };
      });
    },

    // Rollback: restore the pre-mutation snapshot + clear pending state.
    rollbackMutation() {
      publish((prevState) => ({
        ...prevState,
        data: prevState.pendingMutation?.snapshot ?? prevState.data,
        pendingMutation: null,
      }));
    },

    // Confirmed non-create mutations just clear pending state.
    confirmMutation() {
      publish((prevState) => ({
        ...prevState,
        pendingMutation: null,
      }));
    },
  };
}

export { createBoardStore, TASK_STATUS };