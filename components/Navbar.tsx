import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="p-4 bg-gray-100 flex gap-4">
      <Link href="/">Home</Link>
      <Link href="/polls">Polls</Link>
      <Link href="/polls/new">New Poll</Link>
      <Link href="/login">Login</Link>
    </nav>
  );
}