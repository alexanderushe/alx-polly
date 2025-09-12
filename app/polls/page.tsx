"use client";

import { useUser } from "../../lib/user";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import Link from "next/link";
import { getPolls, deletePoll } from "../../lib/polls";

interface Poll {
  id: string;
  question: string;
  creator_id: string;
}

export default function PollsPage() {
  const { user } = useUser();
  const router = useRouter();
  const [polls, setPolls] = useState<Poll[]>([]);

  useEffect(() => {
    if (!user) {
      router.push("/login");
    } else {
      const fetchPolls = async () => {
        const pollsData = await getPolls();
        setPolls(pollsData);
      };
      fetchPolls();
    }
  }, [user, router]);

  const handleDelete = async (pollId: string) => {
    if (window.confirm("Are you sure you want to delete this poll?")) {
      await deletePoll(pollId);
      setPolls(polls.filter((p) => p.id !== pollId));
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Polls</h1>
        <Button asChild>
          <Link href="/polls/new">Create Poll</Link>
        </Button>
      </div>
      <div className="grid gap-4">
        {polls.map((poll) => (
          <Card key={poll.id}>
            <CardHeader>
              <CardTitle>{poll.question}</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-end space-x-2">
              <Link href={`/polls/${poll.id}`}>
                <Button variant="outline">View</Button>
              </Link>
              {user && user.id === poll.creator_id && (
                <>
                  <Link href={`/polls/${poll.id}/edit`}>
                    <Button variant="outline">Edit</Button>
                  </Link>
                  <Button
                    variant="destructive"
                    onClick={() => handleDelete(poll.id)}
                  >
                    Delete
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
