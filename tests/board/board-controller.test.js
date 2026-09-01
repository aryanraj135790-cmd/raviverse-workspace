/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetBoardData, mockCreateTask, mockDeleteTask, mockCompleteTask, mockReopenTask, mockUpdateTask, mockShowToast } =
  vi.hoisted(() => ({
    mockGetBoardData: vi.fn(),
    mockCreateTask: vi.fn(),
    mockDeleteTask: vi.fn(),
    mockCompleteTask: vi.fn(),
    mockReopenTask: vi.fn(),
    mockUpdateTask: vi.fn(),
    mockShowToast: vi.fn(),
  }));

vi.mock("../../js/ui/toast.js", () => ({ showToast: mockShowToast }));
vi.mock("../../js/board/board-data.js", () => ({ getBoardData: mockGetBoardData }));
vi.mock("../../js/supabase/task-writes.js", () => ({
  createTask: mockCreateTask,
  deleteTask: mockDeleteTask,
  completeTask: mockCompleteTask,
  reopenTask: mockReopenTask,
  updateTask: mockUpdateTask,
}));

import {
  initBoard,
  destroyBoard,
  refreshBoard,
} from "../../js/board/board-controller.js";

const boardData = {
  projects: [{ id: 1, name: "Alpha" }],
  tasks: [{ id: 10, title: "Existing", status: "active", projectId: 1, completedAt: null }],
  groups: [
    {
      project: { id: 1, name: "Alpha" },
      tasks: [{ id: 10, title: "Existing", status: "active", completedAt: null }],
    },
  ],
};

beforeEach(() => {
  document.body.innerHTML = '<div id="app-view"></div>';
  vi.clearAllMocks();
  destroyBoard();
  mockGetBoardData.mockResolvedValue(boardData);
});

async function mountBoard() {
  await initBoard();
}

describe("board controller — lifecycle", () => {
  it("should mount the view, load data, and reach success state", async () => {
    await mountBoard();

    const status = document.querySelector("#board-status");
    expect(status).not.toBeNull();
    expect(status.textContent).toBe("Board loaded.");
  });

  it("should show the error state when loading fails", async () => {
    mockGetBoardData.mockRejectedValue(new Error("Failed to load board data"));

    await initBoard();

    const status = document.querySelector("#board-status");
    expect(status.textContent).toBe("Failed to load board. Please try again.");
  });

  it("should tear down the view on destroy (router contract)", async () => {
    await mountBoard();
    destroyBoard();
    expect(document.querySelector("#app-view section")).toBeNull();
  });

  it("should refetch data on refresh", async () => {
    await mountBoard();
    mockGetBoardData.mockClear();
    await refreshBoard();
    expect(mockGetBoardData).toHaveBeenCalledTimes(1);
  });
});

describe("board controller — optimistic create", () => {
  it("should create a task, show success toast, and confirm with the real row", async () => {
    await mountBoard();
    mockCreateTask.mockResolvedValue({ id: 42, project_id: 1, title: "New task", status: "active", completed_at: null });

    const form = document.querySelector("#board-create-task-form");
    document.querySelector("#board-task-title").value = "New task";
    document.querySelector("#board-task-project").value = "1";
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

    await vi.waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("Task created.", "success"));
    expect(mockCreateTask).toHaveBeenCalledWith({ title: "New task", project_id: 1 });
  });

  it("should roll back and show an error toast when the DB rejects", async () => {
    await mountBoard();
    mockCreateTask.mockRejectedValue(new Error("Failed to create task"));

    const form = document.querySelector("#board-create-task-form");
    document.querySelector("#board-task-title").value = "Doomed";
    document.querySelector("#board-task-project").value = "1";
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

    await vi.waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith("Failed to create task. Please try again.", "error"),
    );
  });

  it("should refuse to submit without a project selected", async () => {
    await mountBoard();

    const form = document.querySelector("#board-create-task-form");
    document.querySelector("#board-task-title").value = "No project";
    document.querySelector("#board-task-project").value = "";
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

    expect(mockShowToast).toHaveBeenCalledWith("Please select a project.", "error");
    expect(mockCreateTask).not.toHaveBeenCalled();
  });
});

