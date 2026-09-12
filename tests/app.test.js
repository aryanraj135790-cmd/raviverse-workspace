/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../js/dashboard/dashboard-controller.js", () => ({
  destroyDashboard: vi.fn(),
  initDashboard: vi.fn(),
}));
vi.mock("../js/tasks/task-controller.js", () => ({
  destroyTaskController: vi.fn(),
  initTaskController: vi.fn(),
}));
vi.mock("../js/auth/auth-controller.js", () => ({
  initializeAuth: vi.fn(),
}));
vi.mock("../js/auth/auth-state-handler.js", () => ({
  handleAuthState: vi.fn(),
}));
vi.mock("../js/auth/auth-ui-controller.js", () => ({
  setupAuthUI: vi.fn(),
}));

describe("app route registration", () => {
  beforeEach(async () => {
    vi.resetModules();
    document.body.innerHTML = '<div id="app-view"></div>';
    window.location.hash = "";
  });

  it("registers dashboard and tasks routes with mount/destroy pairs", async () => {
    const router = await import("../js/router/router.js");
    const dashboard = await import("../js/dashboard/dashboard-controller.js");
    const tasks = await import("../js/tasks/task-controller.js");

    await import("../js/app.js");

    window.location.hash = "#/tasks";
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    expect(tasks.initTaskController).toHaveBeenCalled();

    window.location.hash = "#/dashboard";
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    expect(tasks.destroyTaskController).toHaveBeenCalled();
    expect(dashboard.initDashboard).toHaveBeenCalled();
  });
});

