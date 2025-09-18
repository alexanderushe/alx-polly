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
  const { user, loading } = useUser();
  const router = useRouter();
  const [polls, setPolls] = useState<Poll[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (!loading && user) {
      const fetchPolls = async () => {
        const pollsData = await getPolls();
        setPolls(pollsData);
      };
      fetchPolls();
    }
  }, [user, loading, router]);

  const handleDelete = async (pollId: string) => {
    if (window.confirm("Are you sure you want to delete this poll?")) {
      await deletePoll(pollId);
      setPolls(polls.filter((p) => p.id !== pollId));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

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