describe("board controller — task actions (event delegation)", () => {
  async function mountAndClick(action, { mock, result } = {}) {
    await mountBoard();
    if (mock) mock.mockResolvedValue(result);

    const groups = document.querySelector("#board-groups");
    groups.innerHTML = `
      <ul data-task-id="10">
        <span class="board-task-title">Existing</span>
        <button data-action="${action}">x</button>
      </ul>`;

    groups.querySelector("button").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    // Only wait when a mutation mock is expected; the unknown-action case
    // warns synchronously and intentionally calls no mutation/toast.
    if (mock) {
      await vi.waitFor(() => expect(mock).toHaveBeenCalled());
    }
  }

  it("should complete a task via the delegated click handler", async () => {
    await mountAndClick("complete", {
      mock: mockCompleteTask,
      result: { id: 10, project_id: 1, title: "Existing", status: "completed", completed_at: "now" },
    });
    expect(mockCompleteTask).toHaveBeenCalledWith(10);
    expect(mockShowToast).toHaveBeenCalledWith("Task completed.", "success");
  });

  it("should delete a task via the delegated click handler", async () => {
    await mountAndClick("delete", { mock: mockDeleteTask });
    expect(mockDeleteTask).toHaveBeenCalledWith(10);
    expect(mockShowToast).toHaveBeenCalledWith("Task deleted.", "success");
  });

  it("should warn on an unknown action without calling any mutation", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await mountAndClick("explode");
    expect(mockCompleteTask).not.toHaveBeenCalled();
    expect(mockDeleteTask).not.toHaveBeenCalled();
        expect(warn).toHaveBeenCalledWith(expect.stringContaining("Unknown board task action"));
    warn.mockRestore();
  });
});

describe("board controller — accordion interactions", () => {
  it("should toggle a project group accordion on trigger click", async () => {
    await mountBoard();

    const group = document.querySelector(".board-group");
    const body = group.querySelector(".project-group__body");

    // First project auto-expanded on first load.
    expect(group.classList.contains("is-open")).toBe(true);

    // Click trigger → collapse.
    group
      .querySelector(".project-group__trigger")
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(group.classList.contains("is-open")).toBe(false);

    // Click again → expand.
    group
      .querySelector(".project-group__trigger")
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(group.classList.contains("is-open")).toBe(true);
  });

  it("should toggle a task card accordion on trigger click", async () => {
    await mountBoard();

    // Card starts collapsed (not the first-load auto-expand target).
    const card = document.querySelector("[data-task-id='10']");
    const body = card.querySelector(".task-card__body");
    expect(card.classList.contains("is-open")).toBe(false);

    card
      .querySelector(".task-card__trigger")
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(card.classList.contains("is-open")).toBe(true);
  });

  it("should toggle edit mode on edit-button click", async () => {
    await mountBoard();

    const card = document.querySelector("[data-task-id='10']");
    const editBtn = card.querySelector("[data-action='toggle-edit']");

    editBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(card.classList.contains("is-editing")).toBe(true);

    editBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(card.classList.contains("is-editing")).toBe(false);
  });
});

describe("board controller — priority direct edit", () => {
  it("should call updateTask when priority select changes (no edit mode needed)", async () => {
    mockUpdateTask.mockResolvedValue({ id: 10, priority: "high" });
    await mountBoard();

    const card = document.querySelector("[data-task-id='10']");
    const select = card.querySelector(".board-task-priority");

    select.value = "high";
    select.dispatchEvent(new Event("change", { bubbles: true }));

    await vi.waitFor(() =>
      expect(mockUpdateTask).toHaveBeenCalledWith(10, { priority: "high" }),
    );
    expect(mockShowToast).toHaveBeenCalledWith("Priority updated.", "success");
  });
});

describe("board controller — edit mode field save", () => {
  it("should call updateTask when the title input changes while editing", async () => {
    mockUpdateTask.mockResolvedValue({ id: 10, title: "Renamed" });
    await mountBoard();

    const card = document.querySelector("[data-task-id='10']");
    // Enter edit mode.
    card
      .querySelector("[data-action='toggle-edit']")
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));

    const titleInput = card.querySelector(".board-task-title");
    titleInput.value = "Renamed";
    titleInput.dispatchEvent(new Event("change", { bubbles: true }));

    await vi.waitFor(() =>
      expect(mockUpdateTask).toHaveBeenCalledWith(10, { title: "Renamed" }),
    );
  });
});
