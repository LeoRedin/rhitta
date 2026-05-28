// =============================================================================
// /_authenticated/agent — run the AI agent with a prompt.
// =============================================================================
//
// The form is wired via `createZodForm(AgentRunRequestSchema)` so the contract
// schema from `@rhitta/contracts/agent-runs` is the single source of truth for
// validation (ADR-0017 belt-and-braces). The submit handler delegates to the
// `useRunAgent` TanStack Query mutation; on success we push a toast from the
// Zustand queue and display the result in a Card below the form.
//
// We deliberately omit maxTokens from the form (the DOM emits strings, and
// the schema's default of 2048 suffices for a demo page).
//
// We deliberately avoid per-route auth checks — the `_authenticated`
// parent's `beforeLoad` is the single gate (AGENTS.md rule 10).
// =============================================================================

import { AgentRunRequestSchema, type AgentRunResponse } from '@rhitta/contracts/agent-runs'
import { Button, Card, Spinner } from '@rhitta/design-system-web'
import { createZodForm, InputField, TextareaField } from '@rhitta/design-system-web/forms'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useRunAgent } from '../../lib/queries/index.js'
import { useToastQueue } from '../../lib/toasts/index.js'

export const Route = createFileRoute('/_authenticated/agent')({
  component: AgentPage,
})

const useAgentForm = createZodForm(AgentRunRequestSchema)

function AgentPage() {
  const agent = useRunAgent()
  const push = useToastQueue((state) => state.push)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AgentRunResponse | null>(null)

  const form = useAgentForm({
    defaultValues: { prompt: '', systemPrompt: '', model: 'claude-sonnet-4-6' },
    onSubmit: async ({ value }) => {
      setError(null)
      try {
        const run = await agent.mutateAsync(value)
        setResult(run)
        push({ title: 'Agent run complete', variant: 'success' })
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to run agent')
      }
    },
  })

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold text-text-body">Agent</h1>

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
        <form.Field name="prompt">
          {(field) => <TextareaField field={field} label="Prompt" rows={6} />}
        </form.Field>

        <details>
          <summary className="cursor-pointer text-sm font-medium text-text-muted">Advanced</summary>
          <div className="flex flex-col gap-4 pt-4">
            <form.Field name="systemPrompt">
              {(field) => <TextareaField field={field} label="System prompt" />}
            </form.Field>
            <form.Field name="model">
              {(field) => <InputField field={field} label="Model" />}
            </form.Field>
          </div>
        </details>

        <div className="flex gap-3">
          <Button type="submit" disabled={form.state.isSubmitting}>
            {form.state.isSubmitting ? 'Running…' : 'Run'}
          </Button>
          {form.state.isSubmitting && <Spinner />}
        </div>
      </form>

      {result && (
        <Card>
          <pre className="whitespace-pre-wrap text-sm text-text-body">{result.output}</pre>
          <p className="mt-4 text-sm text-text-muted">
            {result.inputTokens} input &middot; {result.outputTokens} output tokens
          </p>
        </Card>
      )}
    </section>
  )
}
