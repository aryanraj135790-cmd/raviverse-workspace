import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  getDashboardData,
  calculateDashboardStats,
} from "../../js/dashboard/dashboard-data.js";
import { fetchDashboardRawData } from "../../js/supabase/dashboard-queries.js";

vi.mock("../../js/supabase/dashboard-queries.js", () => ({
  fetchDashboardRawData: vi.fn(),
}));

describe("calculateDashboardStats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should calculate correct stats for valid task statuses", () => {
    const data = calculateDashboardStats({
      projects: [
        { id: 1, title: "DevFlow AI" },
        { id: 2, title: "RaviVerse Workspace" },
      ],
      tasks: [
        { id: 1, title: "Build dashboard", status: "completed" },
        { id: 2, title: "Implement search", status: "completed" },
        { id: 3, title: "Add authentication", status: "in_progress" },
        { id: 4, title: "Create settings page", status: "todo" },
      ],
      notes: [{ id: 1, title: "Architecture ideas" }],
    });

    expect(data).toEqual({
      projects: 2,
      tasks: 4,
      notes: 1,
      completedTasks: 2,
      pendingTasks: 2,
    });
  });

  it("A task with an unexpected status should not be counted as completed or pending", () => {
    const data = calculateDashboardStats({
      projects: [
        { id: 1, title: "DevFlow AI" },
        { id: 2, title: "RaviVerse Workspace" },
      ],
      tasks: [
        { id: 1, title: "Build dashboard", status: "completed" },
        { id: 2, title: "Implement search", status: "cancelled" },
        { id: 3, title: "Add authentication", status: "in_progress" },
        { id: 4, title: "Create settings page", status: "todo" },
      ],
      notes: [{ id: 1, title: "Architecture ideas" }],
    });

    expect(data).toEqual({
      projects: 2,
      tasks: 4,
      notes: 1,
      completedTasks: 1,
      pendingTasks: 2,
    });
  });

  it("should return zero task statistics when there are no tasks", () => {
    const data = calculateDashboardStats({
      projects: [
        { id: 1, title: "DevFlow AI" },
        { id: 2, title: "RaviVerse Workspace" },
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

describe("getDashboardData", () => {
  it("should fetch raw data, transform activities, and calculate aggregate stats", async () => {
    fetchDashboardRawData.mockResolvedValue({
      projects: [
        {
          id: 1,
          title: "P",
          description: null,
          status: "active",
          createdAt: "2026-01-01",
        },
      ],
      tasks: [
        {
          id: 1,
          projectId: 1,
          title: "T",
          status: "completed",
          completedAt: "2026-01-02",
        },
      ],
      notes: [],
      activities: [
        {
          id: 1,
          type: "task_completed",
          entityType: "task",
          entityId: 1,
          entityName: "T",
          deprecated: false,
          createdAt: "2026-01-02",
        },
      ],
    });

    const result = await getDashboardData();

    expect(fetchDashboardRawData).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      stats: {
        projects: 1,
        tasks: 1,
        notes: 0,
        completedTasks: 1,
        pendingTasks: 0,
      },
      recentActivities: [
        {
          id: 1,
          type: "task_completed",
          message: "Task completed",
          entityType: "task",
          entityId: 1,
          entityName: "T",
          deprecated: false,
          createdAt: "2026-01-02",
        },
      ],
    });
  });

  it("should treat empty data as success, not an error", async () => {
    fetchDashboardRawData.mockResolvedValue({
      projects: [],
      tasks: [],
      notes: [],
      activities: [],
    });

    const result = await getDashboardData();

    expect(result.stats).toEqual({
      projects: 0,
      tasks: 0,
      notes: 0,
      completedTasks: 0,
      pendingTasks: 0,
    });
    expect(result.recentActivities).toEqual([]);
  });
});
