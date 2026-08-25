import { setupAuthForm } from "./auth-form-handler.js";
import { createAuthStore } from "./auth-store.js";
import { renderAuthView } from "./auth-renderer.js";
import { loginUser, signupUser } from "./auth-action.js";

const initialAuthState = {
  status: "idle",
  mode: "login",
  error: null,
};

const authStore = createAuthStore(initialAuthState);

export function setupAuthOperation(form, mode = "login") {
  if (!form) {
    return;
  }

  const authView = form.closest("#auth-view") ?? form;

  let currentMode = mode;

  const setupCurrentForm = () => {
    const currentForm =
      authView instanceof HTMLFormElement
        ? authView
        : authView.querySelector("form");
    if (!currentForm) {
      return;
    }

    setupAuthForm(
      currentForm,
      async ({ email, password }) => {
        authStore.setState("loading", currentMode);

        try {
          if (currentMode === "login") {
            await loginUser(email, password);
          } else {
            await signupUser(email, password);
          }

          authStore.setState("success", currentMode);
        } catch (error) {
          authStore.setState("error", currentMode, error.message);
        }
      },
      (nextMode) => {
        currentMode = nextMode;
        authStore.setState("idle", nextMode);
      },
    );
  };

  setupCurrentForm();

  const unsubscribe = authStore.subscribe((state) => {
    renderAuthView(authView, state);
    setupCurrentForm();
  });

  return unsubscribe;
}
