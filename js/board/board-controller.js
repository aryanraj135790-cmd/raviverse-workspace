import { showToast } from "../ui/toast.js";
import { getBoardDom } from "./board-dom.js";
import {
  renderBoardStatusMessage,
  setRefreshing,
  renderProjectOptions,
  renderBoardGroups,
  renderBoardEmptyState,
  renderBoardSkeletonState,
  toggleProject,
  toggleTask,
  toggleTaskEdit,
  expandProject,
  expandTask,
  resetBoardUiState,
} from "./board-renderer.js";
import { getBoardData } from "./board-data.js";
import { createBoardStore } from "./board-store.js";
import { createBoardView } from "./board-view.js";
import {
  createTask,
  deleteTask,
  completeTask,
  reopenTask,
  updateTask,
} from "../supabase/task-writes.js";

// Module state for shared lifecycle (setup/teardown)
let boardDom = null;
let latestRequestId = 0;
let firstLoadComplete = false;

const initialBoardState = {
  status: "idle",
  data: null,
  error: null,
};

const boardStore = createBoardStore(initialBoardState);

// --- Render helpers ---

function resolveBoardDom(dom = null) {
  return dom ?? boardDom ?? getBoardDom();
}

function renderBoardState(state, dom = resolveBoardDom()) {
  if (!dom) return;

  setRefreshing(dom.refresh, state.status === "loading");
  renderBoardStatusMessage(dom.status, state.status);

  if (state.status === "loading") {
    // Shimmer skeleton while data hydrates — same pattern as dashboard.
    renderBoardSkeletonState(dom.groupsContainer);
    renderBoardEmptyState(dom.emptyState, false);
    return;
  }

  if (state.status === "success" && state.data) {
    renderProjectOptions(dom.projectSelect, state.data.projects ?? []);
    renderBoardGroups(state.data.groups, dom.groupsContainer);
    const isEmpty =
      (state.data.projects?.length ?? 0) === 0 &&
      (state.data.tasks?.length ?? 0) === 0;
    renderBoardEmptyState(dom.emptyState, isEmpty);

    // Auto-expand the first project group on the very first success render
    if (!firstLoadComplete && state.data.groups?.length > 0) {
      firstLoadComplete = true;
      const firstGroup = dom.groupsContainer.querySelector(".board-group");
      if (firstGroup) {
        expandProject(firstGroup.dataset.projectId, firstGroup);
      }
    }
  } else if (state.status === "success") {
    renderBoardGroups([], dom.groupsContainer);
    renderBoardEmptyState(dom.emptyState, true);
  }
}

function transitionBoard(store, status, data, error, dom = resolveBoardDom()) {
  const nextState = store.setStatus(status, data, error);
  renderBoardState(nextState, dom);
}

// --- Data loading (ADR-001 stale-request guard) ---

async function loadBoard(store, dom = resolveBoardDom()) {
  const requestId = ++latestRequestId;
  try {
    transitionBoard(store, "loading", null, null, dom);

    const boardData = await getBoardData();

    if (requestId !== latestRequestId) return;

    transitionBoard(store, "success", boardData, null, dom);
    return store.getState();
  } catch (error) {
    if (requestId !== latestRequestId) return;

    if (error.cause) {
      console.error("Original System Error Details:", error.cause);
    }
    console.error("Board Init Failed ->", error.message);

    transitionBoard(store, "error", null, error, dom);
    return store.getState();
  }
}

function refreshBoard() {
  return loadBoard(boardStore);
}

// --- ADR-005: optimistic mutation handlers ---

async function handleCreateTask(taskData) {
  boardStore.beginMutation("create");
  const tempId = boardStore.applyOptimisticCreate(taskData);
  renderBoardState(boardStore.getState());

  // Auto-expand the newly created task card so the user sees it immediately.
  const tempCard = document.querySelector(`[data-task-id="${tempId}"]`);
  if (tempCard) expandTask(tempId, tempCard);

  try {
    const rawTask = await createTask(taskData);
    const realTask = {
      id: rawTask.id,
      projectId: rawTask.project_id,
      title: rawTask.title,
      description: rawTask.description ?? "",
      status: rawTask.status,
      priority: rawTask.priority ?? null,
      dueDate: rawTask.due_date ?? null,
      completedAt: rawTask.completed_at,
      startedAt: rawTask.started_at ?? null,
      createdAt: rawTask.created_at,
      updatedAt: rawTask.updated_at,
      deletedAt: rawTask.deleted_at,
      projectName: null,
    };

    boardStore.confirmCreate(realTask);
    showToast("Task created.", "success");
  } catch (error) {
    boardStore.rollbackMutation();
    showToast("Failed to create task. Please try again.", "error");
    console.error("createTask failed ->", error.message, error.cause ?? "");
  } finally {
    renderBoardState(boardStore.getState());
  }
}

