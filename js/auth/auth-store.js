function createAuthState(status, mode, error = null) {
  const validStatuses = ["idle", "loading", "success", "error"];
  const validModes = ["login", "signup"];

  if (typeof status !== "string" || !validStatuses.includes(status.trim())) {
    throw new Error(
      `Invalid status: "${status}". Expected one of: ${validStatuses.join(", ")}`,
    );
  }

  if (typeof mode !== "string" || !validModes.includes(mode.trim())) {
    throw new Error(
      `Invalid mode: "${mode}". Expected one of: ${validModes.join(", ")}`,
    );
  }

  const cleanStatus = status.trim();
  const cleanMode = mode.trim();

  return {
    status: cleanStatus,
    mode: cleanMode,
    error: cleanStatus === "error" ? error : null,
  };
}

// Auth UI State Store
function createAuthStore(initialState) {
  let currentState = initialState;
  const listeners = new Set();

  return {
    getState() {
      return currentState;
    },

    setState(status, mode, error) {
      currentState = createAuthState(status, mode, error);

      listeners.forEach((listener) => {
        listener(currentState);
      });

      return currentState;
    },

    subscribe(listener) {
      if (typeof listener !== "function") {
        throw new TypeError("Subscriber must be a function");
      }

      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export { createAuthStore };
