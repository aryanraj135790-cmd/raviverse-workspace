// Board view composition — mirrors dashboard-view.js structure.
export function createBoardView() {
  const boardView = document.createElement("section");

  const mainContent = document.createElement("div");
  mainContent.className = "main-content";

  // Header
  const header = document.createElement("header");

  const headerTextContainer = document.createElement("div");
  const h1 = document.createElement("h1");
  h1.textContent = "Task Board";
  const headerSubtitle = document.createElement("p");
  headerSubtitle.textContent = "Create, complete and manage your tasks.";
  headerTextContainer.append(h1, headerSubtitle);

  const refreshButton = document.createElement("button");
  refreshButton.id = "board-refresh";
  refreshButton.type = "button";
  refreshButton.textContent = "Refresh Board";

  header.append(headerTextContainer, refreshButton);

  // Status indicator (screen-reader)
  const statusIndicator = document.createElement("p");
  statusIndicator.id = "board-status";
  statusIndicator.className = "sr-only";
  statusIndicator.setAttribute("role", "status");
  statusIndicator.textContent = "Board is ready.";

  // New-task form
  const formSection = document.createElement("section");
  formSection.className = "board-section board-form-section";

  const form = document.createElement("form");
  form.id = "board-create-task-form";

  const titleInput = document.createElement("input");
  titleInput.id = "board-task-title";
  titleInput.type = "text";
  titleInput.name = "title";
  titleInput.placeholder = "Task title";
  titleInput.required = true;
  titleInput.setAttribute("aria-label", "Task title");

  const projectSelect = document.createElement("select");
  projectSelect.id = "board-task-project";
  projectSelect.name = "projectId";
  projectSelect.setAttribute("aria-label", "Project");
  const placeholderOption = document.createElement("option");
  placeholderOption.value = "";
  placeholderOption.textContent = "Select a project…";
  projectSelect.appendChild(placeholderOption);

  const submitButton = document.createElement("button");
  submitButton.id = "board-task-submit";
  submitButton.type = "submit";
  submitButton.textContent = "Add Task";

  form.append(titleInput, projectSelect, submitButton);
  formSection.appendChild(form);

  // Board groups container (project sections rendered into this)
  const groupsContainer = document.createElement("div");
  groupsContainer.id = "board-groups";

  // Empty state (shown when there are no projects/tasks)
  const emptyState = document.createElement("p");
  emptyState.id = "board-empty-state";
  emptyState.textContent = "No projects yet. Create one to start adding tasks.";
  emptyState.hidden = true;

  mainContent.append(header, statusIndicator, formSection, groupsContainer, emptyState);
  boardView.appendChild(mainContent);

  return boardView;
}