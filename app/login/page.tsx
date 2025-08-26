'use client';

import { Button } from '@/components/ui/button';

export default function LoginPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      <form className="space-y-4">
        <input type="email" placeholder="Email" className="input" />
        <input type="password" placeholder="Password" className="input" />
        <Button type="submit">Login</Button>
      </form>
    </div>
  );
}
