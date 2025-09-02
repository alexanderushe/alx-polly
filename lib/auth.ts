import { supabase } from "./supabase";

export const getCurrentUser = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
};

export const loginUser = async (email: string, password: string) => {
  // placeholder logic
  return { token: "mock-token", user: { email } };
};
