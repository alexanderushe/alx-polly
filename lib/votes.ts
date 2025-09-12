import { supabase } from "./supabase";
import { getCurrentUser } from "./auth";

export interface Vote {
  id: string;
  poll_id: string;
  voter_id: string;
  selected_option: string;
  created_at: string;
  polls?: {
    id: string;
    question: string;
    options: string[];
    created_at: string;
  };
}

export interface VoteCount {
  option: string;
  count: number;
}

export const castVote = async (pollId: string, selectedOption: string) => {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("You must be logged in to vote.");
  }

  // Check if user already voted on this poll
  const { data: existingVote } = await supabase
    .from("votes")
    .select("id")
    .eq("poll_id", pollId)
    .eq("voter_id", user.id)
    .single();

  if (existingVote) {
    throw new Error("You have already voted on this poll.");
  }

  const { data, error } = await supabase
    .from("votes")
    .insert([
      {
        poll_id: pollId,
        voter_id: user.id,
        selected_option: selectedOption,
      },
    ])
    .select();

  if (error) {
    console.error("Error casting vote:", error);
    throw new Error("Failed to cast vote.");
  }

  return data;
};

export const getVoteCounts = async (pollId: string): Promise<VoteCount[]> => {
  const { data, error } = await supabase
    .from("votes")
    .select("selected_option")
    .eq("poll_id", pollId);

  if (error) {
    console.error("Error fetching vote counts:", error);
    return [];
  }

  const counts: { [key: string]: number } = {};
  data.forEach((vote) => {
    counts[vote.selected_option] = (counts[vote.selected_option] || 0) + 1;
  });

  return Object.entries(counts).map(([option, count]) => ({
    option,
    count,
  }));
};

export const getUserVotes = async (): Promise<Vote[]> => {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("You must be logged in to view your votes.");
  }

  const { data, error } = await supabase
    .from("votes")
    .select(`
      *,
      polls (
        id,
        question,
        options,
        created_at
      )
    `)
    .eq("voter_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching user votes:", error);
    throw new Error("Failed to fetch your votes.");
  }

  return data || [];
};

export const hasUserVoted = async (pollId: string): Promise<boolean> => {
  const user = await getCurrentUser();
  if (!user) {
    return false;
  }

  const { data, error } = await supabase
    .from("votes")
    .select("id")
    .eq("poll_id", pollId)
    .eq("voter_id", user.id)
    .single();

  if (error) {
    return false;
  }

  return !!data;
};

export const getUserVoteForPoll = async (pollId: string): Promise<Vote | null> => {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("votes")
    .select("*")
    .eq("poll_id", pollId)
    .eq("voter_id", user.id)
    .single();

  if (error) {
    return null;
  }

  return data;
};
