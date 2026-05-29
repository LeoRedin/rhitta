// =============================================================================
// use-session.ts — custom session hook for React Native (no cookies).
// =============================================================================
//
// Unlike the web client (which relies on Better Auth's `useSession` from
// `better-auth/react` + cookies), mobile uses a manually managed session hook
// that calls `authClient.getSession()` directly.
//
// Token injection is handled transparently in `client.ts` via the `onRequest`
// fetch hook — no cookie jar is available on React Native.
//
// The returned shape mirrors the web's `useSession` surface but is simpler:
//   { data: SessionData | null, error: Error | null, isLoading: boolean }
// =============================================================================

import { useEffect, useState } from 'react'
import { authClient } from './client.js'

type SessionResult = Awaited<ReturnType<typeof authClient.getSession>>

export function useSession() {
  const [data, setData] = useState<SessionResult['data']>(null)
  const [error, setError] = useState<SessionResult['error']>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    authClient
      .getSession()
      .then((res) => {
        setData(res.data)
        setError(res.error)
      })
      .finally(() => setIsLoading(false))
  }, [])

  return { data, error, isLoading }
}
