/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  renderBoardStatusMessage,
  setRefreshing,
  renderProjectOptions,
  createTaskCardElement,
  renderBoardGroups,
  renderBoardEmptyState,
  renderBoardSkeletonState,
  toggleProject,
  toggleTask,
  toggleTaskEdit,
  resetBoardUiState,
} from "../../js/board/board-renderer.js";

// Reset module-level UI state between every test so accordion/edit
// state never leaks from one test into the next.
beforeEach(() => resetBoardUiState());

describe("renderBoardStatusMessage", () => {
  let statusElement;

  beforeEach(() => {
    statusElement = document.createElement("p");
  });

  it("should render the message for each known status", () => {
    const expected = {
      idle: "Board is ready.",
      loading: "Loading board...",
      success: "Board loaded.",
      error: "Failed to load board. Please try again.",
    };

    for (const [status, message] of Object.entries(expected)) {
      renderBoardStatusMessage(statusElement, status);
      expect(statusElement.textContent).toBe(message);
    }
  });

  it("should do nothing when the status element is not provided", () => {
    expect(() => renderBoardStatusMessage(null, "loading")).not.toThrow();
  });
});

describe("setRefreshing", () => {
  it("should disable the refresh button while refreshing", () => {
    const button = document.createElement("button");
    setRefreshing(button, true);
    expect(button.disabled).toBe(true);
    setRefreshing(button, false);
    expect(button.disabled).toBe(false);
  });
});

describe("renderProjectOptions", () => {
  it("should keep the placeholder and append one option per project", () => {
    const select = document.createElement("select");
    select.appendChild(new Option("Select a project", ""));

    renderProjectOptions(select, [
      { id: 1, name: "Alpha" },
      { id: 2, name: "Beta" },
    ]);

    expect(select.options.length).toBe(3);
    expect(select.options[1].value).toBe("1");
    expect(select.options[1].textContent).toBe("Alpha");
    expect(select.options[2].textContent).toBe("Beta");
  });

  it("should clear previous project options on re-render", () => {
    const select = document.createElement("select");
    select.appendChild(new Option("Select a project", ""));

    renderProjectOptions(select, [{ id: 1, name: "Alpha" }]);
    renderProjectOptions(select, [{ id: 2, name: "Beta" }]);

    expect(select.options.length).toBe(2);
    expect(select.options[1].textContent).toBe("Beta");
  });
});

describe("createTaskCardElement", () => {
  it("should render an active task with a complete action", () => {
    const card = createTaskCardElement({ id: 7, title: "Fix bug", status: "active" });

    expect(card.getAttribute("data-task-id")).toBe("7");
    expect(card.querySelector(".board-task-title").value).toBe("Fix bug");
    expect(card.classList.contains("is-completed")).toBe(false);
    expect(card.querySelector("[data-action='complete']")).not.toBeNull();
  });

  it("should render a completed task with a reopen action", () => {
    const card = createTaskCardElement({ id: 8, title: "Done thing", status: "completed" });

    expect(card.classList.contains("is-completed")).toBe(true);
    expect(card.querySelector("[data-action='reopen']")).not.toBeNull();
    expect(card.querySelector("[data-action='complete']")).toBeNull();
  });

  it("should always render a delete action", () => {
    const card = createTaskCardElement({ id: 9, title: "X", status: "active" });
    expect(card.querySelector("[data-action='delete']")).not.toBeNull();
  });

    it("should render editable title and description inputs with a toggle-edit button", () => {
    const card = createTaskCardElement({
      id: 10,
      title: "Fix bug",
      description: "Details here",
      status: "active",
    });

    expect(card.querySelector(".board-task-title").value).toBe("Fix bug");
    expect(card.querySelector(".board-task-description").value).toBe("Details here");
    expect(card.querySelector("[data-action='toggle-edit']")).not.toBeNull();
    expect(card.querySelector("[data-action='toggle-task']")).not.toBeNull();
  });

  it("should render a priority select with three options", () => {
    const card = createTaskCardElement({
      id: 11,
      title: "Set priority",
      status: "active",
      priority: "high",
    });

    const select = card.querySelector(".board-task-priority");
    expect(select).not.toBeNull();
    expect(select.options.length).toBe(3);
    expect(select.options[2].selected).toBe(true);
  });

  it("should render a due-date display and hidden input", () => {
    const card = createTaskCardElement({
      id: 12,
      title: "Dated task",
      status: "active",
      dueDate: "2026-08-15T10:00:00Z",
    });

    const value = card.querySelector(".task-due-date-value");
    const input = card.querySelector(".board-task-due-date--input");
    expect(value.textContent).not.toBe("No due date");
    expect(input).not.toBeNull();
  });
});

