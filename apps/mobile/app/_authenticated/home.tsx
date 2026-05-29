// =============================================================================
// /home — post-login home screen.
// =============================================================================
//
// Authenticated landing page. Links to Notes and Agent features.
// =============================================================================

import { Link } from 'expo-router'
import { Text, View } from 'react-native'

export default function HomePage() {
  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 24, fontWeight: '600', marginBottom: 24 }}>Home</Text>
      <Link href="/notes">Notes</Link>
      <Link href="/agent" style={{ marginTop: 12 }}>
        Agent
      </Link>
    </View>
  )
}
