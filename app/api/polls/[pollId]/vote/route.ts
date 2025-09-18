import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../lib/auth";
import { supabase } from "../../../../../lib/supabase";

/**
 * Vote Casting API Endpoint
 *
 * Handles casting votes on existing polls. Validates authentication, poll existence,
 * option validity, and prevents duplicate voting from the same user.
 *
 * @route POST /api/polls/[pollId]/vote
 * @param pollId - The ID of the poll to vote on (from URL parameters)
 *
 * Request Body:
 * @param {string} option - The exact text of the option to vote for
 *
 * @returns {object} JSON response with success status and vote data or error message
 *
 * Success Response (201):
 * {
 *   "success": true,
 *   "data": {
 *     "id": 123,
 *     "poll_id": 456,
 *     "option": "Selected Option",
 *     "voter_id": "user-uuid",
 *     "created_at": "2024-01-15T10:30:00.000Z"
 *   },
 *   "message": "Vote cast successfully"
 * }
 *
 * Error Responses:
 * - 401: User not authenticated
 * - 404: Poll not found
 * - 400: Invalid option or missing parameters
 * - 409: User has already voted on this poll
 * - 500: Server or database error
 */
export async function POST(
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

    const body = await request.json();

    if (!body.option || typeof body.option !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Option is required and must be a string",
        },
        { status: 400 },
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

    // Ensure the selected option is valid for this poll
    if (!poll.options.includes(body.option)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid option for this poll",
        },
        { status: 400 },
      );
    }

    // Prevent duplicate voting - check if user already voted on this poll
    const { data: existingVote, error: voteCheckError } = await supabase
      .from("votes")
      .select("id")
      .eq("poll_id", resolvedParams.pollId)
      .eq("voter_id", user.id)
      .single();

    if (voteCheckError && voteCheckError.code !== "PGRST116") {
      console.error("Error checking existing vote:", voteCheckError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to check existing vote",
        },
        { status: 500 },
      );
    }

    if (existingVote) {
      return NextResponse.json(
        {
          success: false,
          error: "You have already voted on this poll",
        },
        { status: 409 },
      );
    }

    // Insert the vote record into the database
    const { data: vote, error: voteError } = await supabase
      .from("votes")
      .insert([
        {
          poll_id: parseInt(resolvedParams.pollId),
          option: body.option,
          voter_id: user.id,
        },
      ])
      .select()
      .single();

    if (voteError) {
      console.error("Error casting vote:", voteError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to cast vote",
          details: voteError.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: vote,
        message: "Vote cast successfully",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to cast vote",
      },
      { status: 500 },
    );
  }
}
