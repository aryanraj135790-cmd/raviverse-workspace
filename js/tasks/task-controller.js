import { showToast } from "../ui/toast.js";
import { getTaskDom } from "./task-dom.js";
import { renderTasks } from "./task-render.js";
import { createTaskStore } from "./task-store.js";
import { createTaskView } from "./task-view.js";

let taskDom = null;
let taskStore = null;
let searchDebounceTimer = null;
let editingTaskId = null;
let deletingTaskId = null;

// Filter state (view-only, not domain state)
let activeTab = "all";
let searchQuery = "";
let priorityFilter = "";
let projectFilter = "";

// Helper Functions

// Renders the task list based on the current state and filters
function renderTaskList(state) {
  if (!taskDom?.taskList) return;
  const allTasks = Object.values(state.tasksByProjectId).flat();
  const filteredTasks = getFilteredTasks(allTasks);

  if (filteredTasks.length === 0) {
    taskDom.noResults.hidden = false;
  } else {
    taskDom.noResults.hidden = true;
  }

  renderTasks(taskDom.taskList, filteredTasks, state.projectNames);
}

// Function to filter tasks based on active tab, search query, and other filters
function getFilteredTasks(allTasks) {
  let filteredTasks = allTasks;

  // Filter by active tab
  if (activeTab === "todo") {
    filteredTasks = filteredTasks.filter((t) => t.status === "todo");
  } else if (activeTab === "inprogress") {
    filteredTasks = filteredTasks.filter((t) => t.status === "in_progress");
  } else if (activeTab === "completed") {
    filteredTasks = filteredTasks.filter((t) => t.status === "completed");
  }

  // Filter by search query
  if (searchQuery.trim() !== "") {
    const query = searchQuery.trim().toLowerCase();
    filteredTasks = filteredTasks.filter(
      (task) =>
        task.title.toLowerCase().includes(query) ||
        (task.description && task.description.toLowerCase().includes(query)),
    );
  }

  // Filter by priority
  if (priorityFilter !== "") {
    filteredTasks = filteredTasks.filter(
      (task) => task.priority === priorityFilter,
    );
  }

  // Filter by project
  if (projectFilter !== "") {
    filteredTasks = filteredTasks.filter(
      (task) => task.projectId === Number(projectFilter),
    );
  }

  return filteredTasks;
}

function openEditModal(taskId) {
  const state = taskStore.getState();
  const allTasks = Object.values(state.tasksByProjectId).flat();
  const task = allTasks.find((t) => t.id === taskId);
  if (!task) return;

  editingTaskId = taskId;

  const form = taskDom.forms.editTask;
  form.querySelector('[data-field="title"]').value = task.title || "";
  form.querySelector('[data-field="description"]').value =
    task.description || "";
  form.querySelector('[data-field="project"]').value = task.projectId || "";
  form.querySelector('[data-field="priority"]').value =
    task.priority || "medium";
  form.querySelector('[data-field="dueDate"]').value = task.dueDate || "";

  taskDom.modals.editTask.hidden = false;
}

function openDeleteModal(taskId) {
  deletingTaskId = taskId;
  taskDom.modals.delete.hidden = false;
}

// Event Handlers module scope function

function handleTabClick(event) {
  const selectedTab = event.currentTarget.getAttribute("data-tab");
  activeTab = selectedTab;

  Object.keys(taskDom.tabs).forEach((k) => {
    taskDom.tabs[k].classList.remove("task-tab--active");
    if (taskDom.tabCounts[k]) {
      taskDom.tabCounts[k].classList.remove("task-tab-count--active");
    }
  });

  event.currentTarget.classList.add("task-tab--active");
  if (taskDom.tabCounts[selectedTab]) {
    taskDom.tabCounts[selectedTab].classList.add("task-tab-count--active");
  }

  renderTaskList(taskStore.getState());
}

function handleSearchInput(event) {
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    searchQuery = event.target.value;
    renderTaskList(taskStore.getState());
  }, 300);
}

function handlePriorityChange(event) {
  priorityFilter = event.target.value;
  renderTaskList(taskStore.getState());
}

function handleProjectChange(event) {
  projectFilter = event.target.value;
  renderTaskList(taskStore.getState());
}

