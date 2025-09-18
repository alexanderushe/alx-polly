"use client";

/**
 * Poll API Demo Page Component
 *
 * Interactive demonstration page showcasing the castVote() and getPollResults() functions.
 * Provides a complete user interface for selecting polls, casting votes, and viewing results
 * with real-time updates and comprehensive error handling.
 *
 * Features:
 * - Poll selection from available polls
 * - Live voting interface with option selection
 * - Real-time results display with visual charts
 * - User voting status tracking
 * - Error handling demonstration
 * - Responsive design for all devices
 *
 * @component
 * @example
 * // Access via URL: /poll-api-demo
 * <PollApiDemoPage />
 */

import { useState, useEffect } from "react";
import {
  castVote,
  getPollResults,
  PollResultsResponse,
  formatPollResults,
  getWinningOptions,
  isPollActive,
} from "../../lib/pollApi";

interface Poll {
  id: number;
  question: string;
  options: string[];
  created_at: string;
  start_time: string | null;
  end_time: string | null;
  creator_id: string;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  count?: number;
  message?: string;
  error?: string;
}

/**
 * Main demo page component that showcases poll voting functionality
 *
 * Manages state for poll selection, voting process, results display, and error handling.
 * Demonstrates proper usage patterns for the poll API functions with comprehensive
 * user feedback and visual result presentation.
 *
 * @returns {JSX.Element} The complete demo page interface
 */
