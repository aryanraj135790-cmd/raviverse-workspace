import { logoutUser } from "./auth-action.js";

export function setupAuthUI() {
  const profileButton = document.querySelector("#profile-button");

  if (!profileButton) {
    return;
  }

  profileButton.addEventListener("click", async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  });
}