async function handleMutation(
  taskId,
  mutationFn,
  optimisticUpdates,
  successMessage,
) {
  boardStore.beginMutation("update");
  if (optimisticUpdates) {
    boardStore.applyOptimisticUpdate(taskId, optimisticUpdates);
  }
  renderBoardState(boardStore.getState());

  try {
    await mutationFn(taskId);
    boardStore.confirmMutation();
    showToast(successMessage, "success");
  } catch (error) {
    boardStore.rollbackMutation();
    showToast("Failed to update task. Please try again.", "error");
    console.error("Task mutation failed ->", error.message, error.cause ?? "");
  } finally {
    renderBoardState(boardStore.getState());
  }
}

// --- Event handling (delegated on the groups container) ---

function closeAllTaskMenus() {
  const openMenus = document.querySelectorAll(
    ".task-card__menu-list:not([hidden])",
  );
  openMenus.forEach((menu) => {
    menu.hidden = true;
    const button = menu
      .closest(".task-card__actions")
      ?.querySelector('[data-action="menu"]');
    if (button) button.setAttribute("aria-expanded", "false");
  });
}

async function handleTaskAction(taskId, action) {
  switch (action) {
    case "complete":
      await handleMutation(
        taskId,
        (id) => completeTask(id),
        { status: "completed", completedAt: new Date().toISOString() },
        "Task completed.",
      );
      break;
    case "reopen":
      await handleMutation(
        taskId,
        (id) => reopenTask(id),
        { status: "todo", completedAt: null },
        "Task reopened.",
      );
      break;
    case "menu": {
      const card = document.querySelector(`[data-task-id="${taskId}"]`);
      const menuList = card?.querySelector(".task-card__menu-list");
      const menuButton = card?.querySelector('[data-action="menu"]');
      if (menuList) {
        const isCurrentlyHidden = menuList.hidden;
        closeAllTaskMenus();
        menuList.hidden = !isCurrentlyHidden;
        if (menuButton) {
          menuButton.setAttribute("aria-expanded", String(!isCurrentlyHidden));
        }
      }
      break;
    }
    case "edit-title": {
      const input = document.querySelector(
        `[data-task-id="${taskId}"] .board-task-title`,
      );
      input?.focus();
      input?.select();
      break;
    }
    case "edit-description": {
      const textarea = document.querySelector(
        `[data-task-id="${taskId}"] .board-task-description`,
      );
      textarea?.focus();
      break;
    }
    case "delete":
      await handleTaskDelete(taskId);
      break;
    default:
      console.warn(`Unknown board task action: ${action}`);
  }
}

// Delete: optimistic removal + confirmed delete (ADR-005).
async function handleTaskDelete(taskId) {
  boardStore.beginMutation("delete");
  boardStore.applyOptimisticDelete(taskId);
  renderBoardState(boardStore.getState());

  try {
    await deleteTask(taskId);
    boardStore.confirmMutation();
    showToast("Task deleted.", "success");
  } catch (error) {
    boardStore.rollbackMutation();
    showToast("Failed to delete task. Please try again.", "error");
    console.error("deleteTask failed ->", error.message, error.cause ?? "");
  } finally {
    renderBoardState(boardStore.getState());
  }
}

async function handleBoardClick(event) {
  const target = event.target;

  // Dismiss task menus if click occurred outside menu triggers
  if (
    !target.closest('[data-action="menu"]') &&
    !target.closest(".task-card__menu-list")
  ) {
    closeAllTaskMenus();
  }

  // Project accordion: click the trigger → toggle group body.
  const projectTrigger = target.closest("[data-action='toggle-project']");
  if (projectTrigger) {
    const group = projectTrigger.closest(".board-group");
    if (group) toggleProject(group.dataset.projectId, group);
    return;
  }

  // Task accordion: click the title trigger → toggle card body.
  const taskTrigger = target.closest("[data-action='toggle-task']");
  if (taskTrigger) {
    const card = taskTrigger.closest("[data-task-id]");
    if (card) toggleTask(Number(card.dataset.taskId), card);
    return;
  }

  // Edit mode: click the ✎ icon → toggle edit mode on the card.
  const editButton = target.closest("[data-action='toggle-edit']");
  if (editButton) {
    const card = editButton.closest("[data-task-id]");
    if (card) {
      const entered = toggleTaskEdit(Number(card.dataset.taskId), card);
      if (entered) {
        card.querySelector(".board-task-title--input")?.focus();
      }
    }
    return;
  }

  // Generic button actions on a task card (menu toggle, delete, etc.).
  const button = target.closest("button[data-action]");
  if (!button) return;

  const taskCard = button.closest("[data-task-id]");
  if (!taskCard) return;

  const taskId = Number(taskCard.getAttribute("data-task-id"));
  if (!Number.isFinite(taskId)) {
    console.warn(
      `Board task card is missing a valid data-task-id: ${taskCard.getAttribute("data-task-id")}`,
    );
    return;
  }

  await handleTaskAction(taskId, button.getAttribute("data-action"));
}

