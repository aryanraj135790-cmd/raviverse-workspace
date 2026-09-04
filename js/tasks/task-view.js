// SVG Helper to ensure proper namespace and attributes
export function createSvg(pathD, viewBox = "0 0 24 24", className = "") {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  if (className) svg.setAttribute("class", className);
  svg.setAttribute("viewBox", viewBox);
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", pathD);
  svg.appendChild(path);

  return svg;
}

// Icon Paths Mapping
export const ICONS = {
  hamburger: "M4 6h16M4 12h16M4 18h16",
  plus: "M12 4v16m8-8H4",
  search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  close: "M6 18L18 6M6 6l12 12",
  trash:
    "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
  folder:
    "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z",
  clock: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  kebab:
    "M12 8a2 2 0 100-4 2 2 0 000 4zm0 6a2 2 0 100-4 2 2 0 000 4zm0 6a2 2 0 100-4 2 2 0 000 4z",
};

// Builds the New Task or Edit Task Modal
function createFormModal({ modalType, titleText, formType, submitText }) {
  const backdrop = document.createElement("div");
  backdrop.className = "task-modal-backdrop";
  backdrop.dataset.modal = modalType;
  backdrop.hidden = true;

  const panel = document.createElement("div");
  panel.className = "task-modal-panel";

  // Modal Header
  const header = document.createElement("div");
  header.className = "task-modal-header";

  const title = document.createElement("h3");
  title.className = "task-modal-title";
  title.textContent = titleText;

  const closeBtn = document.createElement("button");
  closeBtn.className = "task-modal-close";
  closeBtn.dataset.modalClose = "";
  closeBtn.setAttribute("aria-label", "Close");
  closeBtn.appendChild(createSvg(ICONS.close));

  header.append(title, closeBtn);

  // Modal Form
  const form = document.createElement("form");
  form.className = "task-modal-body";
  form.dataset.form = formType;

  // Title Field
  const titleField = document.createElement("div");
  titleField.className = "task-modal-field";
  const titleLabel = document.createElement("label");
  titleLabel.className = "task-modal-label";
  titleLabel.textContent = "Title";
  const titleInput = document.createElement("input");
  titleInput.className = "task-modal-input";
  titleInput.dataset.field = "title";
  titleInput.type = "text";
  titleInput.required = true;
  titleField.append(titleLabel, titleInput);

  // Description Field
  const descField = document.createElement("div");
  descField.className = "task-modal-field";
  const descLabel = document.createElement("label");
  descLabel.className = "task-modal-label";
  descLabel.textContent = "Description";
  const descTextarea = document.createElement("textarea");
  descTextarea.className = "task-modal-textarea";
  descTextarea.dataset.field = "description";
  descField.append(descLabel, descTextarea);

  // Grid Fields (Project, Priority, Due Date)
  const grid = document.createElement("div");
  grid.className = "task-modal-grid";

  // Project
  const projectField = document.createElement("div");
  projectField.className = "task-modal-field";
  const projectLabel = document.createElement("label");
  projectLabel.className = "task-modal-label";
  projectLabel.textContent = "Project";
  const projectSelect = document.createElement("select");
  projectSelect.className = "task-modal-select";
  projectSelect.dataset.field = "project";
  projectField.append(projectLabel, projectSelect);

  // Priority
  const priorityField = document.createElement("div");
  priorityField.className = "task-modal-field";
  const priorityLabel = document.createElement("label");
  priorityLabel.className = "task-modal-label";
  priorityLabel.textContent = "Priority";
  const prioritySelect = document.createElement("select");
  prioritySelect.className = "task-modal-select";
  prioritySelect.dataset.field = "priority";

  ["Medium", "High", "Low"].forEach((level) => {
    const opt = document.createElement("option");
    opt.value = level.toLowerCase();
    opt.textContent = level;
    prioritySelect.appendChild(opt);
  });
  priorityField.append(priorityLabel, prioritySelect);

  // Due Date
  const dateField = document.createElement("div");
  dateField.className = "task-modal-field";
  const dateLabel = document.createElement("label");
  dateLabel.className = "task-modal-label";
  dateLabel.textContent = "Due Date";
  const dateInput = document.createElement("input");
  dateInput.className = "task-modal-input";
  dateInput.dataset.field = "dueDate";
  dateInput.type = "date";
  dateField.append(dateLabel, dateInput);

  grid.append(projectField, priorityField, dateField);
  form.append(titleField, descField, grid);

  // Modal Footer
  const footer = document.createElement("div");
  footer.className = "task-modal-footer";

  const cancelBtn = document.createElement("button");
  cancelBtn.className = "btn-secondary";
  cancelBtn.dataset.modalCancel = "";
  cancelBtn.textContent = "Cancel";

  const submitBtn = document.createElement("button");
  submitBtn.className = "btn-primary";
  submitBtn.type = "submit";
  submitBtn.dataset.modalSubmit = "";
  submitBtn.textContent = submitText;

  footer.append(cancelBtn, submitBtn);
  panel.append(header, form, footer);
  backdrop.appendChild(panel);

  return backdrop;
}

