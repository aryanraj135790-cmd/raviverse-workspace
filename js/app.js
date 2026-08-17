// Format numbers
function formatStatNumber(num) {
  if (typeof num !== "number" || !Number.isFinite(num)) {
    return num;
  }
  const absNum = Math.abs(num);
  if (absNum < 1000) {
    return num.toString();
  }
  const units = ["", "K", "M", "B", "T"];
  const i = Math.min(Math.floor(Math.log10(absNum) / 3), units.length - 1);
  const scaled = num / Math.pow(1000, i);
  const formatted = scaled.toFixed(1);
  return (
    (formatted.endsWith(".0") ? formatted.slice(0, -2) : formatted) + units[i]
  );
}

// Update Dashboard Stats
function renderDashboardStats(data, elementsMap) {
  if (!elementsMap || typeof elementsMap !== "object") {
    throw new Error("Invalid elements map provided to renderDashboardStats.");
  }
  if (!data || typeof data !== "object") {
    throw new Error(`Invalid data object provided: ${JSON.stringify(data)}`);
  }

  Object.entries(data).forEach(([key, value]) => {
    const statElement = elementsMap[key];

    if (statElement) {
      const nextValue = String(formatStatNumber(value));
      // Prevent unnecessary DOM updates
      if (statElement.textContent !== nextValue) {
        statElement.textContent = nextValue;
      }
    } else {
      console.warn(
        `Dashboard element for stat key "${key}" was not found in the elements map.`,
      );
    }
  });
}

// Get Dashboard Stats
function getDashboardStatElements() {
  const dashboardStatElements = document.querySelectorAll(
    "[data-dashboard-stat]",
  );
  return Array.from(dashboardStatElements).reduce(
    (accumulator, currentElement) => {
      const statKey = currentElement.getAttribute("data-dashboard-stat");
      accumulator[statKey] = currentElement;
      return accumulator;
    },
    {},
  );
}

// Delay Tool
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function isValidId(id) {
  return Number.isInteger(id) && id > 0;
}

// Get dashboard status element
function getDashboardStatusElement() {
  return document.querySelector("#dashboard-status");
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

  data.projects.forEach((project, index) => {
    validateProject(project, index);
  });

  data.tasks.forEach((task, index) => {
    validateTask(task, index);
  });

  data.notes.forEach((note, index) => {
    validateNote(note, index);
  });

  return data;
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
      `Invalid task at index ${index}: 'id' must be a positive integer, 'title' must be a non-empty string, and 'status' must be "completed" or "pending".`,
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

// Fetch Data From Server
async function getRaviVerseData() {
  await delay(2000);
  let response;
  try {
    response = await fetch("../data/raviverse.json");
  } catch (networkError) {
    throw new Error("Network failure: Unable to fetch RaviVerse data.", {
      cause: networkError,
    });
  }
  if (!response.ok) {
    throw new Error(`HTTP failure: Server returned ${response.status}.`, {
      cause: new Error(response.statusText || "Unknown HTTP error"),
    });
  }
  let data;
  try {
    data = await response.json();
  } catch (jsonError) {
    throw new Error("Data parsing failure: Invalid RaviVerse JSON.", {
      cause: jsonError,
    });
  }

  return validateRaviVerseData(data);
}
// Calculate dashboard statistics
function calculateDashboardStats(raviVerseData) {
  const taskStats = raviVerseData.tasks.reduce(
    (acc, curr) => ({
      totalTasks: acc.totalTasks + 1,
      completedTasks:
        acc.completedTasks + (curr.status === "completed" ? 1 : 0),
      pendingTasks: acc.pendingTasks + (curr.status === "pending" ? 1 : 0),
    }),
    {
      totalTasks: 0,
      completedTasks: 0,
      pendingTasks: 0,
    },
  );

  return {
    projects: raviVerseData.projects.length,
    tasks: taskStats.totalTasks,
    notes: raviVerseData.notes.length,
    completedTasks: taskStats.completedTasks,
    pendingTasks: taskStats.pendingTasks,
  };
}
// Get and transform dashboard data
async function getDashboardData() {
  const raviVerseData = await getRaviVerseData();
  return calculateDashboardStats(raviVerseData);
}

// dashboard initialization
async function initDashboard() {
  const statusElement = getDashboardStatusElement();
  const dashboardElementsMap = getDashboardStatElements();

  try {
    statusElement.textContent = "Loading dashboard...";
    const dashboardData = await getDashboardData();
    renderDashboardStats(dashboardData, dashboardElementsMap);
    statusElement.textContent = "Dashboard loaded.";
  } catch (error) {
    if (error.cause) {
      console.dir("Original System Error Details:", error.cause);
    }
    console.error("Dashboard Init Failed ->", error.message);
    statusElement.textContent = "Dashboard initialization failed.";
  }
}

initDashboard();
