import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockGetTaskData,
  mockCreateTask,
  mockUpdateTask,
  mockDeleteTask,
  mockCompleteTask,
  mockReopenTask,
} = vi.hoisted(() => ({
  mockGetTaskData: vi.fn(),
  mockCreateTask: vi.fn(),
  mockUpdateTask: vi.fn(),
  mockDeleteTask: vi.fn(),
  mockCompleteTask: vi.fn(),
  mockReopenTask: vi.fn(),
}));

vi.mock("../../js/supabase/task-writes.js", () => ({
  createTask: mockCreateTask,
  updateTask: mockUpdateTask,
  deleteTask: mockDeleteTask,
  completeTask: mockCompleteTask,
  reopenTask: mockReopenTask,
}));

vi.mock("../../js/tasks/task-data.js", () => ({
  getTaskData: mockGetTaskData,
}));

import { createTaskStore } from "../../js/tasks/task-store.js";

describe("taskStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("load()", () => {
    it("should flatten grouped data into tasksByProjectId and set ready", async () => {
      mockGetTaskData.mockResolvedValue({
        groupedData: [
          { id: 1, name: "Project A", tasks: [{ id: 10, title: "Task 1" }] },
          { id: 2, name: "Project B", tasks: [] },
        ],
      });

      const store = createTaskStore();
      await store.load();

      const state = store.getState();
      expect(state.status).toBe("ready");
      expect(state.tasksByProjectId).toEqual({
        1: [{ id: 10, title: "Task 1" }],
        2: [],
      });
      expect(state.error).toBeNull();
    });

    it("should set status to loading during fetch", async () => {
      mockGetTaskData.mockResolvedValue({ groupedData: [] });
      const store = createTaskStore();

      const loadPromise = store.load();
      expect(store.getState().status).toBe("loading");
      await loadPromise;
    });

    it("should set error state when getTaskData fails", async () => {
      mockGetTaskData.mockRejectedValue(new Error("Failed to fetch"));

      const store = createTaskStore();
      await store.load();

      const state = store.getState();
      expect(state.status).toBe("error");
      expect(state.error).toBeInstanceOf(Error);
      expect(state.error.message).toBe("Failed to fetch");
    });
  });
  describe("addTask()", () => {
    it("should optimistically insert task with temp id and swap with real saved task on success", async () => {
      mockGetTaskData.mockResolvedValue({
        groupedData: [
          { id: 1, name: "Project A", tasks: [{ id: 10, title: "Task 1" }] },
        ],
      });

      const store = createTaskStore();
      await store.load();

      const savedTask = {
        id: 42,
        title: "New Task",
        projectId: 1,
        status: "todo",
      };

      let resolveCreate;
      mockCreateTask.mockReturnValue(
        new Promise((resolve) => {
          resolveCreate = () => resolve(savedTask);
        }),
      );

      const newTaskInput = { title: "New Task", projectId: 1 };
      const addTaskPromise = store.addTask(newTaskInput);

      let state = store.getState();
      const projectTasks = state.tasksByProjectId[1];
      expect(projectTasks).toHaveLength(2);

      const optimisticTask = projectTasks[1];
      expect(optimisticTask.title).toBe("New Task");
      expect(optimisticTask.id).toMatch(/^temp-/);

      resolveCreate();
      const result = await addTaskPromise;

      state = store.getState();
      expect(result).toEqual(savedTask);
      expect(state.tasksByProjectId[1]).toEqual([
        { id: 10, title: "Task 1" },
        savedTask,
      ]);
    });

    it("should rollback state and set error when createTask fails", async () => {
      mockGetTaskData.mockResolvedValue({
        groupedData: [
          { id: 1, name: "Project A", tasks: [{ id: 10, title: "Task 1" }] },
        ],
      });

      const store = createTaskStore();
      await store.load();

      mockCreateTask.mockRejectedValue(new Error("Database write error"));

      const newTaskInput = { title: "Doomed Task", projectId: 1 };

      await expect(store.addTask(newTaskInput)).rejects.toThrow(
        "Database write error",
      );

      const state = store.getState();
      expect(state.tasksByProjectId[1]).toEqual([{ id: 10, title: "Task 1" }]);
      expect(state.error).toBeInstanceOf(Error);
      expect(state.error.message).toBe("Database write error");
    });
  });
  describe("updateTask()", () => {
    it("should optimistically update task in-place without requiring projectId in updates", async () => {
      mockGetTaskData.mockResolvedValue({
        groupedData: [
          {
            id: 1,
            name: "Project A",
            tasks: [{ id: 10, title: "Original Title", priority: "low" }],
          },
        ],
      });

      const store = createTaskStore();
      await store.load();

      const dbResponse = { id: 10, title: "Updated Title", priority: "low" };
      let resolveUpdate;
      mockUpdateTask.mockReturnValue(
        new Promise((resolve) => {
          resolveUpdate = () => resolve(dbResponse);
        }),
      );

      const updatePromise = store.updateTask(10, { title: "Updated Title" });

      let state = store.getState();
      expect(state.tasksByProjectId[1][0].title).toBe("Updated Title");

      resolveUpdate();
      await updatePromise;

      state = store.getState();
      expect(state.tasksByProjectId[1][0]).toEqual(dbResponse);
    });

    it("should rollback state and throw when updateTask API call fails", async () => {
      mockGetTaskData.mockResolvedValue({
        groupedData: [
          {
            id: 1,
            name: "Project A",
            tasks: [{ id: 10, title: "Original Title" }],
          },
        ],
      });

      const store = createTaskStore();
      await store.load();

      mockUpdateTask.mockRejectedValue(new Error("Update failed"));

      await expect(
        store.updateTask(10, { title: "Doomed Renaming" }),
      ).rejects.toThrow("Update failed");

      const state = store.getState();
      expect(state.tasksByProjectId[1][0].title).toBe("Original Title");
      expect(state.error).toBeInstanceOf(Error);
      expect(state.error.message).toBe("Update failed");
    });
  });
  describe("deleteTask()", () => {
    it("should optimistically remove task and remain deleted on API success", async () => {
      mockGetTaskData.mockResolvedValue({
        groupedData: [
          {
            id: 1,
            name: "Project A",
            tasks: [
              { id: 10, title: "Task 10" },
              { id: 11, title: "Task 11" },
            ],
          },
        ],
      });

      const store = createTaskStore();
      await store.load();

      let resolveDelete;
      mockDeleteTask.mockReturnValue(
        new Promise((resolve) => {
          resolveDelete = resolve;
        }),
      );

      const deletePromise = store.deleteTask(10);

      let state = store.getState();
      expect(state.tasksByProjectId[1]).toEqual([{ id: 11, title: "Task 11" }]);

      resolveDelete();
      await deletePromise;

      state = store.getState();
      expect(state.tasksByProjectId[1]).toEqual([{ id: 11, title: "Task 11" }]);
    });

    it("should rollback state and throw when deleteTask API call fails", async () => {
      mockGetTaskData.mockResolvedValue({
        groupedData: [
          {
            id: 1,
            name: "Project A",
            tasks: [{ id: 10, title: "Doomed Task" }],
          },
        ],
      });

      const store = createTaskStore();
      await store.load();

      mockDeleteTask.mockRejectedValue(new Error("Delete rejected"));

      await expect(store.deleteTask(10)).rejects.toThrow("Delete rejected");

      const state = store.getState();
      expect(state.tasksByProjectId[1]).toEqual([
        { id: 10, title: "Doomed Task" },
      ]);
      expect(state.error).toBeInstanceOf(Error);
      expect(state.error.message).toBe("Delete rejected");
    });
  });
  describe("completeTask()", () => {
    it("should optimistically complete task and sync server result on success", async () => {
      mockGetTaskData.mockResolvedValue({
        groupedData: [
          {
            id: 1,
            name: "Project A",
            tasks: [
              {
                id: 10,
                title: "Task 10",
                status: "todo",
                isCompleted: false,
                completedAt: null,
              },
            ],
          },
        ],
      });

      const store = createTaskStore();
      await store.load();

      const serverResponse = {
        id: 10,
        title: "Task 10",
        status: "completed",
        isCompleted: true,
        completedAt: "2026-09-03T02:26:00.000Z",
      };

      let resolveComplete;
      mockCompleteTask.mockReturnValue(
        new Promise((resolve) => {
          resolveComplete = () => resolve(serverResponse);
        }),
      );

      const completePromise = store.completeTask(10);

      let state = store.getState();
      const optimisticTask = state.tasksByProjectId[1][0];
      expect(optimisticTask.status).toBe("completed");
      expect(optimisticTask.isCompleted).toBe(true);
      expect(optimisticTask.completedAt).toBeTruthy();

      resolveComplete();
      await completePromise;

      state = store.getState();
      expect(state.tasksByProjectId[1][0]).toEqual(serverResponse);
    });

    it("should restore snapshot and throw when completeTask API fails", async () => {
      mockGetTaskData.mockResolvedValue({
        groupedData: [
          {
            id: 1,
            name: "Project A",
            tasks: [
              {
                id: 10,
                title: "Task 10",
                status: "todo",
                isCompleted: false,
                completedAt: null,
              },
            ],
          },
        ],
      });

      const store = createTaskStore();
      await store.load();

      mockCompleteTask.mockRejectedValue(new Error("Server error"));

      await expect(store.completeTask(10)).rejects.toThrow("Server error");

      const state = store.getState();
      expect(state.tasksByProjectId[1][0].status).toBe("todo");
      expect(state.tasksByProjectId[1][0].isCompleted).toBe(false);
      expect(state.error).toBeInstanceOf(Error);
      expect(state.error.message).toBe("Server error");
    });
  });
  describe("reopenTask()", () => {
    it("should optimistically reopen task and sync server result on success", async () => {
      mockGetTaskData.mockResolvedValue({
        groupedData: [
          {
            id: 1,
            name: "Project A",
            tasks: [
              {
                id: 10,
                title: "Task 10",
                status: "completed",
                isCompleted: true,
                completedAt: "2026-09-01T12:00:00.000Z",
              },
            ],
          },
        ],
      });

      const store = createTaskStore();
      await store.load();

      const serverResponse = {
        id: 10,
        title: "Task 10",
        status: "todo",
        isCompleted: false,
        completedAt: null,
      };

      let resolveReopen;
      mockReopenTask.mockReturnValue(
        new Promise((resolve) => {
          resolveReopen = () => resolve(serverResponse);
        }),
      );

      const reopenPromise = store.reopenTask(10);

      let state = store.getState();
      const optimisticTask = state.tasksByProjectId[1][0];
      expect(optimisticTask.status).toBe("todo");
      expect(optimisticTask.isCompleted).toBe(false);
      expect(optimisticTask.completedAt).toBeNull();

      resolveReopen();
      await reopenPromise;

      state = store.getState();
      expect(state.tasksByProjectId[1][0]).toEqual(serverResponse);
    });

    it("should restore snapshot and throw when reopenTask API fails", async () => {
      mockGetTaskData.mockResolvedValue({
        groupedData: [
          {
            id: 1,
            name: "Project A",
            tasks: [
              {
                id: 10,
                title: "Task 10",
                status: "completed",
                isCompleted: true,
                completedAt: "2026-09-01T12:00:00.000Z",
              },
            ],
          },
        ],
      });

      const store = createTaskStore();
      await store.load();

      mockReopenTask.mockRejectedValue(new Error("Reopen failed"));

      await expect(store.reopenTask(10)).rejects.toThrow("Reopen failed");

      const state = store.getState();
      expect(state.tasksByProjectId[1][0].status).toBe("completed");
      expect(state.tasksByProjectId[1][0].isCompleted).toBe(true);
      expect(state.error).toBeInstanceOf(Error);
      expect(state.error.message).toBe("Reopen failed");
    });
  });
});
