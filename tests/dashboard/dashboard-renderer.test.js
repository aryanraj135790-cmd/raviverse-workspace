/**
 * @vitest-environment jsdom
 */

import { describe, expect, it, vi, afterEach } from "vitest";
import {
  renderDashboardStatusMessage,
  renderDashboardStats,
  renderDashboardLoadingState,
  renderRecentActivities,
  renderRecentActivitiesLoadingState,
  renderRecentActivitiesRefreshState,
} from "../../js/dashboard/dashboard-renderer.js";
afterEach(() => {
  vi.useRealTimers();
});
describe("renderDashboardStatusMessage", () => {
  it.each([
    ["idle", "Dashboard is ready."],
    ["loading", "Loading dashboard..."],
    ["success", "Dashboard loaded."],
    ["error", "Failed to load dashboard. Please try again."],
  ])("should render %s status message", (status, expectedMessage) => {
    const statusElement = document.createElement("p");
    statusElement.textContent = "Old message";
    renderDashboardStatusMessage(statusElement, status);
    expect(statusElement.textContent).toBe(expectedMessage);
  });
  it("should render dashboard statistics", () => {
    const elementsMap = {
      projects: document.createElement("span"),
      tasks: document.createElement("span"),
    };
    const data = {
      projects: 5,
      tasks: 12,
    };
    renderDashboardStats(data, elementsMap);
    expect(elementsMap.projects.textContent).toBe("5");
    expect(elementsMap.tasks.textContent).toBe("12");
  });
  it("should format large dashboard statistics", () => {
    const elementsMap = {
      projects: document.createElement("span"),
      tasks: document.createElement("span"),
    };
    const data = {
      projects: 1500,
      tasks: 1000000,
    };
    renderDashboardStats(data, elementsMap);
    expect(elementsMap.projects.textContent).toBe("1.5K");
    expect(elementsMap.tasks.textContent).toBe("1M");
  });
  it("should not update the DOM when the statistic value has not changed", () => {
    const projectsElement = document.createElement("span");
    projectsElement.textContent = "5";
    const textContentSetter = vi.spyOn(projectsElement, "textContent", "set");
    renderDashboardStats({ projects: 5 }, { projects: projectsElement });
    expect(textContentSetter).not.toHaveBeenCalled();
    textContentSetter.mockRestore();
  });
  it("should update the DOM when the statistic value has changed", () => {
    const projectsElement = document.createElement("span");
    projectsElement.textContent = "10";
    const textContentSetter = vi.spyOn(projectsElement, "textContent", "set");
    renderDashboardStats({ projects: 5 }, { projects: projectsElement });
    expect(textContentSetter).toHaveBeenCalled();
    textContentSetter.mockRestore();
  });
  it("should add loading class when loading without existing data", () => {
    const statCards = {
      projects: document.createElement("article"),
      tasks: document.createElement("article"),
    };
    renderDashboardLoadingState({ status: "loading", data: null }, statCards);
    expect(statCards.projects.classList.contains("is-loading")).toBe(true);
    expect(statCards.tasks.classList.contains("is-loading")).toBe(true);
  });
  it("should add refreshing class when loading with existing data", () => {
    const statCards = {
      projects: document.createElement("article"),
      tasks: document.createElement("article"),
    };
    renderDashboardLoadingState(
      {
        status: "loading",
        data: {
          projects: 5,
          tasks: 10,
        },
      },
      statCards,
    );
    expect(statCards.projects.classList.contains("is-refreshing")).toBe(true);
    expect(statCards.projects.classList.contains("is-loading")).toBe(false);
    expect(statCards.tasks.classList.contains("is-refreshing")).toBe(true);
    expect(statCards.tasks.classList.contains("is-loading")).toBe(false);
  });
  it("should remove loading classes when dashboard is not loading", () => {
    const projectsCard = document.createElement("article");
    projectsCard.classList.add("is-loading", "is-refreshing");
    const tasksCard = document.createElement("article");
    tasksCard.classList.add("is-loading", "is-refreshing");
    const statCards = {
      projects: projectsCard,
      tasks: tasksCard,
    };
    renderDashboardLoadingState(
      {
        status: "success",
        data: {
          projects: 5,
          tasks: 10,
        },
      },
      statCards,
    );
    expect(statCards.projects.classList.contains("is-loading")).toBe(false);
    expect(statCards.projects.classList.contains("is-refreshing")).toBe(false);
    expect(statCards.tasks.classList.contains("is-loading")).toBe(false);
    expect(statCards.tasks.classList.contains("is-refreshing")).toBe(false);
  });
  it("should render empty state when there are no recent activities", () => {
    const listElement = document.createElement("ul");
    renderRecentActivities([], listElement);
    expect(listElement.children.length).toBe(1);
    expect(listElement.querySelector("li")).not.toBeNull();
    expect(listElement.querySelector("p").textContent).toBe(
      "No recent activity yet.",
    );
  });
  it("should render recent activities", () => {
    const listElement = document.createElement("ul");
    renderRecentActivities(
      [
        {
          message: "Task completed",
          entityType: "task",
          entityId: 2,
          createdAt: "2026-08-20T10:00:00Z",
        },
      ],
      listElement,
    );
    expect(listElement.querySelector("li")).not.toBeNull();
    expect(
      listElement.querySelector("li").classList.contains("recent-activity-li"),
    ).toBe(true);
    expect(listElement.querySelector("p").textContent).toBe("Task completed");
    expect(listElement.querySelector("span").textContent).toBe("Task #2");
    expect(listElement.querySelector("time")).not.toBeNull();
  });
  it("should render 'just now' for activities created less than a minute ago", () => {
    const listElement = document.createElement("ul");
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-20T11:00:00Z"));
    renderRecentActivities(
      [
        {
          message: "Task completed",
          entityType: "task",
          entityId: 2,
          createdAt: "2026-08-20T10:59:30Z",
        },
      ],
      listElement,
    );
    expect(listElement.querySelector("time").textContent).toBe("just now");
  });
  it("should render minutes ago for activities created less than an hour ago", () => {
    const listElement = document.createElement("ul");
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-20T11:00:00Z"));
    renderRecentActivities(
      [
        {
          message: "Task completed",
          entityType: "task",
          entityId: 2,
          createdAt: "2026-08-20T10:45:00Z",
        },
      ],
      listElement,
    );
    expect(listElement.querySelector("time").textContent).toBe(
      "15 minutes ago",
    );
  });
  it("should render hours ago for activities created less than 24 hours ago", () => {
    const listElement = document.createElement("ul");
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-20T11:00:00Z"));
    renderRecentActivities(
      [
        {
          message: "Task completed",
          entityType: "task",
          entityId: 2,
          createdAt: "2026-08-20T08:00:00Z",
        },
      ],
      listElement,
    );
    expect(listElement.querySelector("time").textContent).toBe("3 hours ago");
  });
  it("should render days ago for activities created 24 hours or more ago", () => {
    const listElement = document.createElement("ul");
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-20T11:00:00Z"));
    renderRecentActivities(
      [
        {
          message: "Task completed",
          entityType: "task",
          entityId: 2,
          createdAt: "2026-08-18T11:00:00Z",
        },
      ],
      listElement,
    );
    expect(listElement.querySelector("time").textContent).toBe("2 days ago");
  });
  it("should render empty text in the <time> element when createdAt is missing", () => {
    const listElement = document.createElement("ul");
    renderRecentActivities(
      [
        {
          message: "Task completed",
          entityType: "task",
          entityId: 2,
          createdAt: null,
        },
      ],
      listElement,
    );
    expect(listElement.querySelector("time").textContent).toBe("");
  });
  it("should render empty time text when createdAt is an invalid date string", () => {
    const listElement = document.createElement("ul");
    renderRecentActivities(
      [
        {
          message: "Task completed",
          entityType: "task",
          entityId: 2,
          createdAt: "not-a-valid-date",
        },
      ],
      listElement,
    );
    expect(listElement.querySelector("time").textContent).toBe("");
  });
  it("should do nothing when listElement is not provided", () => {
    expect(() => {
      renderRecentActivities([], null);
    }).not.toThrow();
  });
  it("should render loading skeletons and correct skeleton elements for each activity item", () => {
    const listElement = document.createElement("ul");
    renderRecentActivitiesLoadingState(true, listElement);
    const items = listElement.querySelectorAll("li");
    expect(listElement.children.length).toBe(5);
    items.forEach((item) => {
      expect(item.classList.contains("recent-activity-li")).toBe(true);
      expect(item.classList.contains("is-loading")).toBe(true);
      expect(item.querySelector(".activity-message-loading")).not.toBeNull();
      expect(item.querySelector(".activity-entity-loading")).not.toBeNull();
      expect(item.querySelector(".activity-time-loading")).not.toBeNull();
    });
  });
  it("should not modify the activity list when not loading", () => {
    const listElement = document.createElement("ul");
    const existingItem = document.createElement("li");
    existingItem.textContent = "Existing activity";
    listElement.appendChild(existingItem);
    renderRecentActivitiesLoadingState(false, listElement);
    expect(listElement.children.length).toBe(1);
    expect(listElement.children[0].textContent).toBe("Existing activity");
  });
  it("should add refreshing class when refreshing", () => {
    const listElement = document.createElement("ul");
    const item = document.createElement("li");
    listElement.appendChild(item);
    renderRecentActivitiesRefreshState(true, listElement);
    expect(listElement.classList.contains("is-refreshing")).toBe(true);
  });
  it("should remove refreshing class when not refreshing", () => {
    const listElement = document.createElement("ul");
    listElement.classList.add("is-refreshing");
    const item = document.createElement("li");
    listElement.appendChild(item);
    renderRecentActivitiesRefreshState(false, listElement);
    expect(listElement.classList.contains("is-refreshing")).toBe(false);
  });
});
