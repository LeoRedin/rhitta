// =============================================================================
// keys.ts — Centralized TanStack Query key registry.
// =============================================================================
//
// Every query/mutation in `lib/queries/` reads its cache keys from this
// registry. Keeping keys in one file makes invalidation calls grep-able
// and prevents drift between query authors and invalidation authors
// (e.g., a mutation in `notes.ts` invalidating `['notes']` matches the
// list key built here because they share the same builder).
//
// Per ADR-0020, components consume the wrappers — not the keys — so this
// module is internal to `lib/queries/`. Tests import keys when they need
// to assert cache shape.
// =============================================================================

import type { ListNotesQuery } from '@rhitta/contracts/notes'

export const queryKeys = {
  notes: {
    all: ['notes'] as const,
    list: (params: ListNotesQuery) => [...queryKeys.notes.all, 'list', params] as const,
    detail: (id: string) => [...queryKeys.notes.all, 'detail', id] as const,
  },
  agentRuns: {
    all: ['agent-runs'] as const,
  },
} as const
