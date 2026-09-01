/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";

const {
  mockInitializeAuth,
  mockHandleAuthState,
  mockSetupAuthUI,
  mockInitDashboard,
  mockDestroyDashboard,
  mockRegisterRoute,
  mockInitRouter,
} = vi.hoisted(() => ({
  mockInitializeAuth: vi.fn(),
  mockHandleAuthState: vi.fn(),
  mockSetupAuthUI: vi.fn(),
  mockInitDashboard: vi.fn(),
  mockDestroyDashboard: vi.fn(),
  mockRegisterRoute: vi.fn(),
  mockInitRouter: vi.fn(),
}));

vi.mock("../js/supabase/auth.js", () => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
}));

vi.mock("../js/auth/auth-controller.js", () => ({
  initializeAuth: mockInitializeAuth,
}));

vi.mock("../js/auth/auth-state-handler.js", () => ({
  handleAuthState: mockHandleAuthState,
}));

vi.mock("../js/auth/auth-ui-controller.js", () => ({
  setupAuthUI: mockSetupAuthUI,
}));

vi.mock("../js/router/router.js", () => ({
  registerRoute: mockRegisterRoute,
  initRouter: mockInitRouter,
}));

vi.mock("../js/dashboard/dashboard-controller.js", () => ({
  initDashboard: mockInitDashboard,
  destroyDashboard: mockDestroyDashboard,
}));

import "../js/app.js";

describe("Application Bootstrapping", () => {
  it("should initialize auth with its state handler and set up auth UI", () => {
    expect(mockInitializeAuth).toHaveBeenCalledTimes(1);

    expect(mockInitializeAuth).toHaveBeenCalledWith(mockHandleAuthState);

    expect(mockSetupAuthUI).toHaveBeenCalledTimes(1);
  });

  it("should register the dashboard route with a mount/destroy lifecycle pair", () => {
    expect(mockRegisterRoute).toHaveBeenCalledTimes(1);

    const [dashboardRoute, dashboardLifecycle] = mockRegisterRoute.mock.calls[0];

    expect(dashboardRoute).toBe("#/dashboard");

    // The route must own BOTH halves of the view lifecycle
    expect(dashboardLifecycle.mount).toBe(mockInitDashboard);

    expect(dashboardLifecycle.destroy).toBe(mockDestroyDashboard);
  });

  it("should boot the router with the dashboard as the default route", () => {
    expect(mockInitRouter).toHaveBeenCalledTimes(1);

    expect(mockInitRouter).toHaveBeenCalledWith("#/dashboard");
  });
});
