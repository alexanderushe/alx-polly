"use client";

import Link from "next/link";
import { useUser } from "../lib/user";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { user } = useUser();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <nav className="p-4 bg-gray-100 flex gap-4">
      <Link href="/">Home</Link>
      <Link href="/polls">Polls</Link>
      <Link href="/my-votes">My Votes</Link>
      {user && <Link href="/polls/new">New Poll</Link>}
      {user && <Link href="/notifications">Notifications</Link>}
      {user && <Link href="/poll-api-demo">API Demo</Link>}
      {!user ? (
        <Link href="/login">Login</Link>
      ) : (
        <button onClick={handleLogout}>Logout</button>
      )}
    </nav>
  );
}
