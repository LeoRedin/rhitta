// =============================================================================
// /notes/new — create a new note.
// =============================================================================
//
// Mirrors apps/web/src/routes/_authenticated/notes/new.tsx.
// Form is wired via `createZodForm(CreateNoteSchema)` from the mobile
// design-system forms package. On success, push a toast and navigate to
// the new note's detail page.
// =============================================================================

import { CreateNoteSchema } from '@rhitta/contracts/notes'
import { Button } from '@rhitta/design-system-mobile'
import { createZodForm, InputField, TextareaField } from '@rhitta/design-system-mobile/forms'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { useCreateNote } from '../../../src/lib/queries/index.js'
import { useToastQueue } from '../../../src/lib/toasts/index.js'

const useNoteForm = createZodForm(CreateNoteSchema)

export default function NewNotePage() {
  const router = useRouter()
  const create = useCreateNote()
  const push = useToastQueue((state) => state.push)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useNoteForm({
    defaultValues: { title: '', body: '' },
    onSubmit: async ({ value }) => {
      setSubmitError(null)
      try {
        const note = await create.mutateAsync(value)
        push({ title: 'Note created', variant: 'success' })
        router.push(`/notes/${note.id}`)
      } catch (e) {
        setSubmitError(e instanceof Error ? e.message : 'Failed to create note')
      }
    },
  })

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: '600' }}>New note</Text>

      {submitError && (
        <Text style={{ color: '#EF4444', fontSize: 14 }} role="alert">
          {submitError}
        </Text>
      )}

      <form.Field name="title">
        {(field) => <InputField field={field} label="Title" placeholder="Untitled" />}
      </form.Field>

      <form.Field name="body">
        {(field) => <TextareaField field={field} label="Body" numberOfLines={8} />}
      </form.Field>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Button onPress={() => form.handleSubmit()} disabled={form.state.isSubmitting}>
          {form.state.isSubmitting ? 'Saving…' : 'Save'}
        </Button>
        <Button variant="ghost" onPress={() => router.push('/notes')}>
          Cancel
        </Button>
      </View>
    </ScrollView>
  )
}
