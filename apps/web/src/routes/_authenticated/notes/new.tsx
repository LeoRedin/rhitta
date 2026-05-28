// =============================================================================
// /_authenticated/notes/new — create a new note.
// =============================================================================
//
// The form is wired via `createZodForm(CreateNoteSchema)` so the contract
// schema from `@rhitta/contracts/notes` is the single source of truth for
// validation (ADR-0017 belt-and-braces). The submit handler delegates to
// the `useCreateNote` TanStack Query mutation; on success we push a toast
// from the Zustand queue and navigate to the new note's detail page.
//
// We deliberately avoid per-route auth checks — the `_authenticated`
// parent's `beforeLoad` is the single gate (AGENTS.md rule 10).
// =============================================================================

import { CreateNoteSchema } from '@rhitta/contracts/notes'
import { Button } from '@rhitta/design-system-web'
import { createZodForm, InputField, TextareaField } from '@rhitta/design-system-web/forms'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useCreateNote } from '../../../lib/queries/index.js'
import { useToastQueue } from '../../../lib/toasts/index.js'

export const Route = createFileRoute('/_authenticated/notes/new')({
  component: NewNotePage,
})

const useNoteForm = createZodForm(CreateNoteSchema)

function NewNotePage() {
  const navigate = useNavigate()
  const create = useCreateNote()
  const push = useToastQueue((state) => state.push)
  const [error, setError] = useState<string | null>(null)

  const form = useNoteForm({
    defaultValues: { title: '', body: '' },
    onSubmit: async ({ value }) => {
      setError(null)
      try {
        const note = await create.mutateAsync(value)
        push({ title: 'Note created', variant: 'success' })
        void navigate({ to: '/notes/$noteId', params: { noteId: note.id } })
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to create note')
      }
    },
  })

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold text-text-body">New note</h1>

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
        <form.Field name="title">
          {(field) => <InputField field={field} label="Title" placeholder="Untitled" />}
        </form.Field>
        <form.Field name="body">
          {(field) => <TextareaField field={field} label="Body" rows={8} />}
        </form.Field>
        <div className="flex gap-3">
          <Button type="submit" disabled={form.state.isSubmitting}>
            {form.state.isSubmitting ? 'Saving…' : 'Save'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => void navigate({ to: '/notes' })}>
            Cancel
          </Button>
        </div>
      </form>
    </section>
  )
}
