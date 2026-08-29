export function createStore(initialState) {
  let currentState = initialState;
  const listeners = new Set();

  return {
    getState: () => currentState,

    setState: (updater) => {
      if (typeof updater !== "function") {
        throw new TypeError(
          `store.setState expects an updater function (prevState => newState), but received: ${typeof updater}`,
        );
      }

      const nextState = updater(currentState);

      if (nextState !== currentState) {
        currentState = nextState;
        listeners.forEach((listener) => listener(currentState));
      }

      return currentState;
    },

    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