// Change delegation: checkbox toggle + inline field commits.
async function handleBoardChange(event) {
  const target = event.target;
  const taskCard = target.closest("[data-task-id]");
  if (!taskCard) return;

  const taskId = Number(taskCard.getAttribute("data-task-id"));
  if (!Number.isFinite(taskId)) return;

  // Checkbox → complete / reopen
  if (target.matches("input[type='checkbox']")) {
    const action = target.checked ? "complete" : "reopen";
    await handleTaskAction(taskId, action);
    return;
  }

  // Title (edit mode input) — commit on change/blur.
  if (target.classList.contains("board-task-title")) {
    const newTitle = target.value.trim();
    if (!newTitle) return;
    await handleMutation(
      taskId,
      (id) => updateTask(id, { title: newTitle }),
      { title: newTitle },
      "Task updated.",
    );
    return;
  }

  // Priority select — directly editable, no edit-mode gate needed.
  if (target.classList.contains("board-task-priority")) {
    await handleMutation(
      taskId,
      (id) => updateTask(id, { priority: target.value }),
      { priority: target.value },
      "Priority updated.",
    );
    return;
  }

  // Due date (edit mode date input).
  if (target.classList.contains("board-task-due-date")) {
    await handleMutation(
      taskId,
      (id) => updateTask(id, { due_date: target.value }),
      { dueDate: target.value },
      "Due date updated.",
    );
    return;
  }

  // Description (edit mode textarea).
  if (target.classList.contains("board-task-description")) {
    await handleMutation(
      taskId,
      (id) => updateTask(id, { description: target.value }),
      { description: target.value },
      "Task updated.",
    );
  }
}

async function handleBoardFormSubmit(event) {
  event.preventDefault();

  const dom = resolveBoardDom();
  const title = dom.titleInput?.value?.trim();
  const projectId = dom.projectSelect?.value;

  if (!title) return;
  if (!projectId) {
    showToast("Please select a project.", "error");
    return;
  }

  const taskData = {
    title,
    project_id: Number(projectId),
  };

  dom.form.reset();
  await handleCreateTask(taskData);
}

// --- Lifecycle (mount/destroy pair — router contract) ---

let boundClickHandler = null;
let boundSubmitHandler = null;
let boundRefreshHandler = null;
let boundChangeHandler = null;
let boundDocumentClickHandler = null;

function bindBoardEvents(dom) {
  boundClickHandler = handleBoardClick;
  boundSubmitHandler = handleBoardFormSubmit;
  boundRefreshHandler = refreshBoard;
  boundChangeHandler = handleBoardChange;
  boundDocumentClickHandler = (e) => {
    if (!e.target.closest("#app-view")) closeAllTaskMenus();
  };

  dom.groupsContainer.addEventListener("click", boundClickHandler);
  dom.groupsContainer.addEventListener("change", boundChangeHandler);
  dom.form.addEventListener("submit", boundSubmitHandler);
  dom.refresh.addEventListener("click", boundRefreshHandler);
  document.addEventListener("click", boundDocumentClickHandler);
}

function unbindBoardEvents(dom) {
  if (boundClickHandler)
    dom.groupsContainer.removeEventListener("click", boundClickHandler);
  if (boundChangeHandler)
    dom.groupsContainer.removeEventListener("change", boundChangeHandler);
  if (boundSubmitHandler)
    dom.form.removeEventListener("submit", boundSubmitHandler);
  if (boundRefreshHandler)
    dom.refresh.removeEventListener("click", boundRefreshHandler);
  if (boundDocumentClickHandler)
    document.removeEventListener("click", boundDocumentClickHandler);

  boundClickHandler = null;
  boundSubmitHandler = null;
  boundRefreshHandler = null;
  boundChangeHandler = null;
  boundDocumentClickHandler = null;
}

async function initBoard() {
  const workspaceView = document.querySelector("#app-view");

  if (boardDom) {
    unbindBoardEvents(boardDom);
    boardDom.view?.remove();
  }

  resetBoardUiState();
  firstLoadComplete = false;

  const view = createBoardView();
  workspaceView.appendChild(view);

  boardDom = { view, ...getBoardDom() };

  bindBoardEvents(boardDom);
  return loadBoard(boardStore, boardDom);
}

function destroyBoard() {
  if (!boardDom) return;
  resetBoardUiState();
  firstLoadComplete = false;
  unbindBoardEvents(boardDom);
  boardDom.view?.remove();
  boardDom = null;
}

export {
  initBoard,
  destroyBoard,
  refreshBoard,
  handleBoardFormSubmit,
  handleBoardClick,
};
