// =============================================================================
// /_authenticated/notes/:noteId/edit — edit an existing note.
// =============================================================================
//
// Sibling of `$noteId/index.tsx`. Uses the directory convention so the URL
// is `/notes/:noteId/edit` rather than `/notes/:noteId.edit`. The form is
// pre-populated with the existing note via `useNote(noteId)` and submits
// through `useUpdateNote()`, which hydrates the detail cache on success
// (Task 6 behaviour).
//
// Validation comes from `UpdateNoteSchema` via `createZodForm` — the
// contracts package is the single source of truth (ADR-0017).
//
// Why the inner `EditNoteForm` component?
// ---------------------------------------
// `useNoteForm` (the `createZodForm` factory's hook) needs the note's
// `title` / `body` as its `defaultValues`. Those values aren't available
// until `useNote` resolves. Calling `useNoteForm` after a conditional
// early-return would violate the Rules of Hooks. Splitting the form into
// a child component that only mounts once `note` is defined lets the
// child run its hooks unconditionally on first render — the standard
// React idiom for this load-then-render pattern.
// =============================================================================

import { type Note, UpdateNoteSchema } from '@rhitta/contracts/notes'
import { Button, Spinner } from '@rhitta/design-system-web'
import { createZodForm, InputField, TextareaField } from '@rhitta/design-system-web/forms'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useNote, useUpdateNote } from '../../../../lib/queries/index.js'
import { useToastQueue } from '../../../../lib/toasts/index.js'

export const Route = createFileRoute('/_authenticated/notes/$noteId/edit')({
  component: EditNotePage,
})

const useNoteForm = createZodForm(UpdateNoteSchema)

function EditNotePage() {
  const { noteId } = Route.useParams()
  const { data: note, isPending, error } = useNote(noteId)

  if (isPending) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !note) {
    return (
      <p className="text-sm text-text-danger" role="alert">
        {error?.message ?? 'Note not found'}
      </p>
    )
  }

  return <EditNoteForm note={note} />
}

function EditNoteForm({ note }: { note: Note }) {
  const navigate = useNavigate()
  const update = useUpdateNote()
  const push = useToastQueue((state) => state.push)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useNoteForm({
    defaultValues: { title: note.title, body: note.body },
    onSubmit: async ({ value }) => {
      setSubmitError(null)
      try {
        await update.mutateAsync({ id: note.id, ...value })
        push({ title: 'Note updated', variant: 'success' })
        void navigate({ to: '/notes/$noteId', params: { noteId: note.id } })
      } catch (e) {
        setSubmitError(e instanceof Error ? e.message : 'Failed to update note')
      }
    },
  })

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold text-text-body">Edit note</h1>

      {submitError && (
        <p className="text-sm text-text-danger" role="alert">
          {submitError}
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
          {(field) => <InputField field={field} label="Title" />}
        </form.Field>
        <form.Field name="body">
          {(field) => <TextareaField field={field} label="Body" rows={8} />}
        </form.Field>
        <div className="flex gap-3">
          <Button type="submit" disabled={form.state.isSubmitting}>
            {form.state.isSubmitting ? 'Saving…' : 'Save'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => void navigate({ to: '/notes/$noteId', params: { noteId: note.id } })}
          >
            Cancel
          </Button>
        </div>
      </form>
    </section>
  )
}
