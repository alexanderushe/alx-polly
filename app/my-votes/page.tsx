'use client'

import { useAuth } from '../../lib/authcomponents'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle } from '../../components/ui/card'
import Link from 'next/link'

interface Poll {
  id: string;
  question: string;
}

export default function MyVotesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [polls, setPolls] = useState<Poll[]>([])

  useEffect(() => {
    if (!user) {
      router.push('/login')
    } else {
      const fetchPolls = async () => {
        const response = await fetch('/api/my-votes');
        const data = await response.json();
        if (data.success) {
          setPolls(data.data);
        }
      }
      fetchPolls();
    }
  }, [user, router])

  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">My Votes</h1>
      </div>
      <div className="grid gap-4">
        {polls.map((poll) => (
          <Link key={poll.id} href={`/polls/${poll.id}`}>
            <Card>
              <CardHeader>
                <CardTitle>{poll.question}</CardTitle>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
