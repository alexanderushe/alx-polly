import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../lib/auth";
import { supabase } from "../../../lib/supabase";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { data, error } = await supabase
      .from("votes")
      .select("polls (*)")
      .eq("voter_id", user.id);

    if (error) {
      console.error("Error getting voted polls:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to retrieve voted polls",
        },
        { status: 500 },
      );
    }

    const polls = data
      .map((v) => v.polls)
      .flat()
      .filter((p) => p !== null);

    return NextResponse.json({
      success: true,
      data: polls,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve voted polls",
      },
      { status: 500 },
    );
  }
}
