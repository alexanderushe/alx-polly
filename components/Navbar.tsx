"use client";

import Link from "next/link";
import { useUser } from "../lib/user";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { user, loading } = useUser();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <nav className="p-4 bg-gray-100 flex gap-4">
        <Link href="/">Home</Link>
        <div className="animate-pulse h-4 bg-gray-300 rounded w-20"></div>
      </nav>
    );
  }

  return (
    <nav className="p-4 bg-gray-100 flex gap-4">
      <Link href="/">Home</Link>
      <Link href="/polls">Polls</Link>
      <Link href="/my-votes">My Votes</Link>
      {user && <Link href="/polls/new">New Poll</Link>}
      <Link href="/debug" className="text-red-600 font-bold">
        Debug
      </Link>
      {!user ? (
        <Link href="/login">Login</Link>
      ) : (
        <button onClick={handleLogout}>Logout</button>
      )}
    </nav>
  );
}
