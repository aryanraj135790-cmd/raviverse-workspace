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
  let currentState = initialState;
  return {
    getState: function () {
      return currentState;
    },
    setState: function (status, data, error) {
      currentState = createDashboardState(currentState, status, data, error);
      return currentState;
    },
  };
}

export { createDashboardStore };
