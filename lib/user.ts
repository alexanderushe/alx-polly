'use client'

import { useEffect, useState } from 'react'
import { getCurrentUser } from './auth'
import { User } from '@supabase/supabase-js'

export function useUser() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      const userData = await getCurrentUser()
      setUser(userData)
    }

    fetchUser()
  }, [])

  return { user }
}
