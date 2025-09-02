"use client";

import React, { useEffect, useState } from "react";
import { getPoll } from "../../../lib/polls";
import { castVote, getVoteCounts } from "../../../lib/votes";
import { Button } from "../../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";

type PollPageProps = {
  params: { pollId: string };
};

interface VoteCount {
  option: string;
  count: number;
}

export default function PollPage({ params }: PollPageProps) {
  const [poll, setPoll] = useState<any>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [voted, setVoted] = useState(false);
  const [voteCounts, setVoteCounts] = useState<VoteCount[]>([]);

  useEffect(() => {
    const fetchPoll = async () => {
      const pollData = await getPoll(params.pollId);
      setPoll(pollData);
    };
    fetchPoll();
  }, [params.pollId]);

  const handleVote = async () => {
    if (selectedOption) {
      setVoted(true);
      await castVote(params.pollId, selectedOption);
      const counts = await getVoteCounts(params.pollId);
      setVoteCounts(counts);
    }
  };

  if (!poll) {
    return <div>Loading...</div>;
  }

  const totalVotes = voteCounts.reduce((acc, item) => acc + item.count, 0);

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{poll.question}</CardTitle>
        </CardHeader>
        <CardContent>
          {!voted ? (
            <div className="flex flex-col space-y-2">
              {poll.options.map((option: string, index: number) => (
                <Button
                  key={index}
                  variant={selectedOption === option ? "default" : "outline"}
                  onClick={() => setSelectedOption(option)}
                >
                  {option}
                </Button>
              ))}
              <Button
                onClick={handleVote}
                className="mt-4"
                disabled={!selectedOption}
              >
                Vote
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Results</h2>
              {poll.options.map((option: string, index: number) => {
                const voteCount =
                  voteCounts.find((vc) => vc.option === option)?.count || 0;
                const percentage =
                  totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
                return (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between">
                      <span>{option}</span>
                      <span>{voteCount} votes</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
