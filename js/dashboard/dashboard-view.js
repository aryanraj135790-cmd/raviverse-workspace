export function createDashboardView() {
  // Root Container
  const dashboardView = document.createElement("section");

  // Main Content Wrapper
  const mainContent = document.createElement("div");
  mainContent.className = "main-content";

  // Header Section Layout
  const header = document.createElement("header");

  const headerTextContainer = document.createElement("div");
  const h1 = document.createElement("h1");
  h1.textContent = "Dashboard";
  const headerSubtitle = document.createElement("p");
  headerSubtitle.textContent = "Welcome to your RaviVerse Workspace.";
  headerTextContainer.append(h1, headerSubtitle);

  const refreshButton = document.createElement("button");
  refreshButton.id = "dashboard-refresh";
  refreshButton.type = "button";
  refreshButton.textContent = "Refresh Dashboard";

  header.append(headerTextContainer, refreshButton);

  // Status Indicator (Accessibility Screen Reader Element)
  const statusIndicator = document.createElement("p");
  statusIndicator.id = "dashboard-status";
  statusIndicator.className = "sr-only";
  statusIndicator.setAttribute("role", "status");
  statusIndicator.textContent = "Dashboard is ready.";

  // Quick Overview Grid Content Block
  const overviewSection = document.createElement("section");
  overviewSection.className = "dashboard-section";

  const overviewHeading = document.createElement("h2");
  overviewHeading.textContent = "Quick Overview";

  const overviewGrid = document.createElement("div");
  overviewGrid.className = "overview-grid";

  // Configuration helper to spin up statistical cards cleanly without code repetition
  const statsConfig = [
    { title: "Projects", statKey: "projects" },
    { title: "Tasks", statKey: "tasks" },
    { title: "Notes", statKey: "notes" },
    { title: "Completed Tasks", statKey: "completedTasks" },
    { title: "Pending Tasks", statKey: "pendingTasks" },
  ];

  statsConfig.forEach(({ title, statKey }) => {
    const card = document.createElement("div");
    card.className = "overview-item";

    const cardHeading = document.createElement("h3");
    cardHeading.textContent = title;

    const cardValue = document.createElement("p");
    cardValue.className = "overview-value";
    cardValue.setAttribute("data-dashboard-stat", statKey);
    cardValue.textContent = "0";

    card.append(cardHeading, cardValue);
    overviewGrid.appendChild(card);
  });

  overviewSection.append(overviewHeading, overviewGrid);

  // Recent Activity Log Layout Block
  const activitySection = document.createElement("section");
  activitySection.className = "dashboard-section";

  const activityHeading = document.createElement("h2");
  activityHeading.textContent = "Recent Activity";

  const activityList = document.createElement("ul");
  activityList.id = "recent-activity-list";
  activityList.className = "recent-activity-list";

  activitySection.append(activityHeading, activityList);

  mainContent.append(header, statusIndicator, overviewSection, activitySection);
  dashboardView.appendChild(mainContent);

  return dashboardView;
}
