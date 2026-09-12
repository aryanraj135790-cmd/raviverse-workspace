/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  destroyTaskController,
  initTaskController,
} from "../../js/tasks/task-controller.js";
import { createTaskStore } from "../../js/tasks/task-store.js";
import { renderTasks } from "../../js/tasks/task-render.js";

vi.mock("../../js/tasks/task-store.js", () => ({
  createTaskStore: vi.fn(),
}));
vi.mock("../../js/tasks/task-render.js", () => ({
  renderTasks: vi.fn(),
}));
vi.mock("../../js/ui/toast.js", () => ({
  showToast: vi.fn(),
}));

function flush(ms = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("task-controller", () => {
  let storeState;
  let subscribeCb;
  let mockStore;

  const seedState = () => ({
    tasksByProjectId: {
      1: [
        { id: 1, title: "Alpha", description: "first", status: "todo", projectId: 1, priority: "high" },
        { id: 2, title: "Beta", description: "second", status: "completed", projectId: 1, priority: "low" },
      ],
      2: [
        { id: 3, title: "Gamma", description: "third", status: "in_progress", projectId: 2, priority: "medium" },
      ],
    },
    projectNames: { 1: "RaviVerse", 2: "Side" },
    status: "ready",
    error: null,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    document.body.innerHTML = '<div id="app-view"></div>';
    storeState = seedState();
    mockStore = {
      getState: vi.fn(() => storeState),
      subscribe: vi.fn((cb) => {
        subscribeCb = cb;
      }),
      load: vi.fn().mockResolvedValue(undefined),
      addTask: vi.fn().mockResolvedValue({ id: 9 }),
      updateTask: vi.fn().mockResolvedValue({}),
      deleteTask: vi.fn().mockResolvedValue({}),
      completeTask: vi.fn().mockResolvedValue({}),
      reopenTask: vi.fn().mockResolvedValue({}),
    };
    createTaskStore.mockReturnValue(mockStore);
  });

  afterEach(() => {
    try {
      destroyTaskController();
    } catch {
      /* ignore */
    }
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  it("mounts view, subscribes, and loads data", () => {
    initTaskController();
    expect(document.querySelector("#app-view .task-app")).not.toBeNull();
    expect(createTaskStore).toHaveBeenCalledTimes(1);
    expect(mockStore.subscribe).toHaveBeenCalledTimes(1);
    expect(mockStore.load).toHaveBeenCalledTimes(1);
  });

  it("renders filtered tasks when store becomes ready", () => {
    initTaskController();
    subscribeCb(storeState);
    expect(renderTasks).toHaveBeenCalled();
    const [, tasksArg, namesArg] = renderTasks.mock.calls.at(-1);
    expect(tasksArg).toHaveLength(3);
    expect(namesArg).toEqual({ 1: "RaviVerse", 2: "Side" });
  });

  it("filters by active tab on tab click", () => {
    initTaskController();
    subscribeCb(storeState);
    renderTasks.mockClear();
    document.querySelector('[data-tab="todo"]').click();
    const [, tasksArg] = renderTasks.mock.calls.at(-1);
    expect(tasksArg.map((t) => t.id)).toEqual([1]);
  });

  it("debounces search input before re-rendering", async () => {
    initTaskController();
    subscribeCb(storeState);
    renderTasks.mockClear();
    const input = document.querySelector("[data-search-input]");
    input.value = "gam";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(renderTasks).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(350);
    const [, tasksArg] = renderTasks.mock.calls.at(-1);
    expect(tasksArg.map((t) => t.title)).toEqual(["Gamma"]);
  });

  it("completes a todo task on checkbox click", async () => {
    initTaskController();
    subscribeCb(storeState);
    renderTasks.mockImplementation((container) => {
      container.innerHTML =
        '<div class="task-card" data-task-id="1"><button class="task-checkbox" type="button">x</button></div>';
    });
    subscribeCb(storeState);
    document
      .querySelector(".task-checkbox")
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(mockStore.completeTask).toHaveBeenCalledWith(1);
  });

  it("disables submit during create to prevent double-submit, then re-enables", async () => {
    initTaskController();
    subscribeCb(storeState);
    let resolveAdd;
    mockStore.addTask.mockReturnValue(
      new Promise((resolve) => {
        resolveAdd = resolve;
      }),
    );
    const form = document.querySelector('[data-form="newTask"]');
    form.querySelector('[data-field="title"]').value = "New one";
    const submitBtn = document.querySelector(
      '[data-modal="newTask"] [type="submit"]',
    );
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    expect(mockStore.addTask).toHaveBeenCalledTimes(1);
    expect(submitBtn.disabled).toBe(true);
    resolveAdd({ id: 9 });
    await flush(0);
    await flush(0);
    expect(submitBtn.disabled).toBe(false);
  });

  it("destroy clears view and detaches listeners", () => {
    initTaskController();
    subscribeCb(storeState);
    const callsBefore = mockStore.completeTask.mock.calls.length;
    destroyTaskController();
    expect(document.querySelector("#app-view").childElementCount).toBe(0);
    document.body.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(mockStore.completeTask.mock.calls.length).toBe(callsBefore);
  });
});

