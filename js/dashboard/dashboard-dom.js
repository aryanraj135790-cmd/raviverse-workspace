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

// Get dashboard status element
function getDashboardStatusElement() {
  return document.querySelector("#dashboard-status");
}

// Get dashboard refresh element
function getDashboardRefreshElement() {
  return document.querySelector("#dashboard-refresh");
}

// Recent Activity List Element
function getRecentActivityListElement() {
  return document.querySelector("#recent-activity-list");
}
// Get dashboard cards
function getDashboardStatCards() {
  const statElements = getDashboardStatElements();
  return Object.fromEntries(
    Object.entries(statElements).map(([key, element]) => [
      key,
      element.parentElement,
    ]),
  );
}
export {
  getDashboardStatusElement,
  getDashboardRefreshElement,
  getRecentActivityListElement,
  getDashboardStatElements,
  getDashboardStatCards,
};
