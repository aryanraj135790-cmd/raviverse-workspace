const routes = {};
let currentRoute = null;

export function registerRoute(hash, { mount, destroy }) {
  routes[hash] = { mount, destroy };
}

export function navigate(hash) {
  location.hash = hash;
}

function renderRoute() {
  const hash = location.hash;

  if (currentRoute && routes[currentRoute]?.destroy) {
    routes[currentRoute].destroy();
  }

  currentRoute = hash;

  if (routes[hash]?.mount) {
    routes[hash].mount();
  }
}

export function initRouter(defaultHash = "#/dashboard") {
  window.addEventListener("hashchange", renderRoute);

  if (!location.hash) {
    location.hash = defaultHash;
  } else {
    renderRoute();
  }
}
