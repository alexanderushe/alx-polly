import { createPoll } from "../polls";
import { supabase } from "../supabase";
import { getCurrentUser } from "../auth";

// Mock the dependencies
const mockSelect = jest.fn();
const mockInsert = jest.fn(() => ({
  select: mockSelect,
}));
const mockFrom = jest.fn(() => ({
  insert: mockInsert,
}));

jest.mock("../supabase", () => {
  // Define mocks before they are used in the mock implementation
  const mockSelect = jest.fn();
  const mockInsert = jest.fn(() => ({
    select: mockSelect,
  }));
  const mockFrom = jest.fn(() => ({
    insert: mockInsert,
  }));

  // Now, return the mock implementation
  return {
    supabase: {
      from: mockFrom,
    },
    // Expose the mocks for use in tests
    __esModule: true,
    default: {
      from: mockFrom,
    },
    mockSelect,
    mockInsert,
    mockFrom,
  };
});

jest.mock("../auth", () => ({
  getCurrentUser: jest.fn(),
}));

describe("createPoll", () => {
  // Import the mocked functions to use in tests
  const {
    mockFrom: supabaseFrom,
    mockInsert: supabaseInsert,
    mockSelect: supabaseSelect,
  } = require("../supabase");

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Unit Test: Happy Path (Manually Refined)
  test("should create and return a new poll when user is authenticated", async () => {
    // Arrange: Set up mocks and test data
    const mockUser = { id: "user-123" };
    (getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

    const pollData = {
      question: "What is your favorite color?",
      options: ["Red", "Green", "Blue"],
      start_time: "2025-09-15T10:00:00.000Z",
      end_time: "2025-09-16T10:00:00.000Z",
    };

    const expectedPoll = {
      id: "poll-1",
      ...pollData,
      creator_id: mockUser.id,
    };

    // More explicit mock setup for the chained Supabase call
    supabaseSelect.mockResolvedValue({
      data: [expectedPoll],
      error: null,
    });

    // Act: Call the function being tested
    const result = await createPoll(pollData);

    // Assert: Verify the outcome
    expect(result.data).toEqual([expectedPoll]);
    expect(getCurrentUser).toHaveBeenCalledTimes(1);
    expect(supabaseFrom).toHaveBeenCalledWith("polls");
    expect(supabaseInsert).toHaveBeenCalledWith([
      {
        question: pollData.question,
        options: pollData.options,
        creator_id: mockUser.id,
        start_time: pollData.start_time,
        end_time: pollData.end_time,
      },
    ]);
    expect(supabaseSelect).toHaveBeenCalledTimes(1);
  });

  // Unit Test: Failure Case
  test("should throw an error when user is not authenticated", async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue(null);

    const pollData = {
      question: "This should fail",
      options: ["A", "B"],
    };

    await expect(createPoll(pollData)).rejects.toThrow(
      "You must be logged in to create a poll.",
    );
  });

  // Unit Test: Failure Case
  test("should return an error object when Supabase fails to create a poll", async () => {
    const mockUser = { id: "user-123" };
    (getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

    const pollData = {
      question: "What is your favorite color?",
      options: ["Red", "Green", "Blue"],
    };

    const supabaseError = {
      message: "Insert failed",
      details: "...",
      hint: "...",
      code: "12345",
    };

    supabaseSelect.mockResolvedValue({ data: null, error: supabaseError });

    const result = await createPoll(pollData);

    expect(result.error).toEqual(supabaseError);
    expect(result.data).toBeUndefined();
  });

  // Integration Test: Supabase Interaction
  test("should call Supabase insert with the correct poll data", async () => {
    const mockUser = { id: "user-456" };
    (getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

    const pollData = {
      question: "Another test poll",
      options: ["Yes", "No"],
      start_time: "2025-09-15T10:00:00.000Z",
      end_time: "2025-09-16T10:00:00.000Z",
    };

    supabaseSelect.mockResolvedValue({
      data: [{ ...pollData, creator_id: mockUser.id }],
      error: null,
    });

    await createPoll(pollData);

    expect(supabaseInsert).toHaveBeenCalledWith([
      {
        question: pollData.question,
        options: pollData.options,
        creator_id: mockUser.id,
        start_time: pollData.start_time,
        end_time: pollData.end_time,
      },
    ]);
  });
});