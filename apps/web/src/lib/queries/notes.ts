// =============================================================================
// notes.ts — TanStack Query wrappers for the notes module.
// =============================================================================
//
// One hook per Encore endpoint at apps/api/src/modules/notes/http/*.ts.
// Components import from here; never call the Encore client directly.
//
// Cache strategy:
// - `useNotes(params)` keys on the full params object so different cursor
//   / limit / includeDeleted combos coexist. Mutations invalidate
//   `queryKeys.notes.all`, which matches every list variant.
// - `useNote(id)` keys on the id; the detail cache is set optimistically
//   on update success, then list keys are invalidated for re-sync.
// - `useDeleteNote` removes the detail entry before invalidating lists.
// =============================================================================

import type { CreateNote, ListNotesQuery, Note, UpdateNote } from '@rhitta/contracts/notes'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ListNotesResponse } from '../api-client/index.js'
import { getApiClient } from './client.js'
import { queryKeys } from './keys.js'

const DEFAULT_LIST_PARAMS: ListNotesQuery = {
  limit: 20,
  includeDeleted: false,
}

export function useNotes(params: Partial<ListNotesQuery> = {}) {
  const merged: ListNotesQuery = { ...DEFAULT_LIST_PARAMS, ...params }
  return useQuery<ListNotesResponse>({
    queryKey: queryKeys.notes.list(merged),
    queryFn: async () => {
      const client = getApiClient()
      return client.notes.list(merged)
    },
  })
}

export function useNote(id: string | undefined) {
  return useQuery<Note>({
    queryKey: id ? queryKeys.notes.detail(id) : ['notes', 'detail', 'disabled'],
    queryFn: async () => {
      if (!id) throw new Error('useNote called without id')
      const client = getApiClient()
      return client.notes.get(id)
    },
    enabled: id !== undefined,
  })
}

export function useCreateNote() {
  const qc = useQueryClient()
  return useMutation<Note, Error, CreateNote>({
    mutationFn: async (input: CreateNote): Promise<Note> => {
      const client = getApiClient()
      return client.notes.create(input)
    },
    onSuccess: () => {
      // Invalidate every notes list (any cursor / limit / includeDeleted combo).
      void qc.invalidateQueries({ queryKey: queryKeys.notes.all })
    },
  })
}

export function useUpdateNote() {
  const qc = useQueryClient()
  return useMutation<Note, Error, UpdateNote & { id: string }>({
    mutationFn: async (input: UpdateNote & { id: string }): Promise<Note> => {
      const client = getApiClient()
      return client.notes.update(input)
    },
    onSuccess: (note) => {
      // Hydrate the detail cache with the server-returned note, then
      // invalidate list variants so they re-fetch on next access.
      qc.setQueryData(queryKeys.notes.detail(note.id), note)
      void qc.invalidateQueries({ queryKey: queryKeys.notes.all })
    },
  })
}

export function useDeleteNote() {
  const qc = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: async (id: string): Promise<void> => {
      const client = getApiClient()
      await client.notes.delete(id)
    },
    onSuccess: (_, id) => {
      // Drop the dead detail entry; invalidate lists so the deleted note
      // disappears (or appears as soft-deleted if includeDeleted=true).
      qc.removeQueries({ queryKey: queryKeys.notes.detail(id) })
      void qc.invalidateQueries({ queryKey: queryKeys.notes.all })
    },
  })
}
