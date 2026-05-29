// =============================================================================
// /agent — run the AI agent with a prompt.
// =============================================================================
//
// The form is wired via `createZodForm(AgentRunRequestSchema)` so the contract
// schema from `@rhitta/contracts/agent-runs` is the single source of truth for
// validation (ADR-0017 belt-and-braces). The submit handler delegates to the
// `useRunAgent` TanStack Query mutation; on success we push a toast from the
// Zustand queue and display the result in a Card below the form.
//
// We deliberately omit maxTokens from the form (the schema's default of 2048
// suffices for a demo page).
//
// We deliberately avoid per-route auth checks — the `_authenticated` parent
// layout is the single gate (AGENTS.md rule 10, ADR-0023).
// =============================================================================

import { AgentRunRequestSchema, type AgentRunResponse } from '@rhitta/contracts/agent-runs'
import { Button, Card, Spinner, useAppTheme } from '@rhitta/design-system-mobile'
import { createZodForm, InputField, TextareaField } from '@rhitta/design-system-mobile/forms'
import { useState } from 'react'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { useRunAgent } from '../../src/lib/queries/index.js'
import { useToastQueue } from '../../src/lib/toasts/index.js'

const useAgentForm = createZodForm(AgentRunRequestSchema)

export default function AgentPage() {
  const agent = useRunAgent()
  const push = useToastQueue((state) => state.push)
  const { colors } = useAppTheme()
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AgentRunResponse | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)

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
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.surface }}
      contentContainerStyle={{ padding: 20, gap: 24 }}
    >
      <Text
        style={{
          fontSize: 28,
          fontWeight: '600',
          color: colors.text,
        }}
      >
        Agent
      </Text>

      {error && (
        <Text style={{ fontSize: 14, color: colors.error }} role="alert">
          {error}
        </Text>
      )}

      <View style={{ gap: 16 }}>
        <form.Field name="prompt">
          {(field) => <TextareaField field={field} label="Prompt" numberOfLines={6} />}
        </form.Field>

        <TouchableOpacity activeOpacity={0.7} onPress={() => setShowAdvanced((v) => !v)}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: '500',
              color: colors.text,
              opacity: 0.6,
            }}
          >
            {showAdvanced ? 'Hide advanced' : 'Advanced'}
          </Text>
        </TouchableOpacity>

        {showAdvanced && (
          <View style={{ gap: 16 }}>
            <form.Field name="systemPrompt">
              {(field) => <TextareaField field={field} label="System prompt" />}
            </form.Field>
            <form.Field name="model">
              {(field) => <InputField field={field} label="Model" />}
            </form.Field>
          </View>
        )}

        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <Button
            onPress={() => {
              void form.handleSubmit()
            }}
            disabled={form.state.isSubmitting}
          >
            {form.state.isSubmitting ? 'Running...' : 'Run'}
          </Button>
          {form.state.isSubmitting && <Spinner />}
        </View>
      </View>

      {result && (
        <Card>
          <Text
            style={{
              fontFamily: 'monospace',
              fontSize: 14,
              color: colors.text,
            }}
          >
            {result.output}
          </Text>
          <Text
            style={{
              marginTop: 16,
              fontSize: 14,
              color: colors.text,
              opacity: 0.6,
            }}
          >
            {result.inputTokens} input &middot; {result.outputTokens} output tokens
          </Text>
        </Card>
      )}
    </ScrollView>
  )
}
