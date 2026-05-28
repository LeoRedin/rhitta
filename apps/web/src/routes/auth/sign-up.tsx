// =============================================================================
// /auth/sign-up — email + password registration.
// =============================================================================
//
// Better Auth's `signUp.email({ name, email, password, callbackURL })`
// POSTs to `/sign-up/email`. On success the API creates the user and
// (depending on apps/api's verification policy) either issues a session
// cookie immediately or sends a verification email. Either way the
// `{ data, error }` envelope is what we render against.
//
// Already-signed-in users are bounced to `/` from `beforeLoad`.
// =============================================================================

import { Button } from '@rhitta/design-system-web'
import { createZodForm, InputField } from '@rhitta/design-system-web/forms'
import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { z } from 'zod'
import { signUp } from '../../lib/auth/index.js'

const SignUpSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8),
})

type RouteContext = {
  getSession?: () => Promise<{ data: { user?: unknown } | null } | null | undefined>
}

export const Route = createFileRoute('/auth/sign-up')({
  beforeLoad: async ({ context }) => {
    const ctx = context as RouteContext
    const session = await ctx.getSession?.()
    if (session?.data?.user) throw redirect({ to: '/' })
  },
  component: SignUpPage,
})

const useSignUpForm = createZodForm(SignUpSchema)

function SignUpPage() {
  const [error, setError] = useState<string | null>(null)

  const form = useSignUpForm({
    defaultValues: { name: '', email: '', password: '' },
    onSubmit: async ({ value }) => {
      setError(null)
      const result = await signUp.email({
        name: value.name,
        email: value.email,
        password: value.password,
        callbackURL: '/',
      })
      if (result.error) {
        setError(result.error.message ?? 'Sign-up failed')
      }
    },
  })

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-6">
      <h1 className="text-3xl font-semibold text-text-body">Create your account</h1>

      {error && (
        <p className="text-sm text-text-danger" role="alert">
          {error}
        </p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          void form.handleSubmit()
        }}
        className="flex flex-col gap-4"
      >
        <form.Field name="name">{(field) => <InputField field={field} label="Name" />}</form.Field>
        <form.Field name="email">
          {(field) => <InputField field={field} label="Email" type="email" />}
        </form.Field>
        <form.Field name="password">
          {(field) => <InputField field={field} label="Password" type="password" />}
        </form.Field>
        <Button type="submit" disabled={form.state.isSubmitting}>
          Sign up
        </Button>
      </form>

      <p className="text-sm text-text-muted">
        Already have an account?{' '}
        <Link to="/auth/sign-in" className="text-brand-primary underline">
          Sign in
        </Link>
      </p>
    </main>
  )
}
