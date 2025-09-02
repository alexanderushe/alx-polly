import { supabase } from "./supabase";
import { getCurrentUser } from "./auth";

export const castVote = async (pollId: string, option: string) => {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("You must be logged in to vote.");
  }

  const { data, error } = await supabase
    .from("votes")
    .insert([
      {
        poll_id: pollId,
        option: option,
        voter_id: user.id,
      },
    ])
    .select();

  if (error) {
    console.error("Error casting vote:", error);
    return { error };
  }

  return { data };
};

export const getVoteCounts = async (pollId: string) => {
  const { data, error } = await supabase.rpc("get_vote_counts", {
    poll_id_param: pollId,
  });

  if (error) {
    console.error("Error getting vote counts:", error);
    return null;
  }

  return data;
};

export const getVotedPolls = async () => {
  const user = await getCurrentUser();
  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("votes")
    .select("polls (*)")
    .eq("voter_id", user.id);

  if (error) {
    console.error("Error getting voted polls:", error);
    return [];
  }

  return data
    .map((v) => v.polls)
    .flat()
    .filter((p) => p !== null);
};