export default function PollApiDemoPage() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [pollResults, setPollResults] = useState<PollResultsResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [votingLoading, setVotingLoading] = useState(false);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  /**
   * Fetches all available polls from the API
   * Used to populate the poll selection interface
   */
  const fetchPolls = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/polls");
      const data: ApiResponse<Poll[]> = await response.json();

      if (data.success && Array.isArray(data.data)) {
        setPolls(data.data);
      } else {
        setError(data.error || "Failed to fetch polls");
      }
    } catch (err) {
      setError("Network error occurred while fetching polls");
    } finally {
      setLoading(false);
    }
  };

  /**
   * 🗳️ Handles vote casting using the castVote() client-side function
   * Demonstrates proper error handling and success feedback
   *
   * @async
   * @function handleCastVote
   */
  const handleCastVote = async () => {
    if (!selectedPoll || !selectedOption) {
      setError("Please select a poll and an option");
      return;
    }

    setVotingLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await castVote(selectedPoll.id.toString(), selectedOption);

      if (result.success) {
        setSuccessMessage(`✅ Vote cast successfully for "${selectedOption}"!`);
        setSelectedOption("");
        // Refresh results if they're currently displayed
        if (pollResults && pollResults.poll.id === selectedPoll.id) {
          await handleGetResults();
        }
      } else {
        setError(result.error || "Failed to cast vote");
      }
    } catch (err) {
      setError("Unexpected error while casting vote");
    } finally {
      setVotingLoading(false);
    }
  };

  /**
   * 📊 Retrieves poll results using the getPollResults() client-side function
   * Demonstrates comprehensive result display with statistics and user status
   *
   * @async
   * @function handleGetResults
   */
  const handleGetResults = async () => {
    if (!selectedPoll) {
      setError("Please select a poll first");
      return;
    }

    setResultsLoading(true);
    setError(null);

    try {
      const result = await getPollResults(selectedPoll.id.toString());

      if (result.success && result.data) {
        setPollResults(result.data);
        setSuccessMessage(`📊 Poll results retrieved successfully!`);
      } else {
        setError(result.error || "Failed to retrieve poll results");
        setPollResults(null);
      }
    } catch (err) {
      setError("Unexpected error while getting poll results");
      setPollResults(null);
    } finally {
      setResultsLoading(false);
    }
  };

  /**
   * Auto-clear success and error messages after 5 seconds
   * Provides clean UX by removing stale messages
   */
  useEffect(() => {
    if (successMessage || error) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, error]);

  /**
   * Load initial poll data when component mounts
   */
  useEffect(() => {
    fetchPolls();
  }, []);

  /**
   * Formats ISO date strings for human-readable display
   * @param {string} dateString - ISO date string to format
   * @returns {string} Formatted date and time string
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Calculate winning options and format results for display
  const winningOptions = pollResults
    ? getWinningOptions(pollResults.results)
    : [];
  const formattedResults = pollResults
    ? formatPollResults(pollResults.results)
    : [];

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-4xl font-bold mb-2">🗳️ Poll API Demo</h1>
      <p className="text-gray-600 mb-8">
        Demonstration of client-side functions for casting votes and retrieving
        poll results
      </p>

      {/* Messages */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <strong>❌ Error:</strong> {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          <strong>{successMessage}</strong>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Poll Selection & Voting */}
        <div className="space-y-6">
          {/* Polls List */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Available Polls</h2>
              <button
                onClick={fetchPolls}
                disabled={loading}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-md transition-colors"
              >
                {loading ? "Loading..." : "Refresh"}
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <p className="mt-2 text-gray-600">Loading polls...</p>
              </div>
            ) : polls.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No polls found</p>
            ) : (
              <div className="space-y-3">
                {polls.map((poll) => (
                  <div
                    key={poll.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedPoll?.id === poll.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedPoll(poll)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">
                          {poll.question}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Options: {poll.options.join(", ")}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          Created: {formatDate(poll.created_at)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            isPollActive(poll)
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {isPollActive(poll) ? "Active" : "Inactive"}
                        </span>
                        <span className="text-xs text-gray-400 mt-1">
                          ID: {poll.id}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Voting Section */}
          {selectedPoll && (
            <div className="bg-white shadow-md rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">🗳️ Cast Your Vote</h3>
              <div className="mb-4">
                <h4 className="font-medium text-gray-700 mb-2">
                  Selected Poll:
                </h4>
                <p className="text-lg font-medium">{selectedPoll.question}</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Choose an option:
                </label>
                <div className="space-y-2">
                  {selectedPoll.options.map((option) => (
                    <label key={option} className="flex items-center">
                      <input
                        type="radio"
                        name="voteOption"
                        value={option}
                        checked={selectedOption === option}
                        onChange={(e) => setSelectedOption(e.target.value)}
                        className="mr-3"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={handleCastVote}
                disabled={
                  votingLoading ||
                  !selectedOption ||
                  !isPollActive(selectedPoll)
                }
                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-md transition-colors"
              >
                {votingLoading ? "Casting Vote..." : "Cast Vote 🗳️"}
              </button>

              {!isPollActive(selectedPoll) && (
                <p className="text-sm text-amber-600 mt-2">
                  ⚠️ This poll is currently inactive
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right Column - Results */}
        <div className="space-y-6">
          {/* Results Control */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">📊 Poll Results</h3>

            <button
              onClick={handleGetResults}
              disabled={resultsLoading || !selectedPoll}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-md transition-colors"
            >
              {resultsLoading ? "Loading Results..." : "Get Poll Results 📊"}
            </button>

            {!selectedPoll && (
              <p className="text-sm text-gray-500 mt-2">
                Select a poll first to view results
              </p>
            )}
          </div>

          {/* Results Display */}
          {pollResults && (
            <div className="bg-white shadow-md rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">
                Results for: "{pollResults.poll.question}"
              </h3>

              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {pollResults.totalVotes}
                  </div>
                  <div className="text-sm text-gray-600">Total Votes</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {pollResults.poll.options.length}
                  </div>
                  <div className="text-sm text-gray-600">Options</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {winningOptions.length}
                  </div>
                  <div className="text-sm text-gray-600">Winner(s)</div>
                </div>
              </div>

              {/* User's Vote Status */}
              <div className="mb-6 p-3 rounded-lg bg-blue-50 border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-1">
                  Your Vote Status:
                </h4>
                {pollResults.hasUserVoted ? (
                  <p className="text-blue-700">
                    ✅ You voted for: <strong>"{pollResults.userVote}"</strong>
                  </p>
                ) : (
                  <p className="text-blue-700">❌ You haven't voted yet</p>
                )}
              </div>

              {/* Winning Options */}
              {winningOptions.length > 0 && pollResults.totalVotes > 0 && (
                <div className="mb-6 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                  <h4 className="font-medium text-yellow-800 mb-1">
                    🏆 Winning Option{winningOptions.length > 1 ? "s" : ""}:
                  </h4>
                  <p className="text-yellow-700">{winningOptions.join(", ")}</p>
                </div>
              )}

              {/* Results Breakdown */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-700">Vote Breakdown:</h4>
                {formattedResults.map((result, index) => (
                  <div key={result.option} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{result.option}</span>
                      <span className="text-sm text-gray-600">
                        {result.votes} votes ({result.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ${
                          index === 0
                            ? "bg-green-500"
                            : index === 1
                              ? "bg-blue-500"
                              : index === 2
                                ? "bg-purple-500"
                                : index === 3
                                  ? "bg-yellow-500"
                                  : "bg-gray-400"
                        }`}
                        style={{ width: `${result.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}

                {pollResults.totalVotes === 0 && (
                  <p className="text-gray-500 text-center py-4">
                    No votes cast yet. Be the first to vote! 🗳️
                  </p>
                )}
              </div>

              {/* Poll Metadata */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-700 mb-2">
                  Poll Information:
                </h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    <strong>Poll ID:</strong> {pollResults.poll.id}
                  </p>
                  <p>
                    <strong>Created:</strong>{" "}
                    {formatDate(pollResults.poll.created_at)}
                  </p>
                  {pollResults.poll.start_time && (
                    <p>
                      <strong>Start Time:</strong>{" "}
                      {formatDate(pollResults.poll.start_time)}
                    </p>
                  )}
                  {pollResults.poll.end_time && (
                    <p>
                      <strong>End Time:</strong>{" "}
                      {formatDate(pollResults.poll.end_time)}
                    </p>
                  )}
                  <p>
                    <strong>Status:</strong>
                    <span
                      className={`ml-1 ${isPollActive(pollResults.poll) ? "text-green-600" : "text-red-600"}`}
                    >
                      {isPollActive(pollResults.poll) ? "Active" : "Inactive"}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* API Information */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">🔧 API Functions Used</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">
              🗳️ castVote(pollId, option)
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              Client-side function to cast a vote on an existing poll.
            </p>
            <div className="bg-gray-100 p-2 rounded text-xs font-mono">
              POST /api/polls/[pollId]/vote
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">
              📊 getPollResults(pollId)
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              Client-side function to retrieve poll results with vote counts and
              percentages.
            </p>
            <div className="bg-gray-100 p-2 rounded text-xs font-mono">
              GET /api/polls/[pollId]/results
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
