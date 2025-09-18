import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../lib/auth";
import { supabase } from "../../../../../lib/supabase";

/**
 * Poll Results API Endpoint
 *
 * Retrieves comprehensive poll results including vote counts, percentages, total votes,
 * and user voting status. Returns all poll options even if they have zero votes.
 *
 * @route GET /api/polls/[pollId]/results
 * @param pollId - The ID of the poll to get results for (from URL parameters)
 *
 * @returns {object} JSON response with poll results data or error message
 *
 * Success Response (200):
 * {
 *   "success": true,
 *   "data": {
 *     "poll": {
 *       "id": 123,
 *       "question": "What's your favorite color?",
 *       "options": ["Red", "Blue", "Green"],
 *       "created_at": "2024-01-15T10:00:00.000Z",
 *       "start_time": null,
 *       "end_time": null
 *     },
 *     "results": [
 *       { "option": "Blue", "votes": 15, "percentage": 50 },
 *       { "option": "Red", "votes": 10, "percentage": 33 },
 *       { "option": "Green", "votes": 5, "percentage": 17 }
 *     ],
 *     "totalVotes": 30,
 *     "userVote": "Blue",
 *     "hasUserVoted": true
 *   }
 * }
 *
 * Error Responses:
 * - 401: User not authenticated
 * - 404: Poll not found
 * - 500: Server or database error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pollId: string }> },
) {
  try {
    const resolvedParams = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Validate poll exists and is accessible
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .select("*")
      .eq("id", resolvedParams.pollId)
      .single();

    if (pollError || !poll) {
      return NextResponse.json(
        { success: false, error: "Poll not found" },
        { status: 404 },
      );
    }

    // Retrieve all votes cast for this poll
    const { data: votes, error: votesError } = await supabase
      .from("votes")
      .select("option")
      .eq("poll_id", resolvedParams.pollId);

    if (votesError) {
      console.error("Error fetching votes:", votesError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch poll results",
        },
        { status: 500 },
      );
    }

    // Calculate vote statistics for each option
    const voteCounts: Record<string, number> = {};
    let totalVotes = 0;

    // Initialize vote counters for all poll options (ensures 0-vote options are included)
    poll.options.forEach((option: string) => {
      voteCounts[option] = 0;
    });

    // Tally actual votes and increment counters
    votes.forEach((vote) => {
      if (voteCounts.hasOwnProperty(vote.option)) {
        voteCounts[vote.option]++;
        totalVotes++;
      }
    });

    // Transform vote counts into result objects with percentages
    const results = poll.options.map((option: string) => ({
      option,
      votes: voteCounts[option],
      percentage:
        totalVotes > 0
          ? Math.round((voteCounts[option] / totalVotes) * 100)
          : 0,
    }));

    // Determine current user's voting status for this poll
    const { data: userVote, error: userVoteError } = await supabase
      .from("votes")
      .select("option")
      .eq("poll_id", resolvedParams.pollId)
      .eq("voter_id", user.id)
      .single();

    const hasUserVoted = !userVoteError && userVote;

    return NextResponse.json({
      success: true,
      data: {
        poll: {
          id: poll.id,
          question: poll.question,
          options: poll.options,
          created_at: poll.created_at,
          start_time: poll.start_time,
          end_time: poll.end_time,
        },
        results,
        totalVotes,
        userVote: hasUserVoted ? userVote.option : null,
        hasUserVoted: !!hasUserVoted,
      },
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve poll results",
      },
      { status: 500 },
    );
  }
}
