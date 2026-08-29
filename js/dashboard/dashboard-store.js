import { createStore } from "../store/create-store.js";

// State Manager
function createDashboardState(currentState, status, data = null, error = null) {
  const validStatuses = ["idle", "loading", "success", "error"];

  if (typeof status !== "string" || !validStatuses.includes(status.trim())) {
    throw new Error(
      `Invalid status: "${status}". Expected one of: ${validStatuses.join(", ")}`,
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

// Data Store
function createDashboardStore(initialState) {
  const store = createStore(initialState);
  return {
    getState: store.getState,
    subscribe: store.subscribe,
    setState: (status, data, error) => {
      return store.setState((currentState) =>
        createDashboardState(currentState, status, data, error),
      );
    },
  };
}

export { createDashboardStore };
