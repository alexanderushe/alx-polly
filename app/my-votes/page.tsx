"use client";

import { useUser } from "../../lib/user";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import Link from "next/link";
import { Vote } from "../../lib/votes";

interface VoteWithPoll extends Vote {
  polls: {
    id: string;
    question: string;
    options: string[];
    created_at: string;
  };
}

export default function MyVotesPage() {
  const { user } = useUser();
  const router = useRouter();
  const [votes, setVotes] = useState<VoteWithPoll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "question">("date");

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    const fetchVotes = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/my-votes");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch votes");
        }

        if (data.success) {
          setVotes(data.data.filter((vote: VoteWithPoll) => vote.polls));
        } else {
          throw new Error(data.error || "Failed to fetch votes");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchVotes();
  }, [user, router]);

  const filteredAndSortedVotes = useMemo(() => {
    let filtered = votes.filter(
      (vote) =>
        vote.polls.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vote.selected_option.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    filtered.sort((a, b) => {
      if (sortBy === "date") {
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      } else {
        return a.polls.question.localeCompare(b.polls.question);
      }
    });

    return filtered;
  }, [votes, searchQuery, sortBy]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!user) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center min-h-[50vh]">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Please log in</h2>
          <p className="text-gray-600 mb-4">
            You need to be logged in to view your votes.
          </p>
          <Link href="/login">
            <Button>Go to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Votes</h1>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center min-h-[50vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="w-full"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Votes</h1>
        <div className="text-sm text-gray-500">
          {votes.length} vote{votes.length !== 1 ? "s" : ""}
        </div>
      </div>

      {votes.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="space-y-4">
              <div className="text-6xl">🗳️</div>
              <h2 className="text-2xl font-semibold text-gray-600">
                No votes yet
              </h2>
              <p className="text-gray-500">
                You haven't voted on any polls yet.
              </p>
              <Link href="/polls">
                <Button className="mt-4">Browse Polls</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search your votes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={sortBy === "date" ? "default" : "outline"}
                onClick={() => setSortBy("date")}
                size="sm"
              >
                Sort by Date
              </Button>
              <Button
                variant={sortBy === "question" ? "default" : "outline"}
                onClick={() => setSortBy("question")}
                size="sm"
              >
                Sort by Question
              </Button>
            </div>
          </div>

          {filteredAndSortedVotes.length === 0 ? (
            <Card className="text-center py-8">
              <CardContent>
                <p className="text-gray-500">No votes match your search.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredAndSortedVotes.map((vote) => (
                <Card
                  key={vote.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg leading-tight pr-4">
                        {vote.polls.question}
                      </CardTitle>
                      <div className="text-xs text-gray-500 whitespace-nowrap">
                        {formatDate(vote.created_at)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-600">
                          Your vote:
                        </span>
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          {vote.selected_option}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="text-xs text-gray-500">
                          Poll created: {formatDate(vote.polls.created_at)}
                        </div>
                        <Link href={`/polls/${vote.polls.id}`}>
                          <Button variant="outline" size="sm">
                            View Results
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {filteredAndSortedVotes.length > 0 && (
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500">
                Showing {filteredAndSortedVotes.length} of {votes.length} votes
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
