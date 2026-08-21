import { describe, expect, it } from "vitest";
import { getDashboardRecentActivities } from "../../js/transformation/activity-transformer.js";
describe("getDashboardRecentActivities", () => {
  it("should return activities sorted from newest to oldest and transform the activity into the dashboard format", () => {
    const data = getDashboardRecentActivities([
      {
        id: 1,
        type: "project_created",
        entityType: "project",
        entityId: 1,
        createdAt: "2026-08-19T08:15:00Z",
      },
      {
        id: 2,
        type: "task_created",
        entityType: "task",
        entityId: 2,
        createdAt: "2026-08-19T08:30:00Z",
      },
      {
        id: 3,
        type: "task_updated",
        entityType: "task",
        entityId: 2,
        createdAt: "2026-08-19T09:00:00Z",
      },
      {
        id: 4,
        type: "note_created",
        entityType: "note",
        entityId: 1,
        createdAt: "2026-08-19T10:45:00Z",
      },
      {
        id: 5,
        type: "project_updated",
        entityType: "project",
        entityId: 1,
        createdAt: "2026-08-19T11:15:00Z",
      },
      {
        id: 6,
        type: "task_completed",
        entityType: "task",
        entityId: 2,
        createdAt: "2026-08-19T12:30:00Z",
      },
      {
        id: 7,
        type: "note_updated",
        entityType: "note",
        entityId: 1,
        createdAt: "2026-08-19T13:00:00Z",
      },
      {
        id: 8,
        type: "task_created",
        entityType: "task",
        entityId: 3,
        createdAt: "2026-08-19T14:20:00Z",
      },
      {
        id: 9,
        type: "task_updated",
        entityType: "task",
        entityId: 3,
        createdAt: "2026-08-19T15:05:00Z",
      },
      {
        id: 10,
        type: "project_updated",
        entityType: "project",
        entityId: 2,
        createdAt: "2026-08-19T16:40:00Z",
      },
    ]);
    expect(data).toEqual([
      {
        id: 10,
        message: "Project updated",
        entityType: "project",
        entityId: 2,
        createdAt: "2026-08-19T16:40:00Z",
      },
      {
        id: 9,
        message: "Task updated",
        entityType: "task",
        entityId: 3,
        createdAt: "2026-08-19T15:05:00Z",
      },
      {
        id: 8,
        message: "Task created",
        entityType: "task",
        entityId: 3,
        createdAt: "2026-08-19T14:20:00Z",
      },
      {
        id: 7,
        message: "Note updated",
        entityType: "note",
        entityId: 1,
        createdAt: "2026-08-19T13:00:00Z",
      },
      {
        id: 6,
        message: "Task completed",
        entityType: "task",
        entityId: 2,
        createdAt: "2026-08-19T12:30:00Z",
      },
    ]);
  });
  it("should return all activities when fewer than 5 activities are provided", () => {
    const data = getDashboardRecentActivities([
      {
        id: 1,
        type: "project_created",
        entityType: "project",
        entityId: 1,
        createdAt: "2026-08-19T08:15:00Z",
      },
      {
        id: 2,
        type: "task_created",
        entityType: "task",
        entityId: 2,
        createdAt: "2026-08-19T08:30:00Z",
      },
      {
        id: 3,
        type: "task_updated",
        entityType: "task",
        entityId: 2,
        createdAt: "2026-08-19T09:00:00Z",
      },
    ]);
    expect(data).toEqual([
      {
        id: 3,
        message: "Task updated",
        entityType: "task",
        entityId: 2,
        createdAt: "2026-08-19T09:00:00Z",
      },
      {
        id: 2,
        message: "Task created",
        entityType: "task",
        entityId: 2,
        createdAt: "2026-08-19T08:30:00Z",
      },
      {
        id: 1,
        message: "Project created",
        entityType: "project",
        entityId: 1,
        createdAt: "2026-08-19T08:15:00Z",
      },
    ]);
  });
  it("should not mutate the original activities array", () => {
    const activities = [
      {
        id: 1,
        type: "project_created",
        entityType: "project",
        entityId: 1,
        createdAt: "2026-08-19T08:15:00Z",
      },
      {
        id: 2,
        type: "task_created",
        entityType: "task",
        entityId: 2,
        createdAt: "2026-08-19T08:30:00Z",
      },
      {
        id: 3,
        type: "task_updated",
        entityType: "task",
        entityId: 2,
        createdAt: "2026-08-19T09:00:00Z",
      },
    ];
    const originalActivities = [...activities];
    getDashboardRecentActivities(activities);

    expect(activities).toEqual(originalActivities);
  });
});
