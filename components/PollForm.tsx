'use client';

import { Button } from '@/components/ui/button';

export default function PollForm() {
  return (
    <form className="space-y-4 p-4 border rounded">
      <input type="text" placeholder="Poll question" className="input" />
      <input type="text" placeholder="Option 1" className="input" />
      <input type="text" placeholder="Option 2" className="input" />
      <Button type="submit">Create Poll</Button>
    </form>
  );
}
