import { getSession, onAuthStateChange } from "../supabase/auth.js";

function createAuthState(session) {
  return {
    status: session ? "authenticated" : "unauthenticated",
    session: session ?? null,
    user: session?.user ?? null,
  };
}

export async function initializeAuth(onStateUpdate) {
  let isInitialized = false;
  let currentAuthState = createAuthState(null);

  // SUBSCRIBE FIRST
  const { data: authListener } = onAuthStateChange((event, session) => {
    // Ignore INITIAL_SESSION from listener because getSession handles initialization
    if (event === "INITIAL_SESSION") return;

    currentAuthState = createAuthState(session);

    if (isInitialized && onStateUpdate) {
      onStateUpdate(currentAuthState);
    }
  });

  //  FETCH INITIAL SESSION
  try {
    const { data, error } = await getSession();
    if (error) throw error;

    if (data?.session) {
      currentAuthState = createAuthState(data.session);
    }
  } catch (error) {
    console.error("Failed to fetch initial auth session:", error);
    currentAuthState = createAuthState(null);
  }

  //  NOTIFY INITIAL STATE
  isInitialized = true;
  if (onStateUpdate) {
    onStateUpdate(currentAuthState);
  }

  // Return cleanup function
  return () => {
    authListener?.subscription?.unsubscribe();
  };
}
