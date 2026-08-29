import { supabase } from "./client.js";

export async function signIn(email, password) {
  return supabase.auth.signInWithPassword({
    email,
    password,
  });
}

export async function signUp(email, password, options = {}) {
  return supabase.auth.signUp({
    email,
    password,
    options,
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getSession() {
  return supabase.auth.getSession();
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback);
}

export async function getAuthenticatedUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    throw new Error(`Failed to resolve authenticated user: ${error.message}`, {
      cause: error,
    });
  }
  if (!data?.user) {
    throw new Error("No authenticated user: cannot resolve user_id");
  }
  return data.user.id;
}
