// =============================================================================
// /notes — list view with cursor pagination.
// =============================================================================
//
// Mirrors apps/web/src/routes/_authenticated/notes/index.tsx.
// Cursor is held in component state; pressing "Load more" triggers a fresh
// query with data.nextCursor. FlatList is the RN-native scroll surface.
// =============================================================================

import { useRouter } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native'
import { useNotes } from '../../../src/lib/queries/index.js'

export default function NotesListPage() {
  const router = useRouter()
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const { data, isPending, error } = useNotes({ cursor, limit: 20 })

  if (isPending) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  if (error) {
    return (
      <View style={{ flex: 1, padding: 16, justifyContent: 'center' }}>
        <Text style={{ color: '#EF4444', textAlign: 'center' }}>
          Failed to load notes: {error.message}
        </Text>
      </View>
    )
  }

  const notes = data?.items ?? []
  const hasMore = data?.nextCursor != null

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: '600' }}>Notes</Text>
        <TouchableOpacity onPress={() => router.push('/notes/new')}>
          <Text style={{ color: '#3B82F6', fontSize: 16, fontWeight: '500' }}>+ New</Text>
        </TouchableOpacity>
      </View>

      {notes.length === 0 && (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#6B7280' }}>No notes yet. Create one to get started.</Text>
        </View>
      )}

      {notes.length > 0 && (
        <FlatList
          data={notes}
          keyExtractor={(item: any) => item.id}
          renderItem={({ item }: { item: any }) => (
            <TouchableOpacity
              onPress={() => router.push(`/notes/${item.id}`)}
              style={{
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: '#E5E7EB',
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '500' }}>{item.title}</Text>
              <Text style={{ color: '#6B7280', marginTop: 4 }} numberOfLines={2}>
                {item.body}
              </Text>
              <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 4 }}>
                {new Date(item.updatedAt).toLocaleString()}
              </Text>
            </TouchableOpacity>
          )}
          ListFooterComponent={
            hasMore ? (
              <TouchableOpacity
                onPress={() => {
                  if (data?.nextCursor) {
                    setCursor(data.nextCursor)
                  }
                }}
                style={{
                  padding: 12,
                  alignItems: 'center',
                  marginTop: 8,
                }}
              >
                <Text style={{ color: '#3B82F6', fontSize: 14 }}>Load more</Text>
              </TouchableOpacity>
            ) : null
          }
        />
      )}
    </View>
  )
}
