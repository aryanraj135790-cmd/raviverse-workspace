import {
  setupDashboardEvents,
  initDashboard,
} from "./dashboard/dashboard-controller.js";
import { initializeAuth } from "./auth/auth-controller.js";
import { handleAuthState } from "./auth/auth-state-handler.js";
import { setupAuthUI } from "./auth/auth-ui-controller.js";

initializeAuth(handleAuthState);
setupAuthUI();
setupDashboardEvents();
initDashboard();
