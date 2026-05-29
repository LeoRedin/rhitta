// =============================================================================
// _layout.tsx — root provider layout for Expo Router.
// =============================================================================
//
// Provider stack (order matters):
//   1. QueryClientProvider — TanStack Query for server-state management
//   2. Slot — renders the active route's content
//
// Deep link handler for magic link auth is set up once on mount.
// Splash screen is hidden after the mount to prevent a white flash.
// =============================================================================

import { QueryClientProvider } from '@tanstack/react-query'
import { Slot, SplashScreen } from 'expo-router'
import { useEffect, useState } from 'react'
import { setupDeepLinkHandler } from '../src/lib/auth/deep-link.js'
import { createQueryClient } from '../src/lib/queries/index.js'

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [queryClient] = useState(() => createQueryClient())

  useEffect(() => {
    // Set up deep link handler for magic link auth
    setupDeepLinkHandler()
    // Hide splash once mounted
    SplashScreen.hideAsync()
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <Slot />
    </QueryClientProvider>
  )
}