async function handleTaskListClick(event) {
  // 1. Kebab menu toggle action
  const kebab = event.target.closest("[data-action='menu-toggle']");
  if (kebab) {
    const card = kebab.closest(".task-card");
    const menu = card.querySelector(".task-card-menu");
    taskDom.taskList.querySelectorAll(".task-card-menu").forEach((m) => {
      if (m !== menu) m.hidden = true;
    });
    menu.hidden = !menu.hidden;
    return;
  }

  // 2. Edit / Delete menu item actions
  const editBtn = event.target.closest('[data-action="edit"]');
  const deleteBtn = event.target.closest('[data-action="delete"]');
  if (editBtn || deleteBtn) {
    const card = event.target.closest("[data-task-id]");
    if (!card) return;
    const taskId = Number(card.dataset.taskId);

    // Close open menus
    taskDom.taskList
      .querySelectorAll(".task-card-menu")
      .forEach((m) => (m.hidden = true));

    if (editBtn) openEditModal(taskId);
    else if (deleteBtn) openDeleteModal(taskId);
    return;
  }

  // 3. Complete / Reopen task action
  const isCheckbox = event.target.closest(".task-checkbox");
  const isDot = event.target.closest(".task-status-dot");
  if (isCheckbox || isDot) {
    const card = event.target.closest("[data-task-id]");
    if (!card) return;

    const taskId = Number(card.dataset.taskId);
    const taskData = taskStore.getState();
    const allTasks = Object.values(taskData.tasksByProjectId).flat();
    const task = allTasks.find((t) => t.id === taskId);
    if (!task) return;

    try {
      if (task.status === "completed") {
        await taskStore.reopenTask(taskId);
        showToast("Task reopened successfully!", "success");
      } else {
        await taskStore.completeTask(taskId);
        showToast("Task completed! Good job!", "success");
      }
    } catch (error) {
      showToast(error.message, "error");
    }
  }
}

function handleOutsideClick(event) {
  if (!event.target.closest(".task-card-menu-wrap")) {
    taskDom.taskList
      ?.querySelectorAll(".task-card-menu")
      .forEach((m) => (m.hidden = true));
  }
}

function handleNewTaskSubmit(e) {
  e.preventDefault();
  const form = taskDom.forms.newTask;
  const submitBtn = taskDom.modalSubmitBtns[0];
  submitBtn.disabled = true;
  const title = form.querySelector('[data-field="title"]').value.trim();

  if (!title) {
    submitBtn.disabled = false;
    showToast("Title is required.", "error");
    return;
  }

  const task = {
    title,
    description: form.querySelector('[data-field="description"]').value.trim(),
    project_id:
      Number(form.querySelector('[data-field="project"]').value) || null,
    priority: form.querySelector('[data-field="priority"]').value || "medium",
    due_date: form.querySelector('[data-field="dueDate"]').value || null,
  };
  taskStore
    .addTask(task)
    .then(() => taskStore.load())
    .then(() => {
      form.reset();
      taskDom.modals.newTask.hidden = true;
      showToast("Task created.", "success");
    })
    .catch((error) => showToast(error.message || "Failed.", "error"))
    .finally(() => {
      submitBtn.disabled = false;
    });
}

function handleOpenNewTask() {
  taskDom.modals.newTask.hidden = false;
}

function handleModalClose(event) {
  event.target.closest("[data-modal]").hidden = true;
  taskDom.forms.newTask.reset();
  taskDom.forms.editTask.reset();
  editingTaskId = null;
  deletingTaskId = null;
  const submitBtns = event.target
    .closest("[data-modal]")
    .querySelectorAll('[type="submit"]');
  submitBtns.forEach((btn) => (btn.disabled = false));
}

function handleEditTaskSubmit(e) {
  e.preventDefault();
  const form = taskDom.forms.editTask;
  const submitBtn = form.parentElement.querySelector('[type="submit"]');
  submitBtn.disabled = true;

  const title = form.querySelector('[data-field="title"]').value.trim();
  if (!title) {
    submitBtn.disabled = false;
    return showToast("Title is required.", "error");
  }
  const updates = {
    title,
    description: form.querySelector('[data-field="description"]').value.trim(),
    project_id:
      Number(form.querySelector('[data-field="project"]').value) || null,
    priority: form.querySelector('[data-field="priority"]').value || "medium",
    due_date: form.querySelector('[data-field="dueDate"]').value || null,
  };
  taskStore
    .updateTask(editingTaskId, updates)
    .then(() => taskStore.load())
    .then(() => {
      form.reset();
      taskDom.modals.editTask.hidden = true;
      editingTaskId = null;
      showToast("Task updated.", "success");
    })
    .catch((err) => showToast(err.message || "Failed.", "error"))
    .finally(() => {
      submitBtn.disabled = false;
    });
}

function handleDeleteConfirm() {
  if (!deletingTaskId) return;
  const confirmBtn = taskDom.deleteConfirmBtn;
  confirmBtn.disabled = true;

  taskStore
    .deleteTask(deletingTaskId)
    .then(() => taskStore.load())
    .then(() => {
      taskDom.modals.delete.hidden = true;
      deletingTaskId = null;
      showToast("Task deleted.", "success");
    })
    .catch((err) => showToast(err.message || "Failed.", "error"))
    .finally(() => {
      confirmBtn.disabled = false;
    });
}

