// =============================================================================
// / — public landing page.
// =============================================================================
//
// Pre-auth surface. Redirects to /home if a session exists; otherwise shows
// sign-in / sign-up links.
// =============================================================================

import { Link, Redirect } from 'expo-router'
import { Text, View } from 'react-native'
import { useSession } from '../src/lib/auth/index.js'

export default function IndexPage() {
  const { data: session, isLoading } = useSession()

  if (isLoading) return null
  if (session?.user) return <Redirect href="/home" />

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <Text style={{ fontSize: 24, fontWeight: '600', marginBottom: 16 }}>Rhitta</Text>
      <Link href="/auth/sign-in">Sign in</Link>
      <Link href="/auth/sign-up" style={{ marginTop: 12 }}>
        Sign up
      </Link>
    </View>
  )
}
