
"use client";

import { useEffect, useState } from "react";
import { PollResultChart } from "./PollResultChart";
import { getVoteCounts } from "../lib/votes";

interface VoteResultProps {
  pollId: string;
}

export default function VoteResult({ pollId }: VoteResultProps) {
  const [voteCounts, setVoteCounts] = useState<any[]>([]);

  useEffect(() => {
    const fetchVoteCounts = async () => {
      const counts = await getVoteCounts(pollId);
      setVoteCounts(counts);
    };

    fetchVoteCounts();
  }, [pollId]);

  return (
    <div className="p-4 border rounded">
      <h2 className="text-lg font-bold mb-2">Poll Results</h2>
      <PollResultChart data={voteCounts} />
    </div>
  );
}
