// =============================================================================
// /_authenticated/notes — list view with cursor pagination.
// =============================================================================
//
// The notes index sits behind `_authenticated/route.tsx`'s auth gate so we
// never check the session here (AGENTS.md rule 10 — single auth gate).
// Data fetching is mediated by the TanStack Query wrapper `useNotes` per
// ADR-0020; the page never reaches into the Encore client directly.
//
// Pagination is cursor-based — the API returns `{ items, nextCursor }` and
// we hold the current cursor in component state. Pressing "Load more"
// advances to `nextCursor`, which triggers a fresh query (distinct cache
// key per cursor value, as established by Task 6's `useNotes` test).
// =============================================================================

import { Card, Spinner } from '@rhitta/design-system-web'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useNotes } from '../../../lib/queries/index.js'

export const Route = createFileRoute('/_authenticated/notes/')({
  component: NotesListPage,
})

function NotesListPage() {
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const { data, isPending, error } = useNotes({ cursor, limit: 20 })

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-text-body">Notes</h1>
        <Link
          to="/notes/new"
          className="rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-text-inverse hover:opacity-90"
        >
          New note
        </Link>
      </div>

      {isPending && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {error && (
        <p className="text-sm text-text-danger" role="alert">
          Failed to load notes: {error.message}
        </p>
      )}

      {data && data.items.length === 0 && (
        <p className="text-text-muted">No notes yet. Create one to get started.</p>
      )}

      {data && data.items.length > 0 && (
        <ul className="flex flex-col gap-3">
          {data.items.map((note) => (
            <li key={note.id}>
              <Link to="/notes/$noteId" params={{ noteId: note.id }}>
                <Card className="transition-colors hover:bg-bg-surface-raised">
                  <h2 className="text-lg font-semibold text-text-body">{note.title}</h2>
                  <p className="mt-1 line-clamp-2 text-sm text-text-muted">{note.body}</p>
                  <p className="mt-2 text-xs text-text-muted">
                    {new Date(note.updatedAt).toLocaleString()}
                  </p>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {data?.nextCursor && (
        <button
          type="button"
          onClick={() => setCursor(data.nextCursor ?? undefined)}
          className="rounded-md border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-body hover:bg-bg-surface-raised"
        >
          Load more
        </button>
      )}
    </section>
  )
}
