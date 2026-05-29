// =============================================================================
// /notes/:noteId/edit — edit an existing note.
// =============================================================================
//
// Mirrors apps/web/src/routes/_authenticated/notes/$noteId/edit.tsx.
// Pre-populates the form with existing note data via `useNote(noteId)`,
// submits through `useUpdateNote()`. On success, push a toast and navigate
// back to the detail page.
//
// Why the inner `EditNoteForm` component?
// ---------------------------------------
// `useNoteForm` (the `createZodForm` factory's hook) needs the note's
// `title` / `body` as its `defaultValues`. Those values aren't available
// until `useNote` resolves. Calling `useNoteForm` after a conditional
// early-return would violate the Rules of Hooks. Splitting the form into
// a child component that only mounts once `note` is defined lets the
// child run its hooks unconditionally on first render.
// =============================================================================

import { type Note, UpdateNoteSchema } from '@rhitta/contracts/notes'
import { Button } from '@rhitta/design-system-mobile'
import { createZodForm, InputField, TextareaField } from '@rhitta/design-system-mobile/forms'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, ScrollView, Text, View } from 'react-native'
import { useNote, useUpdateNote } from '../../../../src/lib/queries/index.js'
import { useToastQueue } from '../../../../src/lib/toasts/index.js'

const useNoteForm = createZodForm(UpdateNoteSchema)

export default function EditNotePage() {
  const { noteId } = useLocalSearchParams<{ noteId: string }>()
  const { data: note, isPending, error } = useNote(noteId)

  if (isPending) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  if (error || !note) {
    return (
      <View style={{ flex: 1, padding: 16, justifyContent: 'center' }}>
        <Text style={{ color: '#EF4444', textAlign: 'center' }}>
          {error?.message ?? 'Note not found'}
        </Text>
      </View>
    )
  }

  return <EditNoteForm note={note} />
}

function EditNoteForm({ note }: { note: Note }) {
  const router = useRouter()
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
        router.push(`/notes/${note.id}`)
      } catch (e) {
        setSubmitError(e instanceof Error ? e.message : 'Failed to update note')
      }
    },
  })

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: '600' }}>Edit note</Text>

      {submitError && (
        <Text style={{ color: '#EF4444', fontSize: 14 }} role="alert">
          {submitError}
        </Text>
      )}

      <form.Field name="title">{(field) => <InputField field={field} label="Title" />}</form.Field>

      <form.Field name="body">
        {(field) => <TextareaField field={field} label="Body" numberOfLines={8} />}
      </form.Field>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Button onPress={() => form.handleSubmit()} disabled={form.state.isSubmitting}>
          {form.state.isSubmitting ? 'Saving…' : 'Save'}
        </Button>
        <Button variant="ghost" onPress={() => router.push(`/notes/${note.id}`)}>
          Cancel
        </Button>
      </View>
    </ScrollView>
  )
}
