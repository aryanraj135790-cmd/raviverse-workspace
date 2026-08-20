let currentToast = null;
let currentToastTimer = null;
function getToastContainer() {
  return document.querySelector("#toast-container");
}
function showToast(message, type) {
  const toastContainer = getToastContainer();
  if (currentToastTimer) {
    clearTimeout(currentToastTimer);
    currentToastTimer = null;
  }
  if (currentToast) {
    currentToast.remove();
    currentToast = null;
  }
  const duration = type === "success" ? 3000 : 5000;
  currentToast = document.createElement("div");
  currentToast.textContent = message;
  currentToast.classList.add("toast", `toast-${type}`);
  toastContainer.append(currentToast);
  const targetToast = currentToast;
  currentToastTimer = setTimeout(() => {
    removeToastWithAnimation(targetToast);
  }, duration);
}
function removeToastWithAnimation(toast) {
  if (!toast || !toast.isConnected) {
    cleanupToastState(toast);
    return;
  }
  if (currentToastTimer) {
    clearTimeout(currentToastTimer);
    currentToastTimer = null;
  }
  toast.classList.add("toast-exit");
  const computedStyle = window.getComputedStyle(toast);
  const hasAnimation =
    computedStyle.animationName !== "none" &&
    parseFloat(computedStyle.animationDuration) > 0;
  let isCleanedUp = false;
  const performRemoval = () => {
    if (isCleanedUp) return;
    isCleanedUp = true;
    toast.remove();
    cleanupToastState(toast);
  };

  if (hasAnimation) {
    toast.addEventListener("animationend", performRemoval, { once: true });
    const durationMs =
      (parseFloat(computedStyle.animationDuration) || 0) * 1000;
    setTimeout(performRemoval, durationMs + 100);
  } else {
    performRemoval();
  }
}
function cleanupToastState(toast) {
  if (currentToast === toast) {
    currentToast = null;
    currentToastTimer = null;
  }
}
export { showToast };
