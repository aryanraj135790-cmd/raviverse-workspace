import { validateRaviVerseData } from "../validation/validators.js";

// Delay Tool
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Fetch Data From Server
async function getRaviVerseData() {
  // await delay(3000);
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
export { getRaviVerseData };
