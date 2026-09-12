/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, test, beforeEach } from "vitest";
import {
  formatDueDate,
  renderTaskCard,
  renderTasks,
} from "../../js/tasks/task-render.js";

function makeTask(overrides = {}) {
  return {
    id: 1,
    title: "Sample",
    description: "Desc",
    status: "todo", // "todo" | "in_progress" | "completed"
    projectId: 10,
    priority: "high", // "high" | "medium" | "low"
    dueDate: "2026-09-10",
    createdAt: "2026-09-01T00:00:00.000Z",
    completedAt: null,
    ...overrides,
  };
}

describe("renderTaskCard", () => {
  let container;
  beforeEach(() => {
    container = document.createElement("div");
  });

  it("renders a .task-card element", () => {
    const card = renderTaskCard(makeTask(), "MyProject");
    expect(card.className).toBe("task-card");
  });

  it("renders the title", () => {
    const card = renderTaskCard(
      makeTask({ title: "Hello world" }),
      "MyProject",
    );
    expect(card.querySelector(".task-card-title")?.textContent).toBe(
      "Hello world",
    );
  });
  it("renders an unchecked checkbox for todo", () => {
    const card = renderTaskCard(makeTask({ status: "todo" }), "P");
    const cb = card.querySelector(".task-checkbox");
    expect(cb).not.toBeNull();
    expect(cb.checked).toBe(false);
  });

  it("renders a checked checkbox for completed", () => {
    const card = renderTaskCard(makeTask({ status: "completed" }), "P");
    expect(card.querySelector(".task-checkbox").checked).toBe(true);
  });

  it("renders a pulsing dot for in_progress", () => {
    const card = renderTaskCard(makeTask({ status: "in_progress" }), "P");
    const dot = card.querySelector(".task-status-dot");
    expect(dot).not.toBeNull();
    expect(dot.getAttribute("data-action")).toBe("toggle-status");
  });
  it("renders description when present", () => {
    const card = renderTaskCard(makeTask({ description: "Fix the bug" }), "P");
    expect(card.querySelector(".task-card-desc")?.textContent).toBe(
      "Fix the bug",
    );
  });

  it("hides description when empty", () => {
    const card = renderTaskCard(makeTask({ description: "" }), "P");
    expect(card.querySelector(".task-card-desc")).toBeNull();
  });

  it("renders kebab menu with edit and delete items", () => {
    const card = renderTaskCard(makeTask({ id: 7 }), "P");
    const menu = card.querySelector(".task-card-menu");
    expect(menu).not.toBeNull();
    expect(menu.hidden).toBe(true);
    expect(menu.querySelector('[data-action="edit"]')).not.toBeNull();
    expect(menu.querySelector('[data-action="delete"]')).not.toBeNull();
  });
  it("renders a project pill with the project name", () => {
    const card = renderTaskCard(makeTask(), "RaviVerse");
    expect(card.querySelector(".task-project-pill")?.textContent).toContain(
      "RaviVerse",
    );
  });

  it("formats a due date as month-day", () => {
    const card = renderTaskCard(makeTask({ dueDate: "2026-09-10" }), "P");
    expect(card.querySelector(".task-due")?.textContent).toMatch(
      /Sep 10|10 Sep/,
    );
  });

  it("renders priority with correct severity class", () => {
    const card = renderTaskCard(makeTask({ priority: "high" }), "P");
    expect(card.querySelector(".task-priority")?.className).toContain(
      "task-priority--high",
    );
  });
  it("adds completed class to the card root", () => {
    const card = renderTaskCard(makeTask({ status: "completed" }), "P");
    expect(card.className).toContain("task-card--completed");
  });
  test("renderTasks handles an empty array by rendering no children", () => {
    renderTasks(container, [], {});

    expect(container.children.length).toBe(0);
    expect(container.innerHTML).toBe("");
  });

  test("renderTasks clears existing DOM elements before rendering new tasks", () => {
    const staleChild = document.createElement("div");
    staleChild.className = "stale-task";
    container.appendChild(staleChild);

    expect(container.children.length).toBe(1);

    const mockTasks = [
      { id: "t1", title: "Task 1", projectId: "p1", status: "todo" },
      { id: "t2", title: "Task 2", projectId: "p1", status: "todo" },
    ];
    const projectNames = { p1: "Project Alpha" };

    renderTasks(container, mockTasks, projectNames);

    expect(container.querySelector(".stale-task")).toBeNull();
    expect(container.children.length).toBe(2);
  });

  test("formatDueDate safely handles falsy or invalid date values", () => {
    expect(formatDueDate(null)).toBe("");
    expect(formatDueDate(undefined)).toBe("");
    expect(formatDueDate("")).toBe("");
  });
});
