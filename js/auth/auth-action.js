import { signIn, signOut, signUp } from "../supabase/auth.js";

export async function loginUser(email, password) {
  const { data, error } = await signIn(email, password);

  if (error) {
    throw error;
  }

  return data;
}

export async function signupUser(email, password) {
  const { data, error } = await signUp(email, password);

  if (error) {
    throw error;
  }

  return data;
}
export async function logoutUser() {
  const { error } = await signOut();

  if (error) {
    throw error;
  }
}
