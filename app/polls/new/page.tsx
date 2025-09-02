"use client";

import { PollForm } from "../../../components/PollForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { createPoll } from "../../../lib/polls";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";

export default function NewPollPage() {
  const router = useRouter();
  const handleCreatePoll = async (data: {
    title: string;
    options: string[];
  }) => {
    const result = await createPoll({
      question: data.title,
      options: data.options,
    });
    if (result.data) {
      toast.success("Poll created successfully!");
      setTimeout(() => {
        router.push("/polls");
      }, 2000);
    } else {
      toast.error("Failed to create poll.");
      console.error("Failed to create poll:", result.error);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <Toaster />
      <div className="w-full max-w-2xl p-4">
        <PollForm onSubmit={handleCreatePoll} />
      </div>
    </div>
  );
}
