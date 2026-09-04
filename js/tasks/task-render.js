import { createSvg, ICONS } from "./task-view";

// Formats a due date for display helper function.
export function formatDueDate(dueDate) {
  if (!dueDate) return "";
  const date = new Date(dueDate + "T00:00:00");
  if (isNaN(date.getTime())) return "";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date.getTime() === today.getTime()) return "Today";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Meta row for a task card, showing project, due date, and priority.
function renderTaskCardMeta(task, projectName = "Unknown") {
  const formattedDate = formatDueDate(task.dueDate);
  const priority = (task.priority || "medium").toLowerCase();
  if (!projectName && !formattedDate && !priority) {
    return null;
  }
  const metaRow = document.createElement("div");
  metaRow.className = "task-card-meta";
  if (projectName) {
    const projectPill = document.createElement("span");
    projectPill.className = "task-project-pill";

    const folderIcon = createSvg(ICONS.folder);
    const projectText = document.createTextNode(projectName);

    projectPill.append(folderIcon, projectText);
    metaRow.appendChild(projectPill);
  }
  if (formattedDate) {
    const duePill = document.createElement("span");
    duePill.className = `task-due${formattedDate === "Today" ? " task-due--today" : ""}`;
    const clockIcon = createSvg(ICONS.clock);
    const dateText = document.createTextNode(formattedDate);

    duePill.append(clockIcon, dateText);
    metaRow.appendChild(duePill);
  }
  if (priority) {
    const priorityPill = document.createElement("span");
    priorityPill.className = `task-priority task-priority--${priority}`;

    const dot = document.createElement("span");
    dot.className = "task-priority-dot";

    const priorityLabel = document.createElement("span");
    priorityLabel.textContent =
      priority.charAt(0).toUpperCase() + priority.slice(1);

    priorityPill.append(dot, priorityLabel);
    metaRow.appendChild(priorityPill);
  }

  return metaRow;
}
// creates a DOM element for a task card.
export function renderTaskCard(task, projectName) {
  const root = document.createElement("div");
  root.className = "task-card";
  if (task.status === "completed") {
    root.classList.add("task-card--completed");
  }
  // LEFT column: checkbox or dot
  const checkCol = document.createElement("div");
  checkCol.className = "task-card-check";

  if (task.status === "in_progress") {
    const dot = document.createElement("div");
    dot.className = "task-status-dot";
    dot.dataset.action = "toggle-status";
    dot.setAttribute("role", "button");
    dot.setAttribute("tabindex", "0");
    checkCol.appendChild(dot);
  } else {
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.className = "task-checkbox";
    cb.checked = task.status === "completed";
    checkCol.appendChild(cb);
  }

  // RIGHT column: holds title + desc + meta
  const bodyCol = document.createElement("div");
  bodyCol.className = "task-card-body";

  const title = document.createElement("h4");
  title.className = "task-card-title";
  title.textContent = task.title;
  bodyCol.appendChild(title);

  if (task.description && task.description.trim() !== "") {
    const desc = document.createElement("p");
    desc.className = "task-card-desc";
    desc.textContent = task.description;
    bodyCol.appendChild(desc);
  }
  const menuWrap = document.createElement("div");
  menuWrap.className = "task-card-menu-wrap";

  const kebabBtn = document.createElement("button");
  kebabBtn.className = "task-kebab";
  kebabBtn.dataset.action = "menu-toggle";
  kebabBtn.dataset.taskId = task.id;
  kebabBtn.setAttribute("aria-label", "Task actions");
  kebabBtn.appendChild(createSvg(ICONS.kebab));

  // Dropdown Menu
  const menu = document.createElement("div");
  menu.className = "task-card-menu";
  menu.hidden = true;

  const editBtn = document.createElement("button");
  editBtn.className = "task-menu-item";
  editBtn.dataset.action = "edit";
  editBtn.dataset.taskId = task.id;
  editBtn.textContent = "Edit";

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "task-menu-item task-menu-item--danger";
  deleteBtn.dataset.action = "delete";
  deleteBtn.dataset.taskId = task.id;
  deleteBtn.textContent = "Delete";

  menu.append(editBtn, deleteBtn);
  menuWrap.append(kebabBtn, menu);
  bodyCol.appendChild(menuWrap);

  const metaRow = renderTaskCardMeta(task, projectName);
  if (metaRow) {
    bodyCol.appendChild(metaRow);
  }

  // assemble
  root.appendChild(checkCol);
  root.appendChild(bodyCol);
  return root;
}

export function renderTasks(container, tasks, projectNames) {
  if (!container) return;
  container.replaceChildren(
    ...tasks.map((task) =>
      renderTaskCard(task, projectNames[task.projectId] ?? "Unknown"),
    ),
  );
}
