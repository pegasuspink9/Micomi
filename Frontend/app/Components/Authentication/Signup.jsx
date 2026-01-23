import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  ActivityIndicator 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { gameScale, scaleWidth, scaleHeight } from '../../Components/Responsiveness/gameResponsive';
import { useAuth } from '../../hooks/useAuth';

export default function Signup() {
  const router = useRouter();
  const { signup, loading } = useAuth();
  
  const [formData, setFormData] = useState({
    playerName: '',
    email: '',
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleSignup = async () => {
    const { playerName, email, username, password } = formData;
    if (!playerName || !email || !username || !password) return;
    
    await signup({
      player_name: playerName,
      email,
      username,
      password
    });
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <LinearGradient
      colors={['#101035', '#1B1F68', '#4248B5']}
      style={styles.container}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.headerContainer}>
            <Text style={styles.appTitle}>Micomi</Text>
            <Text style={styles.signInTitle}>Create Account</Text>
            <Text style={styles.tagline}>Join the adventure today!</Text>
          </View>

          <View style={styles.formContainer}>
            {/* Player Name */}
            <View style={styles.inputGroup}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Leon Avila"
                  value={formData.playerName}
                  onChangeText={(val) => updateField('playerName', val)}
                />
              </View>
              <Text style={styles.labelBelow}>Player Name</Text>
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="email@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={formData.email}
                  onChangeText={(val) => updateField('email', val)}
                />
              </View>
              <Text style={styles.labelBelow}>Email Address</Text>
            </View>

            {/* Username */}
            <View style={styles.inputGroup}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="micomi_warrior"
                  autoCapitalize="none"
                  value={formData.username}
                  onChangeText={(val) => updateField('username', val)}
                />
              </View>
              <Text style={styles.labelBelow}>Username</Text>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  secureTextEntry={!showPassword}
                  value={formData.password}
                  onChangeText={(val) => updateField('password', val)}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>
              <Text style={styles.labelBelow}>Password</Text>
            </View>

            <TouchableOpacity 
              style={[styles.loginButton, loading && { opacity: 0.7 }]} 
              onPress={handleSignup}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.loginButtonText}>Sign Up</Text>}
            </TouchableOpacity>

            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.signUpText}>Log In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: scaleWidth(30),
    paddingBottom: scaleHeight(50),
  },
  headerContainer: { alignItems: 'center', marginBottom: scaleHeight(30), marginTop: scaleHeight(40) },
  appTitle: { fontSize: gameScale(48), fontFamily: 'Grobold', color: '#FFFFFF', marginBottom: 5 },
  signInTitle: { fontSize: gameScale(28), fontFamily: 'Grobold', color: '#3B82F6', marginBottom: 5 },
  tagline: { fontSize: gameScale(14), color: '#9CA3AF', fontFamily: 'DynaPuff' },
  formContainer: { width: '100%' },
  inputGroup: { marginBottom: scaleHeight(15) },
  inputWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: gameScale(12),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(15),
    height: scaleHeight(55),
    elevation: 3,
  },
  input: { flex: 1, color: '#1F2937', fontSize: gameScale(14), fontFamily: 'DynaPuff' },
  labelBelow: {
    color: '#9CA3AF',
    fontSize: gameScale(11),
    fontFamily: 'DynaPuff',
    marginTop: 4,
    marginLeft: 10,
  },
  loginButton: {
    backgroundColor: '#3B82F6',
    height: scaleHeight(55),
    borderRadius: gameScale(15),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: scaleHeight(20),
    elevation: 5,
  },
  loginButtonText: { color: '#FFFFFF', fontSize: gameScale(18), fontFamily: 'Grobold' },
  footerContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: scaleHeight(20) },
  footerText: { color: '#FFFFFF', fontSize: gameScale(14), fontFamily: 'DynaPuff' },
  signUpText: { color: '#3B82F6', fontSize: gameScale(14), fontFamily: 'DynaPuff', marginLeft: 5 },
});