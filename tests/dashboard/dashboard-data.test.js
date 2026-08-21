import { describe, expect, it } from "vitest";
import { calculateDashboardStats } from "../../js/dashboard/dashboard-data.js";

describe("calculateDashboardStats", () => {
  it("should calculate dashboard statistics from RaviVerse data", () => {
    const data = calculateDashboardStats({
      projects: [
        { id: 1, name: "DevFlow AI" },
        { id: 2, name: "RaviVerse Workspace" },
        { id: 3, name: "FlashDrop Pro" },
      ],
      tasks: [
        { id: 1, title: "Build dashboard", status: "completed" },
        { id: 2, title: "Implement search", status: "pending" },
        { id: 3, title: "Add authentication", status: "completed" },
        { id: 4, title: "Create settings page", status: "pending" },
      ],
      notes: [
        { id: 1, title: "Architecture ideas" },
        { id: 2, title: "API notes" },
      ],
    });
    expect(data).toEqual({
      projects: 3,
      tasks: 4,
      notes: 2,
      completedTasks: 2,
      pendingTasks: 2,
    });
  });
  it("A task with an unexpected status should not be counted as completed or pending", () => {
    const data = calculateDashboardStats({
      projects: [
        { id: 1, name: "DevFlow AI" },
        { id: 2, name: "RaviVerse Workspace" },
      ],
      tasks: [
        { id: 1, title: "Build dashboard", status: "completed" },
        { id: 2, title: "Implement search", status: "cancelled" },
        { id: 3, title: "Add authentication", status: "in-progress" },
        { id: 4, title: "Create settings page", status: "pending" },
      ],
      notes: [{ id: 1, title: "Architecture ideas" }],
    });
    expect(data).toEqual({
      projects: 2,
      tasks: 4,
      notes: 1,
      completedTasks: 1,
      pendingTasks: 1,
    });
  });
  it("should return zero task statistics when there are no tasks", () => {
    const data = calculateDashboardStats({
      projects: [
        { id: 1, name: "DevFlow AI" },
        { id: 2, name: "RaviVerse Workspace" },
      ],
      tasks: [],
      notes: [{ id: 1, title: "Architecture ideas" }],
    });
    expect(data).toEqual({
      projects: 2,
      tasks: 0,
      notes: 1,
      completedTasks: 0,
      pendingTasks: 0,
    });
  });
});
