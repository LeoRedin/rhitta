// =============================================================================
// client.ts — Better Auth React client for apps/mobile.
// =============================================================================
//
// Mirrors `apps/web/src/lib/auth/client.ts` but adapted for React Native:
//   - Uses `process.env.EXPO_PUBLIC_API_URL` instead of Vite's
//     `import.meta.env.VITE_BETTER_AUTH_URL`.
//   - Injects the bearer token from Expo SecureStore on each request via the
//     `onRequest` fetch hook (React Native has no cookie storage).
//   - Exports `getStoredToken` / `setStoredToken` / `clearStoredToken` helpers
//     so sign-in and sign-out flows can persist the session token.
//
// Plugins: only `magicLinkClient()` for v0. Email/password sign-in is part of
// Better Auth's core surface and needs no plugin.
//
// Verified against `better-auth@1.6.11`:
//   - `createAuthClient` from `better-auth/react` returns an object with
//     `signIn`, `signUp`, `signOut`, `getSession`, plus plugin-contributed
//     actions (`signIn.magicLink`, `magicLink.verify`).
//   - All actions return `{ data, error }` shaped responses from
//     `@better-fetch/fetch`.
// =============================================================================

import { magicLinkClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'
import * as SecureStore from 'expo-secure-store'

/** Key used to persist the auth token in Expo SecureStore. */
export const TOKEN_KEY = 'rhitta:auth:token'

const apiBase = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000'

export const authClient = createAuthClient({
  baseURL: `${apiBase}/auth`,
  plugins: [magicLinkClient()],
  fetchOptions: {
    onRequest: async (context) => {
      try {
        const token = await SecureStore.getItemAsync(TOKEN_KEY)
        if (token) {
          context.headers = {
            ...context.headers,
            Authorization: `Bearer ${token}`,
          }
        }
      } catch {
        // SecureStore may be unavailable (SSR, dev, or test environment).
      }
      return context
    },
  },
})

export const { signIn, signUp, signOut, getSession } = authClient

// ---------------------------------------------------------------------------
// Token persistence helpers
// ---------------------------------------------------------------------------

export async function getStoredToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY)
  } catch {
    return null
  }
}

export async function setStoredToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token)
}

export async function clearStoredToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY)
}
