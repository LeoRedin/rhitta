import { StyleSheet, Text, View } from 'react-native'

// Rhitta overlay: replaced Ignite demo screen with minimal welcome page.
export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rhitta Mobile</Text>
      <Text style={styles.subtitle}>Ready for development.</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F2F1',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#191015',
  },
  subtitle: {
    fontSize: 16,
    color: '#564E4A',
    marginTop: 8,
  },
})
