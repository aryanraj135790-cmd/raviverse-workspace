import {
  destroyDashboard,
  initDashboard,
} from "./dashboard/dashboard-controller.js";
import {
  destroyBoard,
  initBoard,
} from "./board/board-controller.js";
import { initializeAuth } from "./auth/auth-controller.js";
import { handleAuthState } from "./auth/auth-state-handler.js";
import { setupAuthUI } from "./auth/auth-ui-controller.js";
import { initRouter, registerRoute } from "./router/router.js";

initializeAuth(handleAuthState);
setupAuthUI();
registerRoute("#/dashboard", {
  mount: initDashboard,
  destroy: destroyDashboard,
});
registerRoute("#/tasks", {
  mount: initBoard,
  destroy: destroyBoard,
});

initRouter("#/dashboard");
