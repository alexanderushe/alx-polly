"use client";

import { PollForm } from "../../../../components/PollForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../../components/ui/card";
import { getPoll, updatePoll } from "../../../../lib/polls";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { useEffect, useState } from "react";

type EditPollPageProps = {
  params: { pollId: string };
};

export default function EditPollPage({ params }: EditPollPageProps) {
  const router = useRouter();
  const [poll, setPoll] = useState<any>(null);

  useEffect(() => {
    const fetchPoll = async () => {
      const pollData = await getPoll(params.pollId);
      setPoll(pollData);
    };
    fetchPoll();
  }, [params.pollId]);

  const handleUpdatePoll = async (data: {
    title: string;
    options: string[];
  }) => {
    const result = await updatePoll(params.pollId, {
      question: data.title,
      options: data.options,
    });
    if (result.data) {
      toast.success("Poll updated successfully!");
      setTimeout(() => {
        router.push("/polls");
      }, 2000);
    } else {
      toast.error("Failed to update poll.");
      console.error("Failed to update poll:", result.error);
    }
  };

  if (!poll) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <Toaster />
      <div className="w-full max-w-2xl p-4">
        <PollForm onSubmit={handleUpdatePoll} initialData={{title: poll.question, options: poll.options}} />
      </div>
    </div>
  );
}
