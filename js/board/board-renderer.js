// Pure render functions — mirror dashboard-renderer.js conventions.
// This module also owns *ephemeral UI state* (accordion open/close, edit
// mode) in module-level Sets so that state survives the board's full
// re-renders after optimistic mutations. Use resetBoardUiState() to clear.

// --- UI state (persisted across re-renders) ---

// Project IDs whose group body is expanded.
const openProjects = new Set();
// Task IDs whose card body is expanded.
const openTasks = new Set();
// Task IDs currently in "edit mode".
const editingTasks = new Set();

/** Clear all ephemeral UI state — call on destroy or in test beforeEach. */
function resetBoardUiState() {
  openProjects.clear();
  openTasks.clear();
  editingTasks.clear();
}

// --- Expand / collapse helpers (update state + DOM + ARIA in one call) ---

function toggleProject(projectId, groupElement) {
  if (!groupElement) return;
  const trigger = groupElement.querySelector(".project-group__trigger");

  if (openProjects.has(projectId)) {
    openProjects.delete(projectId);
    groupElement.classList.remove("is-open");
    if (trigger) trigger.setAttribute("aria-expanded", "false");
  } else {
    openProjects.add(projectId);
    groupElement.classList.add("is-open");
    if (trigger) trigger.setAttribute("aria-expanded", "true");
  }
}

function expandProject(projectId, groupElement) {
  if (!groupElement) return;
  openProjects.add(projectId);
  groupElement.classList.add("is-open");
  const trigger = groupElement.querySelector(".project-group__trigger");
  if (trigger) trigger.setAttribute("aria-expanded", "true");
}

function toggleTask(taskId, cardElement) {
  if (!cardElement) return;
  const trigger = cardElement.querySelector(".task-card__trigger");

  if (openTasks.has(taskId)) {
    openTasks.delete(taskId);
    cardElement.classList.remove("is-open");
    if (trigger) trigger.setAttribute("aria-expanded", "false");
  } else {
    openTasks.add(taskId);
    cardElement.classList.add("is-open");
    if (trigger) trigger.setAttribute("aria-expanded", "true");
  }
}

function expandTask(taskId, cardElement) {
  if (!cardElement) return;
  openTasks.add(taskId);
  cardElement.classList.add("is-open");
  const trigger = cardElement.querySelector(".task-card__trigger");
  if (trigger) trigger.setAttribute("aria-expanded", "true");
}

function toggleTaskEdit(taskId, cardElement) {
  if (!cardElement) return;
  const entering = !editingTasks.has(taskId);
  if (entering) {
    editingTasks.add(taskId);
    cardElement.classList.add("is-editing");
  } else {
    editingTasks.delete(taskId);
    cardElement.classList.remove("is-editing");
  }
  return entering;
}

// --- Render helpers ---

function renderBoardStatusMessage(statusElement, status) {
  if (!statusElement) return;
  switch (status) {
    case "idle":
      statusElement.textContent = "Board is ready.";
      break;
    case "loading":
      statusElement.textContent = "Loading board...";
      break;
    case "success":
      statusElement.textContent = "Board loaded.";
      break;
    case "error":
      statusElement.textContent = "Failed to load board. Please try again.";
      break;
  }
}

function setRefreshing(refreshButton, isRefreshing) {
  if (!refreshButton) return;
  refreshButton.disabled = isRefreshing;
}

// --- Skeleton loading (mirrors dashboard-renderer.js shimmer pattern) ---

/**
 * Create one skeleton card element. Visual only — no interactivity.
 * Reuses the global `.skeleton` base class and `shimmer` keyframe from
 * base.css, the same pattern used by the dashboard activity list.
 */
function createSkeletonCard() {
  const card = document.createElement("article");
  card.className = "task-card task-card--skeleton";

  const header = document.createElement("div");
  header.className = "task-card__skeleton-header";

  const checkboxSkeleton = document.createElement("div");
  checkboxSkeleton.className = "skeleton skeleton--checkbox";

  const titleSkeleton = document.createElement("div");
  titleSkeleton.className = "skeleton skeleton--title";

  header.append(checkboxSkeleton, titleSkeleton);

  const body = document.createElement("div");
  body.className = "task-card__skeleton-body";

  const line1 = document.createElement("div");
  line1.className = "skeleton skeleton--line";
  line1.style.width = "55%";

  const line2 = document.createElement("div");
  line2.className = "skeleton skeleton--line";
  line2.style.width = "35%";

  body.append(line1, line2);

  card.append(header, body);
  return card;
}

