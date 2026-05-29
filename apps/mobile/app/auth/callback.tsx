// =============================================================================
// /auth/callback — magic link callback handler.
// =============================================================================
//
// Receives the token query param from the deep link and verifies it via
// authClient.magicLink.verify(). On success redirects to /home.
// =============================================================================

import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { Text, View } from 'react-native'
import { authClient } from '../../src/lib/auth/index.js'

export default function CallbackPage() {
  const { token } = useLocalSearchParams<{ token?: string }>()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (token) {
      authClient.magicLink
        .verify({ query: { token } })
        .then(() => router.replace('/home'))
        .catch((e) => setError(e instanceof Error ? e.message : 'Verification failed'))
    }
  }, [token, router])

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text style={{ color: 'red' }}>{error}</Text>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Verifying...</Text>
    </View>
  )
}
