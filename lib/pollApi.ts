/**
 * Client-side API utilities for poll operations
 *
 * This module provides type-safe functions for interacting with the poll voting system.
 * All functions require user authentication and provide comprehensive error handling.
 *
 * @author Poll API Team
 * @version 1.0.0
 */

export interface Vote {
  id: number;
  poll_id: number;
  option: string;
  voter_id: string;
  created_at: string;
}

export interface PollResult {
  option: string;
  votes: number;
  percentage: number;
}

export interface PollResultsResponse {
  poll: {
    id: number;
    question: string;
    options: string[];
    created_at: string;
    start_time: string | null;
    end_time: string | null;
  };
  results: PollResult[];
  totalVotes: number;
  userVote: string | null;
  hasUserVoted: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  details?: string;
}

/**
 * 🗳️ Cast a vote on an existing poll
 *
 * Allows an authenticated user to cast a single vote on a poll. This function validates
 * that the user hasn't already voted, the poll exists, and the selected option is valid.
 * Once a vote is cast, the user cannot vote again on the same poll.
 *
 * @param pollId - The unique identifier of the poll (as string)
 * @param option - The exact text of the option to vote for (must match poll options exactly)
 * @returns Promise<ApiResponse<Vote>> - API response containing vote data or error
 *
 * @throws Will not throw but returns error in response object for:
 *   - 401: User not authenticated
 *   - 404: Poll not found
 *   - 400: Invalid option or missing parameters
 *   - 409: User has already voted on this poll
 *   - 500: Server or database error
 *
 * @example
 * ```typescript
 * const result = await castVote("123", "Option 1");
 * if (result.success) {
 *   console.log("Vote cast successfully:", result.data);
 *   console.log("Vote ID:", result.data.id);
 *   console.log("Timestamp:", result.data.created_at);
 * } else {
 *   console.error("Failed to cast vote:", result.error);
 *   // Handle specific errors
 *   if (result.error?.includes("already voted")) {
 *     showMessage("You've already voted on this poll");
 *   }
 * }
 * ```
 */
export async function castVote(
  pollId: string,
  option: string,
): Promise<ApiResponse<Vote>> {
  try {
    const response = await fetch(`/api/polls/${pollId}/vote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ option }),
    });

    const data: ApiResponse<Vote> = await response.json();

    // Handle HTTP errors
    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP ${response.status}: Failed to cast vote`,
      };
    }

    return data;
  } catch (error) {
    console.error("Network error while casting vote:", error);
    return {
      success: false,
      error:
        "Network error: Unable to cast vote. Please check your connection.",
    };
  }
}

/**
 * 📊 Retrieve poll results with vote counts and percentages
 *
 * Fetches comprehensive polling results including vote counts for each option,
 * calculated percentages, total vote count, and the current user's voting status.
 * Results include all poll options, even those with zero votes.
 *
 * @param pollId - The unique identifier of the poll to get results for (as string)
 * @returns Promise<ApiResponse<PollResultsResponse>> - Complete poll results data or error
 *
 * @throws Will not throw but returns error in response object for:
 *   - 401: User not authenticated
 *   - 404: Poll not found
 *   - 500: Server or database error
 *
 * @example
 * ```typescript
 * const result = await getPollResults("123");
 * if (result.success) {
 *   const { poll, results, totalVotes, hasUserVoted, userVote } = result.data;
 *
 *   console.log(`Poll: ${poll.question}`);
 *   console.log(`Total votes: ${totalVotes}`);
 *   console.log(`User voted: ${hasUserVoted ? `Yes (${userVote})` : 'No'}`);
 *
 *   // Display results sorted by vote count
 *   results.forEach((result, index) => {
 *     console.log(`${index + 1}. ${result.option}: ${result.votes} votes (${result.percentage}%)`);
 *   });
 * } else {
 *   console.error("Failed to get results:", result.error);
 * }
 * ```
 */
