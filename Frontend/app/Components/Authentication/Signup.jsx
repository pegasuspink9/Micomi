import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { gameScale, scaleWidth, scaleHeight } from '../../Components/Responsiveness/gameResponsive';
import { useAuth } from '../../hooks/useAuth';
import { usePlayerProfile } from '../../hooks/usePlayerProfile';

export default function Signup() {
  const router = useRouter();
  const { signup } = useAuth();
  const { checkEmailExists } = usePlayerProfile();
  
  const [formData, setFormData] = useState({
    playerName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '' // Added confirm password field
  });
  
  const [errors, setErrors] = useState({}); // Tracks errors per field
  const [isSigningUp, setIsSigningUp] = useState(false); // Controls button state

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSignup = async () => {
    let newErrors = {};
    const { playerName, email, username, password, confirmPassword } = formData;

    // 1. Validation for empty fields
    if (!playerName.trim()) newErrors.playerName = 'Player Name is required.';
    if (!username.trim()) newErrors.username = 'Username is required.';
    
    // 2. Validation for Email (must be @gmail.com)
    if (!email.trim()) {
      newErrors.email = 'Email Address is required.';
    } else if (!email.toLowerCase().endsWith('@gmail.com')) {
      newErrors.email = 'Email must be a valid @gmail.com address.';
    }

    // 3. Validation for Password
    if (!password) {
      newErrors.password = 'Password is required.';
    }

    // 4. Validation for Confirm Password matching
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirm Password is required.';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    // If there are errors, set them and stop execution
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const emailExists = await checkEmailExists(email);

      if (emailExists) {
        setErrors({ email: 'Email already existed.' });
        return;
      }
    } catch (error) {
      setErrors({ general: error.message || 'Failed to validate email. Please try again.' });
      return;
    }

    setIsSigningUp(true);
    try {
      await signup({
        player_name: playerName,
        email,
        username,
        password
      });
    } catch (error) {
      // Catch backend errors (e.g., email already exists)
      setErrors({ general: error.message || 'Signup failed. Please try again.' });
    } finally {
      setIsSigningUp(false);
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear the specific error when the user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: '' }));
    }
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
            
            {/* General Error Message (e.g., Email already exists) */}
            {errors.general ? (
              <Text style={[styles.errorText, { textAlign: 'center', marginBottom: 10 }]}>
                {errors.general}
              </Text>
            ) : null}

            {/* Player Name */}
            <View style={styles.inputGroup}>
              <View style={[styles.inputWrapper, errors.playerName && styles.inputErrorBorder]}>
                <TextInput
                  style={styles.input}
                  placeholder="Leon Avila"
                  placeholderTextColor="#6b7280"
                  value={formData.playerName}
                  onChangeText={(val) => updateField('playerName', val)}
                />
              </View>
              {errors.playerName ? (
                <Text style={styles.errorText}>{errors.playerName}</Text>
              ) : (
                <Text style={styles.labelBelow}>Player Name</Text>
              )}
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <View style={[styles.inputWrapper, errors.email && styles.inputErrorBorder]}>
                <TextInput
                  style={styles.input}
                  placeholder="alphainvent@gmail.com"
                  placeholderTextColor="#6b7280"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={formData.email}
                  onChangeText={(val) => updateField('email', val)}
                />
              </View>
              {errors.email ? (
                <Text style={styles.errorText}>{errors.email}</Text>
              ) : (
                <Text style={styles.labelBelow}>Email Address</Text>
              )}
            </View>

            {/* Username */}
            <View style={styles.inputGroup}>
              <View style={[styles.inputWrapper, errors.username && styles.inputErrorBorder]}>
                <TextInput
                  style={styles.input}
                  placeholder="micomi_warrior"
                  placeholderTextColor="#6b7280"
                  autoCapitalize="none"
                  value={formData.username}
                  onChangeText={(val) => updateField('username', val)}
                />
              </View>
              {errors.username ? (
                <Text style={styles.errorText}>{errors.username}</Text>
              ) : (
                <Text style={styles.labelBelow}>Username</Text>
              )}
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <View style={[styles.inputWrapper, errors.password && styles.inputErrorBorder]}>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#6b7280"
                  secureTextEntry={!showPassword}
                  value={formData.password}
                  onChangeText={(val) => updateField('password', val)}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>
              {errors.password ? (
                <Text style={styles.errorText}>{errors.password}</Text>
              ) : (
                <Text style={styles.labelBelow}>Password</Text>
              )}
            </View>

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <View style={[styles.inputWrapper, errors.confirmPassword && styles.inputErrorBorder]}>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#6b7280"
                  secureTextEntry={!showConfirmPassword}
                  value={formData.confirmPassword}
                  onChangeText={(val) => updateField('confirmPassword', val)}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword ? (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              ) : (
                <Text style={styles.labelBelow}>Confirm Password</Text>
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity 
              style={[styles.loginButton, isSigningUp && { opacity: 0.7 }]} 
              onPress={handleSignup}
              disabled={isSigningUp}
            >
              <Text style={styles.loginButtonText}>
                {isSigningUp ? "Signing up" : "Sign Up"}
              </Text>
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
  inputErrorBorder: {
    borderColor: '#EF4444', 
    borderWidth: 1.5,
  },
  input: { flex: 1, color: '#1F2937', fontSize: gameScale(14), fontFamily: 'DynaPuff' },
  labelBelow: {
    color: '#9CA3AF',
    fontSize: gameScale(11),
    fontFamily: 'DynaPuff',
    marginTop: 4,
    marginLeft: 10,
  },
  errorText: {
    color: '#EF4444', // Red error color
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