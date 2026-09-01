// Resolve board DOM references — mirrors dashboard-dom.js.
function getBoardRefreshElement() {
  return document.querySelector("#board-refresh");
}

function getBoardStatusElement() {
  return document.querySelector("#board-status");
}

function getBoardFormElement() {
  return document.querySelector("#board-create-task-form");
}

function getBoardTitleInputElement() {
  return document.querySelector("#board-task-title");
}

function getBoardProjectSelectElement() {
  return document.querySelector("#board-task-project");
}

function getBoardSubmitButtonElement() {
  return document.querySelector("#board-task-submit");
}

function getBoardGroupsContainer() {
  return document.querySelector("#board-groups");
}

function getBoardEmptyStateElement() {
  return document.querySelector("#board-empty-state");
}

export function getBoardDom() {
  return {
    refresh: getBoardRefreshElement(),
    status: getBoardStatusElement(),
    form: getBoardFormElement(),
    titleInput: getBoardTitleInputElement(),
    projectSelect: getBoardProjectSelectElement(),
    submitButton: getBoardSubmitButtonElement(),
    groupsContainer: getBoardGroupsContainer(),
    emptyState: getBoardEmptyStateElement(),
  };
}

export {
  getBoardRefreshElement,
  getBoardStatusElement,
  getBoardFormElement,
  getBoardTitleInputElement,
  getBoardProjectSelectElement,
  getBoardSubmitButtonElement,
  getBoardGroupsContainer,
  getBoardEmptyStateElement,
};