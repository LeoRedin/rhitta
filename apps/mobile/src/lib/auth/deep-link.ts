// =============================================================================
// deep-link.ts — magic link deep link handler for React Native.
// =============================================================================
//
// Listens for incoming URLs matching the `rhitta://auth/callback?token=...`
// scheme and calls `authClient.magicLink.verify` to complete magic link sign-in.
//
// Call `setupDeepLinkHandler()` once at app startup (e.g. in `_layout.tsx` or
// the root App component). The returned subscription's `.remove()` method
// should be called during cleanup.
//
// Uses `Linking.parse()` instead of the `URL` constructor because React Native
// does not provide the full `URL` Web API in its JavaScript environment.
// =============================================================================

import * as Linking from 'expo-linking'
import { authClient } from './client.js'

export function setupDeepLinkHandler() {
  const subscription = Linking.addEventListener('url', async ({ url }) => {
    try {
      const parsed = Linking.parse(url)
      if (parsed.path === '/auth/callback') {
        const token = parsed.queryParams?.token
        if (typeof token === 'string') {
          await authClient.magicLink.verify({ query: { token } })
        }
      }
    } catch {
      // Malformed URL or missing params — ignore.
    }
  })
  return subscription
}
