// Format numbers
function formatStatNumber(num) {
  if (typeof num !== "number") return num;
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
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
      statElement.textContent = formatStatNumber(value);
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

// Status Update
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
    typeof project.id !== "number" ||
    typeof project.name !== "string" ||
    !project.name.trim()
  ) {
    throw new Error(
      `Invalid project at index ${index}: 'id' must be a number and 'name' must be a non-empty string.`,
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
    typeof task.id !== "number" ||
    typeof task.title !== "string" ||
    !task.title.trim() ||
    (task.status !== "completed" && task.status !== "pending")
  ) {
    throw new Error(
      `Invalid task at index ${index}: 'id' must be a number, 'title' must be a non-empty string, and 'status' must be "completed" or "pending".`,
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
    typeof note.id !== "number" ||
    typeof note.title !== "string" ||
    !note.title.trim()
  ) {
    throw new Error(
      `Invalid note at index ${index}: 'id' must be a number and 'title' must be a non-empty string.`,
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

// Transform Our Data
async function getDashboardData() {
  const raviVerseData = await getRaviVerseData();
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
  const dashboardData = {
    projects: raviVerseData.projects.length,
    tasks: taskStats.totalTasks,
    notes: raviVerseData.notes.length,
    completedTasks: taskStats.completedTasks,
    pendingTasks: taskStats.pendingTasks,
  };
  return dashboardData;
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
