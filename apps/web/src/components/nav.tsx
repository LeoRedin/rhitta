// =============================================================================
// nav.tsx — top navigation bar for the authenticated app shell.
// =============================================================================
//
// Rendered inside `_authenticated/route.tsx`'s layout, so it appears on
// every protected page. Three concerns:
//
//   - Branding + section links (Notes, Agent).
//   - Theme toggle (mounted via `<ThemeToggle />`).
//   - Sign-out action that routes through the Better Auth client.
//
// Note on link targets
// --------------------
// `/notes` and `/agent` aren't wired until Tasks 10 and 11. Until then
// the router types don't yet know about them; the targets here point at
// the authenticated home so typecheck stays clean. The route paths will
// update once Tasks 10/11 land.
// =============================================================================

import { Button } from '@rhitta/design-system-web'
import { Link, useRouter } from '@tanstack/react-router'
import { signOut } from '../lib/auth/index.js'
import { ThemeToggle } from './theme-toggle.js'

export function Nav() {
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    await router.invalidate()
    await router.navigate({ to: '/' })
  }

  return (
    <nav className="flex items-center justify-between border-b border-border-default bg-bg-surface px-6 py-3">
      <div className="flex items-center gap-6">
        <Link to="/home" className="text-lg font-semibold text-text-body">
          Rhitta
        </Link>
        <div className="flex gap-4">
          <Link to="/home" className="text-sm text-text-muted hover:text-text-body">
            Notes
          </Link>
          <Link to="/home" className="text-sm text-text-muted hover:text-text-body">
            Agent
          </Link>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            void handleSignOut()
          }}
        >
          Sign out
        </Button>
      </div>
    </nav>
  )
}
