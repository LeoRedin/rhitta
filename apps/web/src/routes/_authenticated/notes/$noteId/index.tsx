// =============================================================================
// /_authenticated/notes/:noteId — note detail + delete confirmation dialog.
// =============================================================================
//
// The `$noteId/index.tsx` directory convention (rather than a flat
// `$noteId.tsx`) is required so the sibling `edit.tsx` collapses to the
// slash-separated URL `/notes/:noteId/edit` rather than the dot-separated
// `/notes/:noteId.edit`. Verified against TanStack Router 1.170.8.
//
// Data flow:
//   - `useNote(noteId)` fetches the detail (cache key from Task 6).
//   - `useDeleteNote()` is the delete mutation; on success we toast,
//     close the confirmation dialog, and navigate back to the list.
//
// The dialog is the Radix-based `Dialog` primitive from
// `@rhitta/design-system-web`. We control `open` so the dialog can be
// dismissed both via the close button and via successful mutation.
// =============================================================================

import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  Spinner,
} from '@rhitta/design-system-web'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useDeleteNote, useNote } from '../../../../lib/queries/index.js'
import { useToastQueue } from '../../../../lib/toasts/index.js'

export const Route = createFileRoute('/_authenticated/notes/$noteId/')({
  component: NoteDetailPage,
})

function NoteDetailPage() {
  const { noteId } = Route.useParams()
  const navigate = useNavigate()
  const { data: note, isPending, error } = useNote(noteId)
  const del = useDeleteNote()
  const push = useToastQueue((state) => state.push)
  const [confirmOpen, setConfirmOpen] = useState(false)

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

  const onDelete = async () => {
    await del.mutateAsync(note.id)
    push({ title: 'Note deleted', variant: 'success' })
    setConfirmOpen(false)
    void navigate({ to: '/notes' })
  }

  return (
    <article className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <h1 className="text-3xl font-semibold text-text-body">{note.title}</h1>
        <div className="flex gap-2">
          <Link
            to="/notes/$noteId/edit"
            params={{ noteId: note.id }}
            className="rounded-md border border-border-default bg-bg-surface px-3 py-1.5 text-sm text-text-body hover:bg-bg-surface-raised"
          >
            Edit
          </Link>
          <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <DialogTrigger asChild>
              <Button variant="danger" size="sm">
                Delete
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogTitle>Delete this note?</DialogTitle>
              <DialogDescription>
                The note will be soft-deleted. This cannot be undone from the UI.
              </DialogDescription>
              <div className="mt-4 flex justify-end gap-2">
                <DialogClose asChild>
                  <Button variant="ghost">Cancel</Button>
                </DialogClose>
                <Button variant="danger" onClick={onDelete} disabled={del.isPending}>
                  {del.isPending ? 'Deleting…' : 'Delete'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="whitespace-pre-wrap text-text-body">{note.body}</div>

      <p className="text-xs text-text-muted">
        Last updated {new Date(note.updatedAt).toLocaleString()}
      </p>
    </article>
  )
}
