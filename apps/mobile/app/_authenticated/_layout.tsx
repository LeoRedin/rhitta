// =============================================================================
// /_authenticated — the single auth gate (AGENTS.md rule 10, ADR-0023).
// =============================================================================
//
// Expo Router's `_` prefix marks a "pathless layout route" — the URL shape
// stays clean (`/home`, `/notes`, `/agent`), but every child route inherits
// this layout and its session check. That makes this file the one and only
// auth check for protected routes in apps/mobile. Adding a second session
// check anywhere else is a violation of ADR-0023.
//
// Flow
// ----
// 1. Calls useSession() to get the current session.
// 2. If loading, shows an ActivityIndicator.
// 3. If no session.user, redirects to /auth/sign-in using <Redirect>.
// 4. Otherwise renders <Slot /> for the child route.
// =============================================================================

import { Redirect, Slot } from 'expo-router'
import { ActivityIndicator, View } from 'react-native'
import { useSession } from '../../src/lib/auth/index.js'

export default function AuthenticatedLayout() {
  const { data: session, isLoading } = useSession()

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  if (!session?.user) {
    return <Redirect href="/auth/sign-in" />
  }

  return <Slot />
}
