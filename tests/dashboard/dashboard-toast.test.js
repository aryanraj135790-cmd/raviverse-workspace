/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { handleDashboardToast } from "../../js/dashboard/dashboard-controller.js";
import { showToast } from "../../js/ui/toast.js";

vi.mock("../../js/ui/toast.js", () => ({
  showToast: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});
describe("handleDashboardToast", () => {
  it("should show success toast when dashboard loads successfully", () => {
    handleDashboardToast(
      {
        status: "success",
        data: null,
        error: null,
      },
      "Dashboard loaded.",
    );
    expect(showToast).toHaveBeenCalledWith("Dashboard loaded.", "success");
  });
  it("should show error toast when dashboard loading fails", () => {
    handleDashboardToast({
      status: "error",
      data: null,
      error: new Error("Failed to fetch dashboard data"),
    });
    expect(showToast).toHaveBeenCalledWith(
      "Failed to load dashboard. Please try again.",
      "error",
    );
  });
  it("should not show a toast for idle dashboard state", () => {
    handleDashboardToast({
      status: "idle",
      data: null,
      error: null,
    });
    expect(showToast).not.toHaveBeenCalled();
  });
});
