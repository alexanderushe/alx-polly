"use client";

import React, { useEffect, useState } from "react";
import { getPoll } from "../../../lib/polls";
import { castVote, getPollResults } from "../../../lib/pollApi"; // unified import
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import PollResultChart from "../../../components/VoteResult"; // renamed for clarity

type PollPageProps = {
  params: { pollId: string };
};

interface VoteCount {
  option: string;
  count: number;
}

interface PollResults {
  poll: any;
  results: Array<{
    option: string;
    votes: number;
    percentage: number;
  }>;
  totalVotes: number;
  userVote: string | null;
  hasUserVoted: boolean;
}

export default function PollPage({ params }: PollPageProps) {
  const [poll, setPoll] = useState<any>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [voted, setVoted] = useState(false);
  const [voteCounts, setVoteCounts] = useState<VoteCount[]>([]);
  const [pollResults, setPollResults] = useState<PollResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPoll = async () => {
      try {
        const pollData = await getPoll(params.pollId);
        setPoll(pollData);

        const resultsResponse = await getPollResults(params.pollId);
        if (resultsResponse.success && resultsResponse.data) {
          setPollResults(resultsResponse.data);
          setVoted(resultsResponse.data.hasUserVoted);

          const counts = resultsResponse.data.results.map((r) => ({
            option: r.option,
            count: r.votes,
          }));
          setVoteCounts(counts);
        }
      } catch (err) {
        setError("Failed to load poll data");
      }
    };
    fetchPoll();
  }, [params.pollId]);

  const handleVote = async () => {
    if (!selectedOption) return;

    setLoading(true);
    setError(null);

    const voteResult = await castVote(params.pollId, selectedOption);
    if (voteResult.success) {
      setVoted(true);

      const resultsResponse = await getPollResults(params.pollId);
      if (resultsResponse.success && resultsResponse.data) {
        setPollResults(resultsResponse.data);
        const counts = resultsResponse.data.results.map((r) => ({
          option: r.option,
          count: r.votes,
        }));
        setVoteCounts(counts);
      }
    } else {
      setError(voteResult.error || "Failed to cast vote");
    }

    setLoading(false);
  };

  if (!poll) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{poll.question}</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              Error: {error}
            </div>
          )}

          {!voted ? (
            <div className="flex flex-col space-y-2">
              {poll.options.map((option: string, index: number) => (
                <Button
                  key={index}
                  variant={selectedOption === option ? "default" : "outline"}
                  onClick={() => setSelectedOption(option)}
                  disabled={loading}
                >
                  {option}
                </Button>
              ))}
              <Button
                onClick={handleVote}
                className="mt-4"
                disabled={!selectedOption || loading}
              >
                {loading ? "Casting Vote..." : "Vote"}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Results</h2>
              {pollResults && (
                <div className="mb-4 p-3 bg-blue-50 rounded">
                  <p className="text-sm text-blue-700">
                    You voted for: <strong>{pollResults.userVote}</strong>
                  </p>
                  <p className="text-sm text-blue-600">
                    Total votes: {pollResults.totalVotes}
                  </p>
                </div>
              )}
              <PollResultChart data={voteCounts} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
