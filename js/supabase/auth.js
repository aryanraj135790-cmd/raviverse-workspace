import { supabase } from "./client.js";

export async function signIn(email, password) {
  return supabase.auth.signInWithPassword({
    email,
    password,
  });
}
