// =============================================================================
// /auth/sign-in — magic link + email/password tabs.
// =============================================================================
//
// Two auth modes share a single page:
//   1. Magic link — Better Auth's `signIn.magicLink({ email, callbackURL })`
//      POSTs to `/sign-in/magic-link` and returns `{ data: { status }, error }`
//      after enqueueing the email. We render a "check your email" state on
//      success; the actual session lands when the user clicks the link and
//      the API's `/magic-link/verify` handler sets the cookie.
//   2. Email + password — Better Auth's `signIn.email({ email, password,
//      callbackURL })` POSTs to `/sign-in/email`. On success the session
//      cookie is set; the user is redirected to `callbackURL` by Better
//      Auth or — if the call resolves client-side first — by our own
//      router.
//
// Already-signed-in users are bounced to `/` from `beforeLoad`. The
// optional `context.getSession?.()` chain lets this file ship before
// Task 9 wires the route context globally; once wired, the call resolves
// the session via the shared SSR helper.
// =============================================================================

import { Button } from '@rhitta/design-system-web'
import { createZodForm, InputField } from '@rhitta/design-system-web/forms'
import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { z } from 'zod'
import { signIn } from '../../lib/auth/index.js'

const MagicLinkSchema = z.object({
  email: z.string().email(),
})

const PasswordSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

type RouteContext = {
  getSession?: () => Promise<{ data: { user?: unknown } | null } | null | undefined>
}

export const Route = createFileRoute('/auth/sign-in')({
  beforeLoad: async ({ context }) => {
    const ctx = context as RouteContext
    const session = await ctx.getSession?.()
    if (session?.data?.user) throw redirect({ to: '/' })
  },
  component: SignInPage,
})

const useMagicLinkForm = createZodForm(MagicLinkSchema)
const usePasswordForm = createZodForm(PasswordSchema)

function SignInPage() {
  const [mode, setMode] = useState<'magic-link' | 'password'>('magic-link')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const magicForm = useMagicLinkForm({
    defaultValues: { email: '' },
    onSubmit: async ({ value }) => {
      setError(null)
      const result = await signIn.magicLink({
        email: value.email,
        callbackURL: '/',
      })
      if (result.error) {
        setError(result.error.message ?? 'Failed to send magic link')
      } else {
        setSent(true)
      }
    },
  })

  const pwForm = usePasswordForm({
    defaultValues: { email: '', password: '' },
    onSubmit: async ({ value }) => {
      setError(null)
      const result = await signIn.email({
        email: value.email,
        password: value.password,
        callbackURL: '/',
      })
      if (result.error) {
        setError(result.error.message ?? 'Sign-in failed')
      }
    },
  })

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-6">
      <h1 className="text-3xl font-semibold text-text-body">Sign in</h1>

      <div className="flex gap-2 border-b border-border-default">
        <button
          type="button"
          onClick={() => setMode('magic-link')}
          className={`px-3 py-2 text-sm font-medium ${
            mode === 'magic-link'
              ? 'border-b-2 border-brand-primary text-text-body'
              : 'text-text-muted'
          }`}
        >
          Magic link
        </button>
        <button
          type="button"
          onClick={() => setMode('password')}
          className={`px-3 py-2 text-sm font-medium ${
            mode === 'password'
              ? 'border-b-2 border-brand-primary text-text-body'
              : 'text-text-muted'
          }`}
        >
          Email + password
        </button>
      </div>

      {error && (
        <p className="text-sm text-text-danger" role="alert">
          {error}
        </p>
      )}

      {mode === 'magic-link' ? (
        sent ? (
          <p className="text-sm text-text-muted">Check your email for a sign-in link.</p>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void magicForm.handleSubmit()
            }}
            className="flex flex-col gap-4"
          >
            <magicForm.Field name="email">
              {(field) => <InputField field={field} label="Email" type="email" />}
            </magicForm.Field>
            <Button type="submit" disabled={magicForm.state.isSubmitting}>
              Send magic link
            </Button>
          </form>
        )
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void pwForm.handleSubmit()
          }}
          className="flex flex-col gap-4"
        >
          <pwForm.Field name="email">
            {(field) => <InputField field={field} label="Email" type="email" />}
          </pwForm.Field>
          <pwForm.Field name="password">
            {(field) => <InputField field={field} label="Password" type="password" />}
          </pwForm.Field>
          <Button type="submit" disabled={pwForm.state.isSubmitting}>
            Sign in
          </Button>
        </form>
      )}

      <p className="text-sm text-text-muted">
        New here?{' '}
        <Link to="/auth/sign-up" className="text-brand-primary underline">
          Create an account
        </Link>
      </p>
    </main>
  )
}
