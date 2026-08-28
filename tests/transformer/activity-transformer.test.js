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
        entityName: "Build authentication",
        createdAt: "2026-08-19T12:30:00Z",
      },
      {
        id: 7,
        type: "note_updated",
        entityType: "note",
        entityId: 1,
        entityName: "JWT architecture",
        createdAt: "2026-08-19T13:00:00Z",
      },
      {
        id: 8,
        type: "task_created",
        entityType: "task",
        entityId: 3,
        entityName: "Add refresh-token rotation",
        createdAt: "2026-08-19T14:20:00Z",
      },
      {
        id: 9,
        type: "task_updated",
        entityType: "task",
        entityId: 3,
        entityName: "Fix login validation",
        createdAt: "2026-08-19T15:05:00Z",
      },
      {
        id: 10,
        type: "project_updated",
        entityType: "project",
        entityId: 2,
        entityName: "RaviVerse API",
        createdAt: "2026-08-19T16:40:00Z",
      },
    ]);
    expect(data).toEqual([
      {
        id: 10,
        type: "project_updated",
        message: "Project updated",
        entityType: "project",
        entityId: 2,
        entityName: "RaviVerse API",
        deprecated: false,
        createdAt: "2026-08-19T16:40:00Z",
      },
      {
        id: 9,
        type: "task_updated",
        message: "Task updated",
        entityType: "task",
        entityId: 3,
        entityName: "Fix login validation",
        deprecated: false,
        createdAt: "2026-08-19T15:05:00Z",
      },
      {
        id: 8,
        type: "task_created",
        message: "Task created",
        entityType: "task",
        entityId: 3,
        entityName: "Add refresh-token rotation",
        deprecated: false,
        createdAt: "2026-08-19T14:20:00Z",
      },
      {
        id: 7,
        type: "note_updated",
        message: "Note updated",
        entityType: "note",
        entityId: 1,
        entityName: "JWT architecture",
        deprecated: false,
        createdAt: "2026-08-19T13:00:00Z",
      },
      {
        id: 6,
        type: "task_completed",
        message: "Task completed",
        entityType: "task",
        entityId: 2,
        entityName: "Build authentication",
        deprecated: false,
        createdAt: "2026-08-19T12:30:00Z",
      },
    ]);
  });
  it("should preserve entityName and deprecated for tombstoned activities and default deprecated to false when missing", () => {
    const data = getDashboardRecentActivities([
      {
        id: 1,
        type: "project_created",
        entityType: "project",
        entityId: 1,
        entityName: "Deleted Project",
        deprecated: true,
        createdAt: "2026-08-19T08:15:00Z",
      },
      {
        id: 2,
        type: "note_created",
        entityType: "note",
        entityId: 2,
        entityName: "PostgreSQL indexing",
        createdAt: "2026-08-19T08:30:00Z",
      },
    ]);
    expect(data).toEqual([
      {
        id: 2,
        type: "note_created",
        message: "Note created",
        entityType: "note",
        entityId: 2,
        entityName: "PostgreSQL indexing",
        deprecated: false,
        createdAt: "2026-08-19T08:30:00Z",
      },
      {
        id: 1,
        type: "project_created",
        message: "Project created",
        entityType: "project",
        entityId: 1,
        entityName: "Deleted Project",
        deprecated: true,
        createdAt: "2026-08-19T08:15:00Z",
      },
    ]);
  });
  it("should fall back to the raw type as message for unknown activity types", () => {
    const data = getDashboardRecentActivities([
      {
        id: 1,
        type: "mystery_event",
        entityType: "project",
        entityId: 1,
        entityName: "DevFlow AI",
        createdAt: "2026-08-19T08:15:00Z",
      },
    ]);
    expect(data).toEqual([
      {
        id: 1,
        type: "mystery_event",
        message: "mystery_event",
        entityType: "project",
        entityId: 1,
        entityName: "DevFlow AI",
        deprecated: false,
        createdAt: "2026-08-19T08:15:00Z",
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
        type: "task_updated",
        message: "Task updated",
        entityType: "task",
        entityId: 2,
        deprecated: false,
        createdAt: "2026-08-19T09:00:00Z",
      },
      {
        id: 2,
        type: "task_created",
        message: "Task created",
        entityType: "task",
        entityId: 2,
        deprecated: false,
        createdAt: "2026-08-19T08:30:00Z",
      },
      {
        id: 1,
        type: "project_created",
        message: "Project created",
        entityType: "project",
        entityId: 1,
        deprecated: false,
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
