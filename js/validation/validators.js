function isValidId(id) {
  return Number.isInteger(id) && id > 0;
}

// Validate Our Project Data
function validateProject(project, index) {
  if (!project) {
    throw new Error(
      `Invalid project at index ${index}: Project cannot be null or undefined.`,
    );
  }
  if (
    !isValidId(project.id) ||
    typeof project.name !== "string" ||
    !project.name.trim()
  ) {
    throw new Error(
      `Invalid project at index ${index}: 'id' must be a positive integer and 'name' must be a non-empty string.`,
    );
  }
}

// Validate Our Task Data
function validateTask(task, index) {
  if (!task) {
    throw new Error(
      `Invalid task at index ${index}: Task cannot be null or undefined.`,
    );
  }

  if (
    !isValidId(task.id) ||
    typeof task.title !== "string" ||
    !task.title.trim() ||
    (task.status !== "completed" && task.status !== "pending")
  ) {
    throw new Error(
      `Invalid task at index ${index}: 'id' must be a positive integer, 'title' must be a non-empty string, and 'status' must be 'completed' or 'pending'.`,
    );
  }
}

// Validate Our Notes Data
function validateNote(note, index) {
  if (!note) {
    throw new Error(
      `Invalid note at index ${index}: Note cannot be null or undefined.`,
    );
  }
  if (
    !isValidId(note.id) ||
    typeof note.title !== "string" ||
    !note.title.trim()
  ) {
    throw new Error(
      `Invalid note at index ${index}: 'id' must be a positive integer and 'title' must be a non-empty string.`,
    );
  }
}

// Validate Our Activity Data
function validateActivity(activity, index) {
  const prefix = typeof index === "number" ? `[Index ${index}] ` : "";
  if (!activity || typeof activity !== "object" || Array.isArray(activity)) {
    throw new Error(`${prefix}Activity must be a valid, non-null object.`);
  }
  const { id, type, entityType, entityId, createdAt } = activity;
  if (typeof id !== "number" || !Number.isInteger(id) || id <= 0) {
    throw new Error(
      `${prefix}Invalid 'id': Expected a positive integer, received: ${id}`,
    );
  }
  const allowedEntityTypes = ["project", "task", "note"];
  if (!allowedEntityTypes.includes(entityType)) {
    throw new Error(
      `${prefix}Invalid 'entityType': Expected one of [${allowedEntityTypes.join(", ")}], received: '${entityType}'`,
    );
  }
  const allowedTypes = [
    "project_created",
    "project_updated",
    "task_created",
    "task_updated",
    "task_completed",
    "note_created",
    "note_updated",
  ];
  if (!allowedTypes.includes(type)) {
    throw new Error(
      `${prefix}Invalid 'type': Received an unauthorized activity type string: '${type}'`,
    );
  }
  if (
    typeof entityId !== "number" ||
    !Number.isInteger(entityId) ||
    entityId <= 0
  ) {
    throw new Error(
      `${prefix}Invalid 'entityId': Expected a positive integer, received: ${entityId}`,
    );
  }
  if (typeof createdAt !== "string" || !createdAt.trim()) {
    throw new Error(
      `${prefix}Invalid 'createdAt': Expected a non-empty string, received: '${createdAt}'`,
    );
  }
  const parsedDate = Date.parse(createdAt);
  if (
    typeof createdAt !== "string" ||
    !createdAt.trim() ||
    Number.isNaN(parsedDate) ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(createdAt)
  ) {
    throw new Error(
      `${prefix}Invalid 'createdAt': Expected a valid parseable date string, received: '${createdAt}'`,
    );
  }
}
// Validate Our API response
function validateRaviVerseData(data) {
  if (!data) {
    throw new Error(
      "Validation failure: Data does not exist (null or undefined).",
    );
  }

  if (typeof data !== "object" || Array.isArray(data)) {
    throw new Error(
      "Validation failure: Data is not a valid configuration object.",
    );
  }

  if (!Array.isArray(data.projects)) {
    throw new Error(
      "Validation failure: 'projects' property missing or is not an array.",
    );
  }

  if (!Array.isArray(data.tasks)) {
    throw new Error(
      "Validation failure: 'tasks' property missing or is not an array.",
    );
  }

  if (!Array.isArray(data.notes)) {
    throw new Error(
      "Validation failure: 'notes' property missing or is not an array.",
    );
  }
  if (!Array.isArray(data.activities)) {
    throw new Error(
      "Validation failure: 'activity' property missing or is not an array.",
    );
  }

  data.projects.forEach((project, index) => {
    validateProject(project, index);
  });

  data.tasks.forEach((task, index) => {
    validateTask(task, index);
  });

  data.notes.forEach((note, index) => {
    validateNote(note, index);
  });
  data.activities.forEach((activity, index) => {
    validateActivity(activity, index);
  });

  return data;
}
export { validateRaviVerseData };