export async function getPollResults(
  pollId: string,
): Promise<ApiResponse<PollResultsResponse>> {
  try {
    const response = await fetch(`/api/polls/${pollId}/results`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data: ApiResponse<PollResultsResponse> = await response.json();

    // Handle HTTP errors
    if (!response.ok) {
      return {
        success: false,
        error:
          data.error ||
          `HTTP ${response.status}: Failed to retrieve poll results`,
      };
    }

    return data;
  } catch (error) {
    console.error("Network error while getting poll results:", error);
    return {
      success: false,
      error:
        "Network error: Unable to retrieve poll results. Please check your connection.",
    };
  }
}

/**
 * Utility function to check if a poll is currently active
 *
 * Determines if a poll is currently accepting votes based on its start_time and end_time.
 * A poll is considered active if the current time is within the specified time window.
 * If no start_time is set, the poll is active from creation. If no end_time is set,
 * the poll remains active indefinitely (or until start_time if set).
 *
 * @param poll - Poll object containing timing information
 * @param poll.start_time - ISO string of when voting should begin (null = no restriction)
 * @param poll.end_time - ISO string of when voting should end (null = no restriction)
 * @returns boolean - True if poll is currently active and accepting votes
 *
 * @example
 * ```typescript
 * const poll = { start_time: "2024-01-01T00:00:00Z", end_time: "2024-12-31T23:59:59Z" };
 * if (isPollActive(poll)) {
 *   console.log("Poll is accepting votes");
 * } else {
 *   console.log("Poll is not currently active");
 * }
 * ```
 */
export function isPollActive(poll: {
  start_time: string | null;
  end_time: string | null;
}): boolean {
  const now = new Date();
  const startTime = poll.start_time ? new Date(poll.start_time) : null;
  const endTime = poll.end_time ? new Date(poll.end_time) : null;

  // If no start time, poll is active
  if (!startTime) {
    return !endTime || now <= endTime;
  }

  // If no end time, check if started
  if (!endTime) {
    return now >= startTime;
  }

  // Check if within time range
  return now >= startTime && now <= endTime;
}

/**
 * Utility function to format poll results for display
 *
 * Sorts poll results by vote count in descending order (most votes first) and
 * ensures percentage values are properly rounded to 2 decimal places for clean display.
 * This is useful for presenting results in a consistent, user-friendly format.
 *
 * @param results - Array of unformatted poll results
 * @returns PollResult[] - Sorted and formatted results array
 *
 * @example
 * ```typescript
 * const rawResults = [
 *   { option: "A", votes: 5, percentage: 33.333333 },
 *   { option: "B", votes: 10, percentage: 66.666666 }
 * ];
 * const formatted = formatPollResults(rawResults);
 * // Returns: [
 * //   { option: "B", votes: 10, percentage: 66.67 },
 * //   { option: "A", votes: 5, percentage: 33.33 }
 * // ]
 * ```
 */
export function formatPollResults(results: PollResult[]): PollResult[] {
  return results
    .sort((a, b) => b.votes - a.votes)
    .map((result) => ({
      ...result,
      percentage: Math.round(result.percentage * 100) / 100, // Round to 2 decimal places
    }));
}

/**
 * Utility function to get the winning option(s) from poll results
 *
 * Identifies the option(s) with the highest vote count. In case of a tie,
 * returns all options that share the maximum vote count. If no votes have
 * been cast, returns an empty array.
 *
 * @param results - Array of poll results with vote counts
 * @returns string[] - Array of winning option names (empty if no votes, multiple if tied)
 *
 * @example
 * ```typescript
 * const results = [
 *   { option: "A", votes: 10, percentage: 50 },
 *   { option: "B", votes: 10, percentage: 50 },
 *   { option: "C", votes: 5, percentage: 25 }
 * ];
 * const winners = getWinningOptions(results);
 * console.log(winners); // ["A", "B"] - tied for first place
 * ```
 */
export function getWinningOptions(results: PollResult[]): string[] {
  if (results.length === 0) return [];

  const maxVotes = Math.max(...results.map((r) => r.votes));
  return results
    .filter((result) => result.votes === maxVotes)
    .map((result) => result.option);
}
