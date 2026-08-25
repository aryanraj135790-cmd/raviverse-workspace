import { renderAuthView } from "./auth-renderer.js";
import { renderAppView } from "./auth-view-controller.js";
import { setupAuthOperation } from "./auth-operation-controller.js";

export function handleAuthState(state) {
  renderAppView(state);

  if (state.status === "unauthenticated") {
    const authView = document.querySelector("#auth-view");

    renderAuthView(authView, state);

    const form = authView.querySelector("form");

    setupAuthOperation(form, state.mode);
  }
}
