import Navbar from '../components/Navbar';

export default function Home() {
  return (
    <main>
      <Navbar />
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Welcome to Polly</h1>
      </div>
    </main>
  );
}