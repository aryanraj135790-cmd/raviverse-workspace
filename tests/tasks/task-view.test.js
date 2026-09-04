/**
 * @vitest-environment jsdom
 */

import { createTaskView } from "../../js/tasks/task-view.js";
import { getTaskDom } from "../../js/tasks/task-dom.js";
import { describe, test, beforeEach, expect } from "vitest";

describe("Task View & DOM Contract", () => {
  let view;

  beforeEach(() => {
    view = createTaskView();
  });

  test('returns root element <main class="task-app"> not connected to document', () => {
    expect(view).toBeInstanceOf(HTMLElement);
    expect(view.tagName.toLowerCase()).toBe("main");
    expect(view.classList.contains("task-app")).toBe(true);
    expect(document.body.contains(view)).toBe(false);
  });

  test("contains all essential structural region classes", () => {
    const requiredRegions = [
      ".task-mobile-header",
      ".task-scroll",
      ".task-container",
      ".task-titlebar",
      ".task-tabs",
      ".task-toolbar",
      ".task-list",
      ".task-empty",
    ];

    requiredRegions.forEach((selector) => {
      expect(view.querySelector(selector)).not.toBeNull();
    });
  });

  test("resolves all single-element data-* hooks via getTaskDom(view)", () => {
    const dom = getTaskDom(view);

    expect(dom.mobileMenuBtn).not.toBeNull();
    expect(dom.newTaskBtn).not.toBeNull();
    expect(dom.searchInput).not.toBeNull();
    expect(dom.priorityFilter).not.toBeNull();
    expect(dom.projectFilter).not.toBeNull();
    expect(dom.sortSelect).not.toBeNull();
    expect(dom.taskList).not.toBeNull();
    expect(dom.noResults).not.toBeNull();
    expect(dom.clearFiltersBtn).not.toBeNull();
    expect(dom.deleteConfirmBtn).not.toBeNull();

    // Tab hooks
    expect(dom.tabs.all).not.toBeNull();
    expect(dom.tabs.todo).not.toBeNull();
    expect(dom.tabs.inprogress).not.toBeNull();
    expect(dom.tabs.completed).not.toBeNull();

    // Tab count hooks
    expect(dom.tabCounts.all).not.toBeNull();
    expect(dom.tabCounts.todo).not.toBeNull();
    expect(dom.tabCounts.inprogress).not.toBeNull();
    expect(dom.tabCounts.completed).not.toBeNull();

    // Modals & Forms
    expect(dom.modals.newTask).not.toBeNull();
    expect(dom.modals.editTask).not.toBeNull();
    expect(dom.modals.delete).not.toBeNull();

    expect(dom.forms.newTask).not.toBeNull();
    expect(dom.forms.editTask).not.toBeNull();

    // Button collections
    expect(dom.modalCloseBtns.length).toBeGreaterThan(0);
    expect(dom.modalCancelBtns.length).toBeGreaterThan(0);
    expect(dom.modalSubmitBtns.length).toBeGreaterThan(0);
  });

  // 4. Tabs
  test('renders 4 tabs, first tab is active, each showing a count badge of "0"', () => {
    const tabs = view.querySelectorAll(".task-tab");
    expect(tabs).toHaveLength(4);

    expect(tabs[0].classList.contains("task-tab--active")).toBe(true);
    expect(tabs[1].classList.contains("task-tab--active")).toBe(false);

    const countBadges = view.querySelectorAll(".task-tab-count");
    expect(countBadges).toHaveLength(4);

    countBadges.forEach((badge) => {
      expect(badge.textContent.trim()).toBe("0");
    });

    expect(countBadges[0].classList.contains("task-tab-count--active")).toBe(
      true,
    );
    expect(countBadges[1].classList.contains("task-tab-count--muted")).toBe(
      true,
    );
  });

  // 5. Title bar
  test('contains "Tasks" heading and "New Task" button', () => {
    const title = view.querySelector(".task-title");
    const newBtn = view.querySelector("[data-new-task-btn]");

    expect(title).not.toBeNull();
    expect(title.textContent).toBe("Tasks");

    expect(newBtn).not.toBeNull();
    expect(newBtn.textContent).toContain("New Task");
  });

  // 6. Toolbar
  test("toolbar contains search input and 3 select filters (priority, project, sort)", () => {
    const searchInput = view.querySelector(".task-toolbar [data-search-input]");
    const prioritySelect = view.querySelector(
      '.task-toolbar [data-filter="priority"]',
    );
    const projectSelect = view.querySelector(
      '.task-toolbar [data-filter="project"]',
    );
    const sortSelect = view.querySelector(".task-toolbar [data-sort]");

    expect(searchInput).not.toBeNull();
    expect(prioritySelect).not.toBeNull();
    expect(projectSelect).not.toBeNull();
    expect(sortSelect).not.toBeNull();
  });

  // 7. Empty state
  test("empty state exists and starts hidden", () => {
    const emptyState = view.querySelector("[data-no-results]");
    expect(emptyState).not.toBeNull();
    expect(emptyState.hasAttribute("hidden")).toBe(true);
  });

  // 8. Modals visibility
  test("renders 3 modals and all start hidden", () => {
    const newTaskModal = view.querySelector('[data-modal="newTask"]');
    const editTaskModal = view.querySelector('[data-modal="editTask"]');
    const deleteModal = view.querySelector('[data-modal="delete"]');

    expect(newTaskModal).not.toBeNull();
    expect(editTaskModal).not.toBeNull();
    expect(deleteModal).not.toBeNull();

    expect(newTaskModal.hasAttribute("hidden")).toBe(true);
    expect(editTaskModal.hasAttribute("hidden")).toBe(true);
    expect(deleteModal.hasAttribute("hidden")).toBe(true);
  });

  // 9. Modal content specs
  test("modal contents match specific structure for newTask and delete modals", () => {
    // New Task Modal fields
    const newTaskForm = view.querySelector('[data-form="newTask"]');
    expect(newTaskForm.querySelector('[data-field="title"]')).not.toBeNull();
    expect(
      newTaskForm.querySelector('textarea[data-field="description"]'),
    ).not.toBeNull();

    const gridSelects = newTaskForm.querySelectorAll(
      ".task-modal-grid select, .task-modal-grid input",
    );
    expect(gridSelects.length).toBe(3); // project, priority, dueDate

    // Delete Modal elements
    const deleteModal = view.querySelector('[data-modal="delete"]');
    const panel = deleteModal.querySelector(".task-modal-panel");
    const confirmBtn = deleteModal.querySelector("[data-delete-confirm]");

    expect(panel.classList.contains("task-modal-panel--danger")).toBe(true);
    expect(confirmBtn).not.toBeNull();
  });
});
