/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}));

vi.mock("../../js/supabase/client.js", () => ({
  supabase: {
    from: mockFrom,
  },
}));

import { getTaskData } from "../../js/tasks/task-data.js";

describe("getTaskData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function createQueryMock(response) {
    return {
      select: vi.fn().mockReturnValue({
        is: vi.fn().mockResolvedValue(response),
      }),
    };
  }

  it("should fetch, map, and group projects and tasks successfully", async () => {
    const rawProjects = [
      {
        id: 1,
        name: "Project Alpha",
        slug: "project-alpha",
        description: "Alpha desc",
        status: "active",
        created_at: "2026-01-01T00:00:00Z",
      },
      {
        id: 2,
        name: "Project Beta",
        slug: "project-beta",
        description: null,
        status: "active",
        created_at: "2026-01-02T00:00:00Z",
      },
    ];

    const rawTasks = [
      {
        id: 101,
        title: "Task 1",
        description: "Desc 1",
        status: "todo",
        project_id: 1,
        priority: "high",
        due_date: "2026-09-10",
        created_at: "2026-01-03T00:00:00Z",
        completed_at: null,
      },
      {
        id: 102,
        title: "Task 2",
        description: "Desc 2",
        status: "completed",
        project_id: 1,
        priority: "low",
        due_date: null,
        created_at: "2026-01-04T00:00:00Z",
        completed_at: "2026-01-05T00:00:00Z",
      },
    ];

    mockFrom.mockImplementation((table) => {
      if (table === "projects") {
        return createQueryMock({ data: rawProjects, error: null });
      }
      if (table === "tasks") {
        return createQueryMock({ data: rawTasks, error: null });
      }
    });

    const result = await getTaskData();

    expect(result.groupedData).toEqual([
      {
        id: 1,
        name: "Project Alpha",
        slug: "project-alpha",
        description: "Alpha desc",
        status: "active",
        createdAt: "2026-01-01T00:00:00Z",
        tasks: [
          {
            id: 101,
            title: "Task 1",
            description: "Desc 1",
            status: "todo",
            projectId: 1,
            priority: "high",
            dueDate: "2026-09-10",
            createdAt: "2026-01-03T00:00:00Z",
            completedAt: null,
          },
          {
            id: 102,
            title: "Task 2",
            description: "Desc 2",
            status: "completed",
            projectId: 1,
            priority: "low",
            dueDate: null,
            createdAt: "2026-01-04T00:00:00Z",
            completedAt: "2026-01-05T00:00:00Z",
          },
        ],
      },
      {
        id: 2,
        name: "Project Beta",
        slug: "project-beta",
        description: null,
        status: "active",
        createdAt: "2026-01-02T00:00:00Z",
        tasks: [],
      },
    ]);
  });

  it("should throw an error when fetching projects fails", async () => {
    mockFrom.mockImplementation((table) => {
      if (table === "projects") {
        return createQueryMock({
          data: null,
          error: { message: "Database connection failed" },
        });
      }
      if (table === "tasks") {
        return createQueryMock({ data: [], error: null });
      }
    });

    await expect(getTaskData()).rejects.toThrow(
      "Failed to fetch tasks resource [projects]: Database connection failed",
    );
  });

  it("should throw an error when fetching tasks fails", async () => {
    mockFrom.mockImplementation((table) => {
      if (table === "projects") {
        return createQueryMock({ data: [], error: null });
      }
      if (table === "tasks") {
        return createQueryMock({
          data: null,
          error: { message: "Permission denied" },
        });
      }
    });

    await expect(getTaskData()).rejects.toThrow(
      "Failed to fetch tasks resource [tasks]: Permission denied",
    );
  });

  it("should throw an error when a task references an unknown project_id", async () => {
    const rawProjects = [
      {
        id: 1,
        name: "Alpha",
        slug: "alpha",
        description: null,
        status: "active",
        created_at: "now",
      },
    ];
    const rawTasks = [
      {
        id: 99,
        title: "Orphan Task",
        description: null,
        status: "todo",
        project_id: 999,
        priority: "low",
        due_date: null,
        created_at: "now",
        completed_at: null,
      },
    ];

    mockFrom.mockImplementation((table) => {
      if (table === "projects") {
        return createQueryMock({ data: rawProjects, error: null });
      }
      if (table === "tasks") {
        return createQueryMock({ data: rawTasks, error: null });
      }
    });

    await expect(getTaskData()).rejects.toThrow(
      "Task 99 references unknown project_id 999",
    );
  });

  it("should handle empty data arrays gracefully", async () => {
    mockFrom.mockImplementation(() =>
      createQueryMock({ data: [], error: null }),
    );

    const result = await getTaskData();
    expect(result.groupedData).toEqual([]);
  });
});
