"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsAuthenticated(true);
      } else {
        toast.error("You must be logged in to create a poll");
        router.push("/login");
      }
    };
    checkAuth();
  }, [router]);

  const handleCreatePoll = async (data: {
    title: string;
    options: string[];
    startTime?: string;
    endTime?: string;
  }) => {
    if (!isAuthenticated) {
      toast.error("You must be logged in to create a poll");
      return;
    }

    try {
      const now = new Date().toISOString();
      let startTime = data.startTime;
      let endTime = data.endTime;

      if (startTime === "") startTime = undefined;
      if (endTime === "") endTime = undefined;

      if (startTime && startTime < now) {
        toast.error("Start time cannot be in the past");
        return;
      }

      if (startTime && endTime && endTime <= startTime) {
        toast.error("End time must be after start time");
        return;
      }

      console.log("Creating poll with data:", {
        question: data.title,
        options: data.options,
        start_time: startTime,
        end_time: endTime,
      });

      const result = await createPoll({
        question: data.title,
        options: data.options,
        start_time: startTime,
        end_time: endTime,
      });

      console.log("Create poll result:", result);

      if (result.data) {
        toast.success("Poll created successfully!");
        setTimeout(() => {
          router.push("/polls");
        }, 2000);
      } else {
        const errorMessage = result.error || "Failed to create poll";
        toast.error(errorMessage);
        console.error("Failed to create poll:", result.error);
      }
    } catch (error) {
      console.error("Exception creating poll:", error);
      toast.error("An unexpected error occurred");
    }
  };

  if (!isAuthenticated) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <Toaster />
      <div className="w-full max-w-2xl p-4">
        <PollForm onSubmit={handleCreatePoll} />
      </div>
    </div>
  );
}