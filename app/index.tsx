import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Index() {
  const router = useRouter();

  const goToLogin = () => {
    // @ts-ignore
    router.push('/login');
  };

  return (
    <View style={styles.container}>
      {/* Background Pattern */}
      <View style={styles.backgroundPattern} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>💬</Text>
        </View>
        <Text style={styles.appName}>Mingle</Text>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <Text style={styles.title}>
          Welcome to{'\n'}
          <Text style={styles.highlight}>Mingle</Text>
        </Text>
        <Text style={styles.subtitle}>
          Where conversations turn into connections and moments become memories
        </Text>
        
        <View style={styles.features}>
          <View style={styles.featureRow}>
            <Text style={styles.feature}>👥 Connect with Friends</Text>
            <Text style={styles.feature}>📸 Share Your Story</Text>
          </View>
          <View style={styles.featureRow}>
            <Text style={styles.feature}>🌍 Discover Communities</Text>
            <Text style={styles.feature}>💝 Build Relationships</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.ctaButton}
          onPress={goToLogin}
        >
          <Text style={styles.ctaButtonText}>Join the Community</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Already part of our community?</Text>
        <TouchableOpacity onPress={goToLogin}>
          <Text style={styles.loginLink}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'linear-gradient(135deg, #f0f4ff 0%, #fdf2f8 50%, #f0fdf4 100%)',
    opacity: 0.6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 6,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#1e293b',
    lineHeight: 50,
    marginBottom: 16,
    textAlign: 'center',
  },
  highlight: {
    color: '#8b5cf6',
  },
  subtitle: {
    fontSize: 18,
    color: '#64748b',
    lineHeight: 26,
    marginBottom: 40,
    textAlign: 'center',
  },
  features: {
    marginBottom: 40,
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  feature: {
    fontSize: 16,
    color: '#475569',
    fontWeight: '500',
  },
  ctaButton: {
    backgroundColor: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  ctaButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    paddingBottom: 40,
    alignItems: 'center',
  },
  footerText: {
    color: '#64748b',
    fontSize: 14,
    marginBottom: 8,
  },
  loginLink: {
    color: '#8b5cf6',
    fontSize: 16,
    fontWeight: 'bold',
  },
});