import { NextRequest, NextResponse } from "next/server";
import { createPoll, getPolls } from "../../../lib/polls";
import { getCurrentUser } from "../../../lib/auth";

// GET /api/polls - Retrieve all polls
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const polls = await getPolls();
    return NextResponse.json({
      success: true,
      data: polls,
      count: polls.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve polls",
      },
      { status: 500 },
    );
  }
}

// POST /api/polls - Create a new poll
export async function POST(request: NextRequest) {
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

    const newPoll = await createPoll({
      question: body.question,
      options: body.options,
      start_time: body.start_time,
      end_time: body.end_time,
    });

    if (newPoll.error) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create poll",
          details: newPoll.error, // Use newPoll.error directly
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: newPoll.data,
        message: "Poll created successfully",
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create poll",
      },
      { status: 500 },
    );
  }
}