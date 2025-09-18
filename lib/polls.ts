import { supabase } from "./supabase";
import { getCurrentUser } from "./auth";

export const getPolls = async () => {
  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .or(`start_time.is.null,start_time.lte.${new Date().toISOString()}`)
    .or(`end_time.is.null,end_time.gte.${new Date().toISOString()}`);

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

// Helper function to format datetime strings for PostgreSQL
const formatDateTimeForDB = (dateTime?: string): string | null => {
  if (!dateTime) return null;

  try {
    // If it's already an ISO string, use it directly
    if (dateTime.includes("T") && dateTime.includes("Z")) {
      return dateTime;
    }

    // If it's a datetime-local format, convert to ISO
    if (dateTime.includes("T") && !dateTime.includes("Z")) {
      return new Date(dateTime).toISOString();
    }

    // Try to parse and convert to ISO
    const date = new Date(dateTime);
    if (isNaN(date.getTime())) {
      console.warn("Invalid date format:", dateTime);
      return null;
    }

    return date.toISOString();
  } catch (error) {
    console.warn("Error formatting datetime:", dateTime, error);
    return null;
  }
};

export const createPoll = async (pollData: {
  question: string;
  options: string[];
  start_time?: string;
  end_time?: string;
}) => {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("You must be logged in to create a poll.");
  }

  console.log("Creating poll with user:", user.id);
  console.log("Poll data received:", pollData);

  // Format datetime strings properly
  const formattedStartTime = formatDateTimeForDB(pollData.start_time);
  const formattedEndTime = formatDateTimeForDB(pollData.end_time);

  console.log("Formatted times:", {
    original: { start: pollData.start_time, end: pollData.end_time },
    formatted: { start: formattedStartTime, end: formattedEndTime },
  });

  const insertData = {
    question: pollData.question,
    options: JSON.stringify(pollData.options), // Convert options to JSON string
    creator_id: user.id,
    start_time: formattedStartTime,
    end_time: formattedEndTime,
  };

  console.log("Inserting poll data:", insertData);

  const { data, error } = await supabase
    .from("polls")
    .insert([insertData])
    .select()
    .single(); // Use .single() since we expect one row

  console.log("Supabase response:", { data, error });

  if (error) {
    console.error("Error creating poll:", error);
    console.error("Error stringified:", JSON.stringify(error, null, 2));
    console.error("Error details:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });

    if (error.code === "42501") {
      return {
        error:
          "Permission denied - RLS policy may be blocking this operation. Check if you're authenticated and have proper permissions.",
      };
    }

    if (error.code === "23505") {
      return { error: "Duplicate entry - this poll may already exist." };
    }

    if (error.code === "23503") {
      return {
        error:
          "Foreign key constraint violation - user authentication may be invalid.",
      };
    }

    const errorMessage =
      error.message ||
      error.details ||
      error.hint ||
      `Database error (code: ${error.code})` ||
      "Unknown database error";

    return { error: errorMessage };
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

// Test function to check if user can access polls table
export const testUserPollAccess = async () => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "No authenticated user" };
    }

    console.log("Testing with authenticated user:", user.id);

    // Test if we can read from polls table
    const { data: readData, error: readError } = await supabase
      .from("polls")
      .select("*")
      .limit(1);

    if (readError) {
      console.error("Read test failed:", readError);
      return { error: `Read access failed: ${readError.message}` };
    }

    console.log(
      "Read access successful, found",
      readData?.length || 0,
      "polls",
    );

    // Test if we can insert into polls table with minimal data
    const testData = {
      question: "RLS Test Poll - " + Date.now(),
      options: ["Test Option 1", "Test Option 2"],
      creator_id: user.id,
    };

    const { data: insertData, error: insertError } = await supabase
      .from("polls")
      .insert([testData])
      .select();

    if (insertError) {
      console.error("Insert test failed:", insertError);
      return {
        error: `Insert access failed: ${insertError.message} (Code: ${insertError.code})`,
        errorDetails: insertError,
      };
    }

    console.log("Insert access successful:", insertData);
    return { success: true, testPoll: insertData };
  } catch (error) {
    console.error("User access test exception:", error);
    return { error: "Test exception occurred" };
  }
};

// Debug helper function to test database connection and schema
export const debugDatabaseSchema = async () => {
  try {
    console.log("Testing database connection and schema...");

    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from("polls")
      .select("count", { count: "exact" });

    if (testError) {
      console.error("Database connection test failed:", testError);
      return { error: "Database connection failed" };
    }

    console.log("Database connection successful, polls count:", testData);

    // Test polls table schema
    const { data: schemaData, error: schemaError } = await supabase
      .from("polls")
      .select("*")
      .limit(1);

    if (schemaError) {
      console.error("Schema test failed:", schemaError);
      return { error: "Schema test failed" };
    }

    console.log("Polls table schema test successful");

    // Test votes table schema
    const { data: votesSchema, error: votesError } = await supabase
      .from("votes")
      .select("*")
      .limit(1);

    if (votesError) {
      console.error("Votes schema test failed:", votesError);
      return { error: "Votes schema test failed" };
    }

    console.log("Votes table schema test successful");

    return { success: true };
  } catch (error) {
    console.error("Debug function exception:", error);
    return { error: "Debug function exception" };
  }
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
