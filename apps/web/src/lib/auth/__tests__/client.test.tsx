// =============================================================================
// client.test.tsx — smoke tests for the Better Auth React client wrapper.
// =============================================================================
//
// We deliberately keep this surface narrow. The Better Auth client itself
// is exhaustively tested upstream; what we own is:
//   1. The module constructs without throwing under the same env Vite/SSR
//      will use (no real network — we never call `useSession`'s fetcher
//      from a hook in this test).
//   2. The named exports we promise downstream consumers actually exist
//      and are functions.
//   3. The `useSession` hook is renderable inside a React tree — it does
//      not require the rest of the app to mount any provider beforehand.
//
// Integration with the API (real cookies, real session) is exercised by
// Phase 3's e2e suite, not here.
// =============================================================================

import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { authClient, signIn, signOut, signUp, useSession } from '../index.js'

describe('authClient construction', () => {
  it('is a defined object exposing core methods', () => {
    expect(authClient).toBeDefined()
    // Better Auth's client is a callable Proxy — `typeof` may report
    // either 'function' or 'object' depending on how the Proxy traps the
    // `apply` slot. What matters is that the named methods we re-export
    // from this barrel are reachable through it.
    expect(['object', 'function']).toContain(typeof authClient)
    expect(typeof authClient.useSession).toBe('function')
  })

  it('re-exports signIn / signUp / signOut as objects/functions', () => {
    // Better Auth namespaces sign-in actions: `signIn.email`, `signIn.magicLink`.
    expect(signIn).toBeDefined()
    expect(typeof signIn.email).toBe('function')
    expect(typeof signIn.magicLink).toBe('function')

    expect(signUp).toBeDefined()
    expect(typeof signUp.email).toBe('function')

    expect(typeof signOut).toBe('function')
  })
})

describe('useSession', () => {
  it('renders inside a component without throwing', () => {
    function Probe() {
      // We only care that calling the hook doesn't blow up the render —
      // the actual session payload will be `null` here because no real
      // API is reachable in jsdom, and that's fine.
      const session = useSession()
      return <div data-testid="probe">{session?.data?.user ? 'in' : 'out'}</div>
    }
    const { getByTestId } = render(<Probe />)
    expect(getByTestId('probe').textContent).toBe('out')
  })
})
