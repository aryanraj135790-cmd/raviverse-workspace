import {
  setupDashboardEvents,
  initDashboard,
} from "./dashboard/dashboard-controller.js";
import { initializeAuth } from "./auth/auth-controller.js";
import { handleAuthState } from "./auth/auth-state-handler.js";
import { setupAuthUI } from "./auth/auth-ui-controller.js";

initializeAuth(handleAuthState);
setupAuthUI();
// The dashboard view must be created (and DOM refs re-captured) before
// binding events, otherwise the refresh button does not exist yet.
initDashboard();
setupDashboardEvents();
