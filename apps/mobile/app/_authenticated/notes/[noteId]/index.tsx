// =============================================================================
// /notes/:noteId — note detail + delete confirmation dialog.
// =============================================================================
//
// Mirrors apps/web/src/routes/_authenticated/notes/$noteId/index.tsx.
// Uses `useLocalSearchParams` (Expo Router) for the noteId param. The
// delete button opens the mobile Dialog primitive for confirmation; on
// success, push a toast and navigate back to the notes list.
// =============================================================================

import { Button, Dialog } from '@rhitta/design-system-mobile'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, ScrollView, Text, View } from 'react-native'
import { useDeleteNote, useNote } from '../../../../src/lib/queries/index.js'
import { useToastQueue } from '../../../../src/lib/toasts/index.js'

export default function NoteDetailPage() {
  const { noteId } = useLocalSearchParams<{ noteId: string }>()
  const router = useRouter()
  const { data: note, isPending, error } = useNote(noteId)
  const del = useDeleteNote()
  const push = useToastQueue((state) => state.push)
  const [confirmOpen, setConfirmOpen] = useState(false)

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

  const onDelete = async () => {
    await del.mutateAsync(note.id)
    push({ title: 'Note deleted', variant: 'success' })
    setConfirmOpen(false)
    router.push('/notes')
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: '600', flex: 1 }}>{note.title}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Button variant="outline" size="sm" onPress={() => router.push(`/notes/${note.id}/edit`)}>
            Edit
          </Button>
          <Button variant="danger" size="sm" onPress={() => setConfirmOpen(true)}>
            Delete
          </Button>
        </View>
      </View>

      <Text style={{ fontSize: 14, lineHeight: 20 }}>{note.body}</Text>

      <Text style={{ color: '#6B7280', fontSize: 12 }}>
        Last updated {new Date(note.updatedAt).toLocaleString()}
      </Text>

      <Dialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete this note?"
        description="The note will be soft-deleted. This cannot be undone from the UI."
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'flex-end',
            gap: 8,
            marginTop: 8,
          }}
        >
          <Button variant="ghost" size="sm" onPress={() => setConfirmOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onPress={onDelete} disabled={del.isPending}>
            {del.isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </View>
      </Dialog>
    </ScrollView>
  )
}
