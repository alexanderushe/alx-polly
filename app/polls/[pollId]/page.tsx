"use client";

import React, { useEffect, useState } from "react";
import { getPoll } from "../../../lib/polls";
import { castVote } from "../../../lib/votes";
import { Button } from "../../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import VoteResult from "../../../components/VoteResult";

type PollPageProps = {
  params: { pollId: string };
};

export default function PollPage({ params }: PollPageProps) {
  const [poll, setPoll] = useState<any>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [voted, setVoted] = useState(false);

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
    }
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
            <VoteResult pollId={params.pollId} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}