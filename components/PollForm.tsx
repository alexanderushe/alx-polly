"use client";

import { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface PollFormProps {
  onSubmit: (data: { title: string; options: string[] }) => void;
  initialData?: { title: string; options: string[] };
}

export function PollForm({ onSubmit, initialData }: PollFormProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [options, setOptions] = useState(initialData?.options || ["", ""]);

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const addOption = () => {
    setOptions([...options, ""]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const filteredOptions = options.filter((option) => option.trim() !== "");
    if (title.trim() && filteredOptions.length >= 2) {
      onSubmit({ title, options: filteredOptions });
    } else {
      // Basic validation feedback
      alert("Please provide a title and at least two options.");
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create a New Poll</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Poll Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's your question?"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Options</Label>
            {options.map((option, index) => (
              <Input
                key={index}
                value={option}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                placeholder={`Option ${index + 1}`}
              />
            ))}
          </div>
          <div className="flex justify-between items-center">
            <Button type="button" variant="outline" onClick={addOption}>
              Add Option
            </Button>
            <Button type="submit">Create Poll</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
