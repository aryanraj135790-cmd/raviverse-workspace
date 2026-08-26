/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import { createDashboardView } from "../../js/dashboard/dashboard-view.js";

describe("createDashboardView DOM Contract", () => {
  it("should create the required semantic Dashboard DOM structure", () => {
    const dashboardView = createDashboardView();

    expect(dashboardView.isConnected).toBe(false);
    expect(dashboardView).not.toBeNull();
    expect(dashboardView.tagName.toLowerCase()).toBe("section");

    const mainContent = dashboardView.querySelector(".main-content");
    expect(mainContent).not.toBeNull();

    const header = mainContent.querySelector("header");
    expect(header).not.toBeNull();
    expect(header.querySelector("h1")).not.toBeNull();
    expect(header.querySelector("p")).not.toBeNull();

    expect(header.querySelector("#dashboard-refresh")).not.toBeNull();
    expect(mainContent.querySelector("#dashboard-status")).not.toBeNull();

    expect(
      mainContent.querySelector('[data-dashboard-stat="projects"]'),
    ).not.toBeNull();
    expect(
      mainContent.querySelector('[data-dashboard-stat="tasks"]'),
    ).not.toBeNull();
    expect(
      mainContent.querySelector('[data-dashboard-stat="notes"]'),
    ).not.toBeNull();
    expect(
      mainContent.querySelector('[data-dashboard-stat="completedTasks"]'),
    ).not.toBeNull();
    expect(
      mainContent.querySelector('[data-dashboard-stat="pendingTasks"]'),
    ).not.toBeNull();

    expect(mainContent.querySelector("#recent-activity-list")).not.toBeNull();
  });
});
