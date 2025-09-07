import { supabase } from "./supabase";
import { getCurrentUser } from "./auth";

export const getPolls = async () => {
  const { data, error } = await supabase.from("polls").select("*");
  if (error) {
    console.error("Error fetching polls:", error);
    return [];
  }
  return data;
};

export const getPoll = async (id: string) => {
  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching poll:", error);
    return null;
  }
  return data;
};

export const createPoll = async (pollData: {
  question: string;
  options: string[];
}) => {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("You must be logged in to create a poll.");
  }

  const { data, error } = await supabase
    .from("polls")
    .insert([
      {
        question: pollData.question,
        options: pollData.options,
        creator_id: user.id,
      },
    ])
    .select();

  if (error) {
    console.error("Error creating poll:", error);
    return { error };
  }

  return { data };
};

export const deletePoll = async (pollId: string) => {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("You must be logged in to delete a poll.");
  }

  const { data, error } = await supabase
    .from("polls")
    .delete()
    .eq("id", pollId)
    .eq("creator_id", user.id);

  if (error) {
    console.error("Error deleting poll:", error);
    return { error };
  }

  return { data };
};

export const updatePoll = async (
  pollId: string,
  pollData: {
    question: string;
    options: string[];
  },
) => {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("You must be logged in to update a poll.");
  }

  const { data, error } = await supabase
    .from("polls")
    .update(pollData)
    .eq("id", pollId)
    .eq("creator_id", user.id)
    .select();

  if (error) {
    console.error("Error updating poll:", error);
    return { error };
  }

  return { data };
};
