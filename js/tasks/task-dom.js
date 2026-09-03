/**
 * @param {ParentNode} [root=document] - The parent container to query against.
 * @returns {Object} Map of task-related DOM nodes and collections.
 */

export function getTaskDom(root = document) {
  return {
    mobileMenuBtn: root.querySelector("[data-mobile-menu-btn]"),
    newTaskBtn: root.querySelector("[data-new-task-btn]"),

    tabs: {
      all: root.querySelector('[data-tab="all"]'),
      todo: root.querySelector('[data-tab="todo"]'),
      inprogress: root.querySelector('[data-tab="inprogress"]'),
      completed: root.querySelector('[data-tab="completed"]'),
    },

    tabCounts: {
      all: root.querySelector('[data-tab-count="all"]'),
      todo: root.querySelector('[data-tab-count="todo"]'),
      inprogress: root.querySelector('[data-tab-count="inprogress"]'),
      completed: root.querySelector('[data-tab-count="completed"]'),
    },

    searchInput: root.querySelector("[data-search-input]"),
    priorityFilter: root.querySelector('[data-filter="priority"]'),
    projectFilter: root.querySelector('[data-filter="project"]'),
    sortSelect: root.querySelector("[data-sort]"),
    taskList: root.querySelector("[data-task-list]"),
    noResults: root.querySelector("[data-no-results]"),
    clearFiltersBtn: root.querySelector("[data-clear-filters]"),

    modals: {
      newTask: root.querySelector('[data-modal="newTask"]'),
      editTask: root.querySelector('[data-modal="editTask"]'),
      delete: root.querySelector('[data-modal="delete"]'),
    },

    forms: {
      newTask: root.querySelector('[data-form="newTask"]'),
      editTask: root.querySelector('[data-form="editTask"]'),
    },

    modalCloseBtns: root.querySelectorAll("[data-modal-close]"),
    modalCancelBtns: root.querySelectorAll("[data-modal-cancel]"),
    modalSubmitBtns: root.querySelectorAll("[data-modal-submit]"),
    deleteConfirmBtn: root.querySelector("[data-delete-confirm]"),

    formFields: {
      title: root.querySelectorAll('[data-field="title"]'),
      description: root.querySelectorAll('[data-field="description"]'),
      project: root.querySelectorAll('[data-field="project"]'),
      priority: root.querySelectorAll('[data-field="priority"]'),
      dueDate: root.querySelectorAll('[data-field="dueDate"]'),
    },
  };
}
