/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";

const {
  mockInitializeAuth,
  mockHandleAuthState,
  mockSetupDashboardEvents,
  mockInitDashboard,
} = vi.hoisted(() => ({
  mockInitializeAuth: vi.fn(),
  mockHandleAuthState: vi.fn(),
  mockSetupDashboardEvents: vi.fn(),
  mockInitDashboard: vi.fn(),
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

vi.mock("../js/dashboard/dashboard-controller.js", () => ({
  setupDashboardEvents: mockSetupDashboardEvents,
  initDashboard: mockInitDashboard,
}));

import "../js/app.js";

describe("Application Bootstrapping", () => {
  it("should initialize the application dependencies", () => {
    expect(mockSetupDashboardEvents).toHaveBeenCalledTimes(1);

    expect(mockInitDashboard).toHaveBeenCalledTimes(1);

    expect(mockInitializeAuth).toHaveBeenCalledTimes(1);

    expect(mockInitializeAuth).toHaveBeenCalledWith(mockHandleAuthState);
  });
});
