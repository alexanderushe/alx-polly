import Navbar from "../components/Navbar";
import { PollResultChart } from "../components/PollResultChart";

export default function Home() {
  const pollData = [
    { option: "Option A", count: 10 },
    { option: "Option B", count: 20 },
    { option: "Option C", count: 15 },
  ];

  return (
    <main>
      <Navbar />
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Welcome to Polly</h1>
        <div className="my-8">
          <h2 className="text-xl font-semibold mb-4">Poll Results</h2>
          <PollResultChart data={pollData} />
        </div>
      </div>
    </main>
  );
}