describe("renderBoardSkeletonState", () => {
  it("should render skeleton cards while loading", () => {
    const container = document.createElement("div");
    renderBoardSkeletonState(container, 3);

    const skeletons = container.querySelectorAll(".task-card--skeleton");
    expect(skeletons.length).toBe(3);
    expect(container.querySelector(".board-skeleton")).not.toBeNull();
    // Each skeleton card has shimmer elements.
    expect(container.querySelectorAll(".skeleton").length).toBeGreaterThan(0);
  });

  it("should default to 6 skeleton cards when count is omitted", () => {
    const container = document.createElement("div");
    renderBoardSkeletonState(container);
    expect(container.querySelectorAll(".task-card--skeleton").length).toBe(6);
  });

  it("should do nothing when the container is null", () => {
    expect(() => renderBoardSkeletonState(null)).not.toThrow();
  });
});

describe("accordion toggles", () => {
  it("should expand / collapse a project group", () => {
    const container = document.createElement("div");
    renderBoardGroups(
      [{ project: { id: 1, name: "Alpha" }, tasks: [{ id: 1, title: "A", status: "active" }] }],
      container,
    );

    const group = container.querySelector(".board-group");
    const body = group.querySelector(".project-group__body");
    expect(group.classList.contains("is-open")).toBe(false);

    toggleProject("1", group);
    expect(group.classList.contains("is-open")).toBe(true);

    toggleProject("1", group);
    expect(group.classList.contains("is-open")).toBe(false);
  });

      it("should expand / collapse a task card body", () => {
    const card = createTaskCardElement({ id: 5, title: "Collapsible", status: "active" });
    document.body.appendChild(card);

    expect(card.classList.contains("is-open")).toBe(false);

    toggleTask(5, card);
    expect(card.classList.contains("is-open")).toBe(true);

    toggleTask(5, card);
    expect(card.classList.contains("is-open")).toBe(false);
    document.body.removeChild(card);
  });

  it("should toggle edit mode on a task card", () => {
    const card = createTaskCardElement({ id: 6, title: "Editable", status: "active" });
    document.body.appendChild(card);

    // In view mode the title input is hidden.
    expect(card.classList.contains("is-editing")).toBe(false);

    const entered = toggleTaskEdit(6, card);
    expect(entered).toBe(true);
    expect(card.classList.contains("is-editing")).toBe(true);

    // Toggle back to view mode.
    const exited = toggleTaskEdit(6, card);
    expect(exited).toBe(false);
    expect(card.classList.contains("is-editing")).toBe(false);
    document.body.removeChild(card);
  });

  it("should persist open state across re-renders", () => {
    const container = document.createElement("div");
    renderBoardGroups(
      [{ project: { id: 1, name: "Alpha" }, tasks: [{ id: 1, title: "A", status: "active" }] }],
      container,
    );

    const group = container.querySelector(".board-group");
    toggleProject("1", group);

    // Re-render into a fresh container.
    const fresh = document.createElement("div");
    renderBoardGroups(
      [{ project: { id: 1, name: "Alpha" }, tasks: [{ id: 1, title: "A", status: "active" }] }],
      fresh,
    );

    const freshGroup = fresh.querySelector(".board-group");
    expect(freshGroup.classList.contains("is-open")).toBe(true);
  });
});

describe("renderBoardGroups", () => {
  it("should render one section per project group with its tasks", () => {
    const container = document.createElement("div");

    renderBoardGroups(
      [
        {
          project: { id: 1, name: "Alpha" },
          tasks: [{ id: 7, title: "Fix bug", status: "active", projectId: 1 }],
        },
        {
          project: null,
          tasks: [{ id: 8, title: "Orphan", status: "active", projectId: null }],
        },
      ],
      container,
    );

    const sections = container.querySelectorAll("section.board-group");
    expect(sections.length).toBe(2);
    expect(sections[0].querySelector("h2").textContent).toBe("Alpha");
    expect(sections[1].querySelector("h2").textContent).toBe("Unassigned");
    expect(sections[0].querySelectorAll("[data-task-id]").length).toBe(1);
  });

  it("should render nothing for an empty group list", () => {
    const container = document.createElement("div");
    renderBoardGroups([], container);
    expect(container.children.length).toBe(0);
  });
});

describe("renderBoardEmptyState", () => {
  it("should show the empty state only when the board is empty", () => {
    const emptyState = document.createElement("div");
    renderBoardEmptyState(emptyState, true);
    expect(emptyState.hidden).toBe(false);
    renderBoardEmptyState(emptyState, false);
    expect(emptyState.hidden).toBe(true);
  });
});
