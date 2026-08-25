export function renderAppView(state) {
  const authView = document.querySelector("#auth-view");
  const workspaceView = document.querySelector("#workspace-view");
  const profileButton = document.querySelector("#profile-button");

  const isAuthenticated = state.status === "authenticated";

  authView.hidden = isAuthenticated;
  workspaceView.hidden = !isAuthenticated;

  if (profileButton) {
    profileButton.hidden = !isAuthenticated;
  }
}