function populateFormProjectSelect(state) {
  const forms = [taskDom.forms.newTask, taskDom.forms.editTask];

  forms.forEach((form) => {
    if (!form) return;
    const select = form.querySelector('[data-field="project"]');
    if (!select) return;

    const allOption = select.querySelector('option[value=""]');
    select.replaceChildren(allOption);

    for (const [projectId, projectName] of Object.entries(state.projectNames)) {
      const option = document.createElement("option");
      option.value = projectId;
      option.textContent = projectName;
      select.appendChild(option);
    }
  });
}

function populateProjectFilter(state) {
  const select = taskDom.projectFilter;
  if (!select) return;

  const allOption = select.querySelector('option[value=""]');
  select.replaceChildren(allOption);

  for (const [projectId, projectName] of Object.entries(state.projectNames)) {
    const option = document.createElement("option");
    option.value = projectId;
    option.textContent = projectName;
    select.appendChild(option);
  }
}

function updateTabCounts(state) {
  const allTasks = Object.values(state.tasksByProjectId).flat();
  const counts = {
    all: allTasks.length,
    todo: allTasks.filter((t) => t.status === "todo").length,
    inprogress: allTasks.filter((t) => t.status === "in_progress").length,
    completed: allTasks.filter((t) => t.status === "completed").length,
  };

  Object.keys(taskDom.tabCounts).forEach((key) => {
    taskDom.tabCounts[key].textContent = counts[key] || 0;
  });
}

// Setup Ours Listeners

function setupEventListeners() {
  Object.keys(taskDom.tabs).forEach((key) => {
    taskDom.tabs[key].addEventListener("click", handleTabClick);
  });
  taskDom.searchInput.addEventListener("input", handleSearchInput);
  taskDom.priorityFilter.addEventListener("change", handlePriorityChange);
  taskDom.projectFilter.addEventListener("change", handleProjectChange);
  taskDom.taskList.addEventListener("click", handleTaskListClick);
  document.addEventListener("click", handleOutsideClick);
  taskDom.newTaskBtn.addEventListener("click", handleOpenNewTask);
  taskDom.modalCloseBtns.forEach((btn) =>
    btn.addEventListener("click", handleModalClose),
  );
  taskDom.modalCancelBtns.forEach((btn) =>
    btn.addEventListener("click", handleModalClose),
  );
  taskDom.forms.newTask.addEventListener("submit", handleNewTaskSubmit);
  taskDom.forms.editTask.addEventListener("submit", handleEditTaskSubmit);
  taskDom.deleteConfirmBtn.addEventListener("click", handleDeleteConfirm);
}

// Lifecycle

export function initTaskController() {
  const appView = document.querySelector("#app-view");
  appView.replaceChildren(createTaskView());

  taskDom = getTaskDom();
  taskStore = createTaskStore();

  taskStore.subscribe((state) => {
    if (state.status === "ready") {
      populateProjectFilter(state);
      populateFormProjectSelect(state);
      renderTaskList(state);
      updateTabCounts(state);
    }
  });

  taskStore.load();
  setupEventListeners();
}

export function destroyTaskController() {
  if (!taskDom) return;
  Object.values(taskDom.tabs).forEach((tab) =>
    tab.removeEventListener("click", handleTabClick),
  );
  taskDom.searchInput?.removeEventListener("input", handleSearchInput);
  taskDom.priorityFilter?.removeEventListener("change", handlePriorityChange);
  taskDom.projectFilter?.removeEventListener("change", handleProjectChange);
  taskDom.taskList?.removeEventListener("click", handleTaskListClick);
  document.removeEventListener("click", handleOutsideClick);
  taskDom.newTaskBtn?.removeEventListener("click", handleOpenNewTask);
  taskDom.modalCloseBtns?.forEach((btn) =>
    btn.removeEventListener("click", handleModalClose),
  );
  taskDom.modalCancelBtns?.forEach((btn) =>
    btn.removeEventListener("click", handleModalClose),
  );
  const allSubmitBtns = document.querySelectorAll('[type="submit"]');
  allSubmitBtns.forEach((btn) => (btn.disabled = false));

  taskDom.forms?.newTask?.removeEventListener("submit", handleNewTaskSubmit);
  taskDom.forms?.editTask?.removeEventListener("submit", handleEditTaskSubmit);
  taskDom.deleteConfirmBtn?.removeEventListener("click", handleDeleteConfirm);
  clearTimeout(searchDebounceTimer);
  const appView = document.querySelector("#app-view");
  if (appView) appView.replaceChildren();
  taskDom = null;
  taskStore = null;
  editingTaskId = null;
  deletingTaskId = null;
  searchQuery = "";
  activeTab = "all";
  priorityFilter = "";
  projectFilter = "";
}
