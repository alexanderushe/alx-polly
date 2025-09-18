import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../lib/auth";
import { getUserVotes } from "../../../lib/votes";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const votes = await getUserVotes();

    return NextResponse.json({
      success: true,
      data: votes,
    });
  } catch (error) {
    console.error("Error getting user votes:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve your votes",
      },
      { status: 500 },
    );
  }
}