// The Delete Confirmation Modal
function createDeleteModal() {
  const backdrop = document.createElement("div");
  backdrop.className = "task-modal-backdrop";
  backdrop.dataset.modal = "delete";
  backdrop.hidden = true;

  const panel = document.createElement("div");
  panel.className = "task-modal-panel task-modal-panel--danger";

  const dangerBody = document.createElement("div");
  dangerBody.className = "task-modal-danger-body";

  const iconDiv = document.createElement("div");
  iconDiv.className = "task-modal-danger-icon";
  iconDiv.appendChild(createSvg(ICONS.trash));

  const title = document.createElement("h3");
  title.className = "task-modal-danger-title";
  title.textContent = "Delete task?";

  const text = document.createElement("p");
  text.className = "task-modal-danger-text";
  text.textContent = "This action cannot be undone.";

  dangerBody.append(iconDiv, title, text);

  const footer = document.createElement("div");
  footer.className = "task-modal-footer";

  const cancelBtn = document.createElement("button");
  cancelBtn.className = "btn-secondary";
  cancelBtn.dataset.modalCancel = "";
  cancelBtn.textContent = "Cancel";

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "task-btn-danger";
  deleteBtn.dataset.deleteConfirm = "";
  deleteBtn.textContent = "Delete Task";

  footer.append(cancelBtn, deleteBtn);
  panel.append(dangerBody, footer);
  backdrop.appendChild(panel);

  return backdrop;
}

/**
 * Creates the task view DOM structure
 * @returns {HTMLElement}
 */
