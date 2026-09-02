import { createStore } from "../store/create-store.js";
import {
  completeTask as completeTaskMutation,
  createTask,
  deleteTask as deleteTaskMutation,
  reopenTask as reopenTaskMutation,
  updateTask as updateTaskMutation,
} from "../supabase/task-writes.js";
import { getTaskData } from "./task-data.js";

const initialState = {
  tasksByProjectId: {},
  status: "idle",
  error: null,
};

export function createTaskStore() {
  const store = createStore(initialState);

  function findTask(state, taskId) {
    for (const [pId, tasks] of Object.entries(state.tasksByProjectId)) {
      const found = tasks.find((t) => t.id === taskId);
      if (found) {
        return { task: found, projectId: Number(pId) };
      }
    }
    return null;
  }

  return {
    getState: store.getState,
    subscribe: store.subscribe,

    // Load tasks and projects from Supabase
    async load() {
      store.setState((prevState) => ({
        ...prevState,
        status: "loading",
        error: null,
      }));

      try {
        const { groupedData } = await getTaskData();

        const tasksByProjectId = {};
        for (const project of groupedData) {
          tasksByProjectId[project.id] = project.tasks;
        }

        store.setState((prevState) => ({
          ...prevState,
          tasksByProjectId,
          status: "ready",
          error: null,
        }));
      } catch (error) {
        store.setState((prevState) => ({
          ...prevState,
          status: "error",
          error,
        }));
      }
    },

    // Add a new task with optimistic update
    async addTask(incomingTask) {
      const snapshot = store.getState();
      const tempId = `temp-${crypto.randomUUID()}`;
      const optimisticTask = { ...incomingTask, id: tempId };

      store.setState((state) => {
        const projectId = incomingTask.projectId;
        const existingTasks = state.tasksByProjectId[projectId] || [];

        return {
          ...state,
          tasksByProjectId: {
            ...state.tasksByProjectId,
            [projectId]: [...existingTasks, optimisticTask],
          },
        };
      });

      try {
        const savedTask = await createTask(incomingTask);

        store.setState((state) => {
          const projectId = incomingTask.projectId;
          const currentTasks = state.tasksByProjectId[projectId] || [];

          return {
            ...state,
            tasksByProjectId: {
              ...state.tasksByProjectId,
              [projectId]: currentTasks.map((t) =>
                t.id === tempId ? savedTask : t,
              ),
            },
          };
        });

        return savedTask;
      } catch (error) {
        store.setState((state) => ({
          ...snapshot,
          error,
        }));

        throw error;
      }
    },

    // Update an existing task
    async updateTask(taskId, updates) {
      const snapshot = store.getState();

      const found = findTask(snapshot, taskId);
      if (!found) {
        throw new Error(`Task with id ${taskId} not found`);
      }

      const sourceProjectId = found.projectId;
      const existingTask = found.task;
      const targetProjectId =
        updates.projectId !== undefined
          ? Number(updates.projectId)
          : sourceProjectId;
      const optimisticTask = { ...existingTask, ...updates };

      store.setState((state) => {
        const updatedByProject = { ...state.tasksByProjectId };

        if (sourceProjectId !== targetProjectId) {
          updatedByProject[sourceProjectId] = (
            updatedByProject[sourceProjectId] || []
          ).filter((t) => t.id !== taskId);
          updatedByProject[targetProjectId] = [
            ...(updatedByProject[targetProjectId] || []),
            optimisticTask,
          ];
        } else {
          updatedByProject[sourceProjectId] = (
            updatedByProject[sourceProjectId] || []
          ).map((t) => (t.id === taskId ? optimisticTask : t));
        }

        return { ...state, tasksByProjectId: updatedByProject };
      });

      try {
        const updatedTask = await updateTaskMutation(taskId, updates);

        store.setState((state) => {
          const updatedByProject = { ...state.tasksByProjectId };
          updatedByProject[targetProjectId] = (
            updatedByProject[targetProjectId] || []
          ).map((t) =>
            t.id === taskId ? { ...optimisticTask, ...updatedTask } : t,
          );

          return { ...state, tasksByProjectId: updatedByProject };
        });

        return updatedTask;
      } catch (error) {
        store.setState(() => ({
          ...snapshot,
          error,
        }));

        throw error;
      }
    },

    // Delete a task
    async deleteTask(taskId) {
      const snapshot = store.getState();

      const found = findTask(snapshot, taskId);
      if (!found) {
        throw new Error(`Task with id ${taskId} not found`);
      }

      const targetProjectId = found.projectId;

      store.setState((state) => {
        const currentTasks = state.tasksByProjectId[targetProjectId] || [];
        return {
          ...state,
          tasksByProjectId: {
            ...state.tasksByProjectId,
            [targetProjectId]: currentTasks.filter((t) => t.id !== taskId),
          },
        };
      });

      try {
        return await deleteTaskMutation(taskId);
      } catch (error) {
        store.setState(() => ({
          ...snapshot,
          error,
        }));

        throw error;
      }
    },

    // Complete a task with optimistic update
    async completeTask(taskId) {
      const snapshot = store.getState();

      const found = findTask(snapshot, taskId);
      if (!found) {
        throw new Error(`Task with id ${taskId} not found`);
      }

      const targetProjectId = found.projectId;
      const existingTask = found.task;

      const optimisticTask = {
        ...existingTask,
        status: "completed",
        isCompleted: true,
        completedAt: new Date().toISOString(),
      };

      store.setState((state) => {
        const currentTasks = state.tasksByProjectId[targetProjectId] || [];
        return {
          ...state,
          tasksByProjectId: {
            ...state.tasksByProjectId,
            [targetProjectId]: currentTasks.map((t) =>
              t.id === taskId ? optimisticTask : t,
            ),
          },
        };
      });

      try {
        const serverTask = await completeTaskMutation(taskId);

        store.setState((state) => {
          const currentTasks = state.tasksByProjectId[targetProjectId] || [];
          return {
            ...state,
            tasksByProjectId: {
              ...state.tasksByProjectId,
              [targetProjectId]: currentTasks.map((t) =>
                t.id === taskId ? { ...optimisticTask, ...serverTask } : t,
              ),
            },
          };
        });

        return serverTask;
      } catch (error) {
        store.setState(() => ({
          ...snapshot,
          error,
        }));

        throw error;
      }
    },

    // Reopen a completed task with optimistic update
    async reopenTask(taskId) {
      const snapshot = store.getState();

      const found = findTask(snapshot, taskId);
      if (!found) {
        throw new Error(`Task with id ${taskId} not found`);
      }

      const targetProjectId = found.projectId;
      const existingTask = found.task;

      const optimisticTask = {
        ...existingTask,
        status: "todo",
        isCompleted: false,
        completedAt: null,
      };

      store.setState((state) => {
        const currentTasks = state.tasksByProjectId[targetProjectId] || [];
        return {
          ...state,
          tasksByProjectId: {
            ...state.tasksByProjectId,
            [targetProjectId]: currentTasks.map((t) =>
              t.id === taskId ? optimisticTask : t,
            ),
          },
        };
      });

      try {
        const serverTask = await reopenTaskMutation(taskId);

        store.setState((state) => {
          const currentTasks = state.tasksByProjectId[targetProjectId] || [];
          return {
            ...state,
            tasksByProjectId: {
              ...state.tasksByProjectId,
              [targetProjectId]: currentTasks.map((t) =>
                t.id === taskId ? { ...optimisticTask, ...serverTask } : t,
              ),
            },
          };
        });

        return serverTask;
      } catch (error) {
        store.setState(() => ({
          ...snapshot,
          error,
        }));

        throw error;
      }
    },
  };
}