/**
 * Fill the container with shimmering skeleton cards while the board loads.
 * Mirrors renderRecentActivitiesLoadingState — pure, replaces children.
 */
function renderBoardSkeletonState(container, count = 6) {
  if (!container) return;
  container.replaceChildren();

  const wrapper = document.createElement("div");
  wrapper.className = "board-skeleton";

  for (let i = 0; i < count; i++) {
    wrapper.appendChild(createSkeletonCard());
  }

  container.appendChild(wrapper);
}

// Populate the project select for the create form.
function renderProjectOptions(projectSelect, projects) {
  if (!projectSelect) return;
  // Keep the placeholder option (index 0), clear the rest.
  while (projectSelect.options.length > 1) {
    projectSelect.remove(1);
  }
  projects.forEach((project) => {
    const option = document.createElement("option");
    option.value = String(project.id);
    option.textContent = project.name;
    projectSelect.appendChild(option);
  });
}

// Format an ISO timestamp for card display, e.g. "Aug 31, 2026 · 09:25 PM".
function formatTimestamp(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
    .format(date)
    .replace(",", " ·");
}

// Convert an ISO date (or null) into YYYY-MM-DD for <input type="date">.
function formatDateForInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${mm}-${dd}`;
}

// Priority option data shared between the select and the badge.
const PRIORITY_OPTIONS_DATA = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const PRIORITY_LABEL = {
  low: "Low",
  medium: "Medium",
  high: "High",
  null: "None",
  undefined: "None",
};

// --- Field builders ---

function createCardCheckbox(isCompleted) {
  const label = document.createElement("label");
  label.className = "task-card__checkbox";
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.name = "task-completed";
  checkbox.className = "board-task-complete";
  checkbox.setAttribute("aria-label", "Mark task as completed");
  checkbox.setAttribute("data-action", isCompleted ? "reopen" : "complete");
  checkbox.checked = isCompleted;
  const mark = document.createElement("span");
  mark.className = "task-card__checkbox-mark";
  label.append(checkbox, mark);
  return label;
}

function createPrioritySelect(priority) {
  const normalized = priority ?? "medium";
  const select = document.createElement("select");
  select.className = "board-task-priority task-priority-select";
  PRIORITY_OPTIONS_DATA.forEach((opt) => {
    const option = document.createElement("option");
    option.value = opt.value;
    option.textContent = opt.label;
    if (opt.value === normalized) option.selected = true;
    select.appendChild(option);
  });
  return select;
}

/**
 * Build one task card <article> + its collapsible body.
 *
 * Header: checkbox + accordion trigger (chevron + title) + edit icon + menu
 * Body:   priority select (always directly editable) + due-date + description + timestamps
 *
 * • Title lives in the header and is the accordion trigger.
 * • Clicking the chevron/title toggles `.is-open` (body expand/collapse).
 * • Edit icon toggles `.is-editing` — swaps text spans for writable inputs.
 * • Priority `<select>` is ALWAYS directly editable (no edit-mode gate).
 */
function createTaskCardElement(task, projectName = null) {
  const card = document.createElement("article");
  card.className = "task-card";
  card.setAttribute("data-task-id", String(task.id));
  if (task.status === "completed") {
    card.classList.add("is-completed");
  }
  // Re-apply persisted UI state so re-renders don't lose accordion position.
  if (openTasks.has(task.id)) card.classList.add("is-open");
  if (editingTasks.has(task.id)) card.classList.add("is-editing");

  const isCompleted = task.status === "completed";

  // --- Header ---
  const header = document.createElement("header");
  header.className = "task-card__header";

  // Checkbox (complete / reopen)
  header.appendChild(createCardCheckbox(isCompleted));

  // Accordion trigger: chevron + title (text span + writable input)
  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "task-card__trigger";
  trigger.setAttribute("aria-label", "Expand task");
  trigger.setAttribute("data-action", "toggle-task");
  trigger.setAttribute(
    "aria-expanded",
    openTasks.has(task.id) ? "true" : "false",
  );

  const chevron = document.createElement("span");
  chevron.className = "task-card__chevron";
  chevron.setAttribute("aria-hidden", "true");
  chevron.textContent = "▶";

  const titleWrap = document.createElement("span");
  titleWrap.className = "task-card__title";

  const titleText = document.createElement("span");
  titleText.className = "task-card__title-text";
  titleText.textContent = task.title ?? "Untitled";

  const titleInput = document.createElement("input");
  titleInput.type = "text";
  titleInput.className = "board-task-title board-task-title--input";
  titleInput.value = task.title ?? "";
  titleInput.setAttribute("aria-label", "Task title");
  titleInput.setAttribute("data-action", "edit-title");

  titleWrap.append(titleText, titleInput);
  trigger.append(chevron, titleWrap);
  header.appendChild(trigger);

  // Actions: edit icon + menu (⋮)
  const actions = document.createElement("div");
  actions.className = "task-card__actions";

  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.className = "task-card__edit";
  editButton.setAttribute("aria-label", "Edit task");
  editButton.setAttribute("data-action", "toggle-edit");
  editButton.textContent = "✎";

  const menuButton = document.createElement("button");
  menuButton.type = "button";
  menuButton.className = "task-card__menu-btn";
  menuButton.setAttribute("aria-label", "More actions");
  menuButton.setAttribute("aria-haspopup", "true");
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("data-action", "menu");
  menuButton.textContent = "⋮";

  const menuList = document.createElement("ul");
  menuList.className = "task-card__menu-list";
  menuList.setAttribute("role", "menu");
  menuList.hidden = true;

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "task-card__delete";
  deleteBtn.setAttribute("data-action", "delete");
  deleteBtn.innerHTML = "🗑 Delete";
  const deleteLi = document.createElement("li");
  deleteLi.appendChild(deleteBtn);
  menuList.appendChild(deleteLi);

  actions.append(editButton, menuButton, menuList);
  header.appendChild(actions);
  card.appendChild(header);

  // --- Collapsible body ---
  buildTaskCardBody(card, task);
  return card;
}

/**
 * Build the collapsible card body and append it to the card.
 *
 * Body contents (gated by `.is-editing` via CSS):
 *   - Priority select — always directly editable (onChange fires updateTask)
 *   - Due date — text display (view) vs <input type="date"> (edit mode)
 *   - Description — text display (view) vs <textarea> (edit mode)
 *   - Timestamps footer (created / updated)
 *
 * CSS `.is-editing` class on the card shows inputs and hides text spans.
 */
function buildTaskCardBody(card, task) {
  const body = document.createElement("div");
  body.className = "task-card__body";

  const bodyContent = document.createElement("div");
  bodyContent.className = "task-card__body-content";

  // Priority field — always directly editable (onChange → updateTask)
  const priorityField = document.createElement("div");
  priorityField.className = "task-card__field task-priority-field";
  const priorityLabel = document.createElement("label");
  priorityLabel.textContent = "Priority";
  const prioritySelect = createPrioritySelect(task.priority);
  prioritySelect.setAttribute("data-action", "change-priority");
  priorityField.append(priorityLabel, prioritySelect);
  bodyContent.appendChild(priorityField);

  // Due date field — editable only in edit mode
  const dueDateField = document.createElement("div");
  dueDateField.className = "task-card__field task-due-date-field";
  const dueDateLabel = document.createElement("label");
  dueDateLabel.textContent = "Due date";
  dueDateField.appendChild(dueDateLabel);

  const dueDateValue = document.createElement("span");
  dueDateValue.className = "task-card__field-value task-due-date-value";
  dueDateValue.textContent = task.dueDate
    ? formatTimestamp(task.dueDate)
    : "No due date";

  const dueDateInput = document.createElement("input");
  dueDateInput.type = "date";
  dueDateInput.className = "board-task-due-date board-task-due-date--input";
  dueDateInput.value = formatDateForInput(task.dueDate);
  dueDateInput.setAttribute("data-action", "change-due-date");
  dueDateInput.setAttribute("aria-label", "Due date");

  dueDateField.append(dueDateValue, dueDateInput);
  bodyContent.appendChild(dueDateField);

  // Description field — editable only in edit mode
  const descField = document.createElement("div");
  descField.className = "task-card__field task-description-field";
  const descLabel = document.createElement("label");
  descLabel.textContent = "Description";
  descField.appendChild(descLabel);

  const descValue = document.createElement("span");
  descValue.className = "task-card__field-value task-description-value";
  descValue.textContent = task.description ?? "No description provided.";

  const descTextarea = document.createElement("textarea");
  descTextarea.className =
    "board-task-description board-task-description--input";
  descTextarea.value = task.description ?? "";
  descTextarea.rows = 3;
  descTextarea.setAttribute("data-action", "edit-description");
  descTextarea.setAttribute("aria-label", "Description");

  descField.append(descValue, descTextarea);
  bodyContent.appendChild(descField);

  // Timestamps footer (created + updated)
  const timestamps = document.createElement("footer");
  timestamps.className = "task-card__timestamps";

  const createdMeta = document.createElement("span");
  createdMeta.innerHTML =
    `<span class="task-meta__label">Created</span>` +
    `<span class="task-meta__value">${formatTimestamp(task.createdAt)}</span>`;

  const updatedMeta = document.createElement("span");
  updatedMeta.innerHTML =
    `<span class="task-meta__label">Updated</span>` +
    `<span class="task-meta__value">${formatTimestamp(task.updatedAt)}</span>`;

  timestamps.append(createdMeta, updatedMeta);
  bodyContent.appendChild(timestamps);

  body.appendChild(bodyContent);
  card.appendChild(body);
}

/**
 * Render all project groups + their task cards into the container.
 *
 * Each project is an accordion: clicking the header expands / collapses
 * the task list. UI state (open projects) is read from the module-level
 * sets so it survives re-renders after mutations.
 */
function renderBoardGroups(groups, container) {
  if (!container) return;
  container.replaceChildren();

  if (!groups || groups.length === 0) {
    return;
  }

  groups.forEach(({ project, tasks }) => {
    const projectId = project ? String(project.id) : "unassigned";
    const groupSection = document.createElement("section");
    groupSection.className = "board-section board-group";
    groupSection.dataset.projectId = projectId;

    const heading = document.createElement("header");
    heading.className = "project-group__header";

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "project-group__trigger";
    trigger.setAttribute("data-action", "toggle-project");
    trigger.setAttribute(
      "aria-expanded",
      openProjects.has(projectId) ? "true" : "false",
    );

    const chevron = document.createElement("span");
    chevron.className = "project-group__chevron";
    chevron.setAttribute("aria-hidden", "true");
    chevron.textContent = "▶";

    const title = document.createElement("h2");
    title.className = "project-group__title";
    title.textContent = project ? project.name : "Unassigned";

    const countBadge = document.createElement("span");
    countBadge.className = "project-group__count";
    countBadge.textContent = `${tasks.length} task${tasks.length !== 1 ? "s" : ""}`;

    trigger.append(chevron, title, countBadge);
    heading.appendChild(trigger);
    groupSection.appendChild(heading);

    const list = document.createElement("ul");
    list.className = "project-group__list";
    tasks.forEach((task) => {
      list.appendChild(createTaskCardElement(task));
    });

    const groupBody = document.createElement("div");
    groupBody.className = "project-group__body";
    if (openProjects.has(projectId)) {
      groupSection.classList.add("is-open");
    }
    groupBody.append(list);
    groupSection.appendChild(groupBody);

    container.appendChild(groupSection);
  });
}

// Toggle empty state visibility.
function renderBoardEmptyState(emptyStateElement, isEmpty) {
  if (!emptyStateElement) return;
  emptyStateElement.hidden = !isEmpty;
}

export {
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
  expandProject,
  expandTask,
  resetBoardUiState,
};