export function createTaskView() {
  const main = document.createElement("main");
  main.className = "task-app";

  // Mobile Header
  const mobileHeader = document.createElement("header");
  mobileHeader.className = "task-mobile-header";

  const mobileBrand = document.createElement("div");
  mobileBrand.className = "task-mobile-brand";
  const logo = document.createElement("div");
  logo.className = "task-mobile-logo";
  logo.textContent = "R";
  const brandName = document.createElement("span");
  brandName.textContent = "RaviVerse";
  mobileBrand.append(logo, brandName);

  const mobileMenuBtn = document.createElement("button");
  mobileMenuBtn.className = "task-mobile-menu-btn";
  mobileMenuBtn.dataset.mobileMenuBtn = "";
  mobileMenuBtn.setAttribute("aria-label", "Open menu");
  mobileMenuBtn.appendChild(createSvg(ICONS.hamburger));

  mobileHeader.append(mobileBrand, mobileMenuBtn);

  // Scroll Area & Container
  const scrollArea = document.createElement("div");
  scrollArea.className = "task-scroll";

  const container = document.createElement("div");
  container.className = "task-container";

  // Title Bar
  const titleBar = document.createElement("div");
  titleBar.className = "task-titlebar";

  const titleTextGroup = document.createElement("div");
  const title = document.createElement("h2");
  title.className = "task-title";
  title.textContent = "Tasks";
  const subtitle = document.createElement("p");
  subtitle.className = "task-subtitle";
  subtitle.textContent =
    "Manage your work and keep track of what needs to be done.";
  titleTextGroup.append(title, subtitle);

  const newTaskBtn = document.createElement("button");
  newTaskBtn.className = "btn-primary";
  newTaskBtn.dataset.newTaskBtn = "";
  newTaskBtn.appendChild(createSvg(ICONS.plus));
  const btnSpan = document.createElement("span");
  btnSpan.textContent = "New Task";
  newTaskBtn.appendChild(btnSpan);

  titleBar.append(titleTextGroup, newTaskBtn);

  // Tabs
  const tabsNav = document.createElement("nav");
  tabsNav.className = "task-tabs";

  const tabsData = [
    { id: "all", label: "All Tasks", active: true },
    { id: "todo", label: "To Do", active: false },
    { id: "inprogress", label: "In Progress", active: false },
    { id: "completed", label: "Completed", active: false },
  ];

  tabsData.forEach((tab) => {
    const button = document.createElement("button");
    button.className = `task-tab${tab.active ? " task-tab--active" : ""}`;
    button.dataset.tab = tab.id;
    button.textContent = `${tab.label} `;

    const count = document.createElement("span");
    count.className = `task-tab-count task-tab-count--${tab.active ? "active" : "muted"}`;
    count.dataset.tabCount = tab.id;
    count.textContent = "0";

    button.appendChild(count);
    tabsNav.appendChild(button);
  });

  // Toolbar
  const toolbar = document.createElement("div");
  toolbar.className = "task-toolbar";

  const searchWrap = document.createElement("div");
  searchWrap.className = "task-search-wrap";
  const searchIcon = createSvg(ICONS.search, "0 0 24 24", "task-search-icon");
  const searchInput = document.createElement("input");
  searchInput.className = "task-search";
  searchInput.dataset.searchInput = "";
  searchInput.type = "text";
  searchInput.placeholder = "Search tasks...";
  searchWrap.append(searchIcon, searchInput);

  const filtersWrap = document.createElement("div");
  filtersWrap.className = "task-filters";

  // Priority Filter Select
  const prioritySelect = document.createElement("select");
  prioritySelect.className = "task-select";
  prioritySelect.dataset.filter = "priority";
  const priorityOptions = [
    { value: "", text: "Priority: All" },
    { value: "high", text: "High" },
    { value: "medium", text: "Medium" },
    { value: "low", text: "Low" },
  ];
  priorityOptions.forEach((opt) => {
    const option = document.createElement("option");
    option.value = opt.value;
    option.textContent = opt.text;
    prioritySelect.appendChild(option);
  });

  // Project Filter Select
  const projectSelect = document.createElement("select");
  projectSelect.className = "task-select";
  projectSelect.dataset.filter = "project";
  const defaultProjectOpt = document.createElement("option");
  defaultProjectOpt.value = "";
  defaultProjectOpt.textContent = "Project: All";
  projectSelect.appendChild(defaultProjectOpt);

  // Sort Select
  const sortSelect = document.createElement("select");
  sortSelect.className = "task-select";
  sortSelect.dataset.sort = "";
  const sortOptions = [
    { value: "due", text: "Sort: Due date" },
    { value: "priority", text: "Sort: Priority" },
    { value: "created", text: "Sort: Recently created" },
    { value: "updated", text: "Sort: Recently updated" },
  ];
  sortOptions.forEach((opt) => {
    const option = document.createElement("option");
    option.value = opt.value;
    option.textContent = opt.text;
    sortSelect.appendChild(option);
  });

  filtersWrap.append(prioritySelect, projectSelect, sortSelect);
  toolbar.append(searchWrap, filtersWrap);

  // Task List Mount Point
  const taskList = document.createElement("div");
  taskList.className = "task-list";
  taskList.dataset.taskList = "";

  // Empty State
  const emptyState = document.createElement("div");
  emptyState.className = "task-empty";
  emptyState.dataset.noResults = "";
  emptyState.hidden = true;

  const emptyIconWrap = document.createElement("div");
  emptyIconWrap.className = "task-empty-icon";
  emptyIconWrap.appendChild(createSvg(ICONS.search));

  const emptyTitle = document.createElement("h3");
  emptyTitle.className = "task-empty-title";
  emptyTitle.textContent = "No matching tasks";

  const emptyText = document.createElement("p");
  emptyText.className = "task-empty-text";
  emptyText.textContent =
    "Try changing your search keywords or clear current filters.";

  const clearFiltersBtn = document.createElement("button");
  clearFiltersBtn.className = "btn-secondary";
  clearFiltersBtn.dataset.clearFilters = "";
  clearFiltersBtn.textContent = "Clear filters";

  emptyState.append(emptyIconWrap, emptyTitle, emptyText, clearFiltersBtn);

  // Assemble Main Scrollable Container
  container.append(titleBar, tabsNav, toolbar, taskList, emptyState);
  scrollArea.appendChild(container);

  // 3. Modals
  const newTaskModal = createFormModal({
    modalType: "newTask",
    titleText: "Create Task",
    formType: "newTask",
    submitText: "Create Task",
  });

  const editTaskModal = createFormModal({
    modalType: "editTask",
    titleText: "Edit Task",
    formType: "editTask",
    submitText: "Save Changes",
  });

  const deleteModal = createDeleteModal();

  // Root Tree Assembly
  main.append(
    mobileHeader,
    scrollArea,
    newTaskModal,
    editTaskModal,
    deleteModal,
  );

  return main;
}
