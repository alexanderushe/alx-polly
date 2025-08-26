'use client';

import Navbar from '@/components/Navbar';

export default function PollsPage() {
  return (
    <div>
      <Navbar />
      <h1 className="text-2xl font-bold p-4">Polls Dashboard</h1>
      <p className="p-4">This is where polls will be listed.</p>
    </div>
  );
}
