import { NextRequest, NextResponse } from "next/server";
import { getPoll, updatePoll, deletePoll } from "../../../../lib/polls";
import { getCurrentUser } from "../../../../lib/auth";

// GET /api/polls/[pollId] - Retrieve a single poll
export async function GET(
  request: NextRequest,
  { params }: { params: { pollId: string } },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const poll = await getPoll(params.pollId);

    if (!poll) {
      return NextResponse.json(
        { success: false, error: "Poll not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: poll,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve poll",
      },
      { status: 500 },
    );
  }
}

// PUT /api/polls/[pollId] - Update a poll
export async function PUT(
  request: NextRequest,
  { params }: { params: { pollId: string } },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();

    if (!body.question || typeof body.question !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Question is required and must be a string",
        },
        { status: 400 },
      );
    }

    if (!body.options || !Array.isArray(body.options) || body.options.length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: "Options are required and must be an array of at least 2 strings",
        },
        { status: 400 },
      );
    }

    const updatedPoll = await updatePoll(params.pollId, {
      question: body.question,
      options: body.options,
    });

    if (updatedPoll.error) {
        return NextResponse.json(
            {
              success: false,
              error: "Failed to update poll",
              details: updatedPoll.error.message,
            },
            { status: 500 },
          );
    }

    return NextResponse.json(
      {
        success: true,
        data: updatedPoll.data,
        message: "Poll updated successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update poll",
      },
      { status: 500 },
    );
  }
}

// DELETE /api/polls/[pollId] - Delete a poll
export async function DELETE(
  request: NextRequest,
  { params }: { params: { pollId: string } },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const deletedPoll = await deletePoll(params.pollId);

    if (deletedPoll.error) {
        return NextResponse.json(
            {
              success: false,
              error: "Failed to delete poll",
              details: deletedPoll.error.message,
            },
            { status: 500 },
          );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Poll deleted successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete poll",
      },
      { status: 500 },
    );
  }
}
