// =============================================================================
// /auth/sign-up — email/password sign-up screen.
// =============================================================================
//
// Calls authClient.signUp.email(...) to create an account. On success
// redirects to /home. Displays inline error messages on failure.
// =============================================================================

import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Text, TextInput, TouchableOpacity, View } from 'react-native'
import { authClient } from '../../src/lib/auth/index.js'

export default function SignUpPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSignUp = async () => {
    setError(null)
    try {
      await authClient.signUp.email({ name, email, password })
      router.replace('/home')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign up failed')
    }
  }

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: '600', marginBottom: 24 }}>Sign up</Text>
      {error && <Text style={{ color: 'red', marginBottom: 12 }}>{error}</Text>}
      <TextInput
        placeholder="Name"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        style={{
          borderWidth: 1,
          borderColor: '#D1D5DB',
          borderRadius: 8,
          padding: 12,
          marginBottom: 12,
        }}
      />
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={{
          borderWidth: 1,
          borderColor: '#D1D5DB',
          borderRadius: 8,
          padding: 12,
          marginBottom: 12,
        }}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{
          borderWidth: 1,
          borderColor: '#D1D5DB',
          borderRadius: 8,
          padding: 12,
          marginBottom: 16,
        }}
      />
      <TouchableOpacity
        onPress={handleSignUp}
        style={{ backgroundColor: '#3B82F6', padding: 14, borderRadius: 8 }}
      >
        <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>Sign up</Text>
      </TouchableOpacity>
    </View>
  )
}
