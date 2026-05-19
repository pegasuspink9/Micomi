import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  ImageBackground,
  Alert
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { gameScale, scaleWidth, scaleHeight, hp } from './Components/Responsiveness/gameResponsive';
import { useRouter } from 'expo-router';
import { useAuth } from './hooks/useAuth';
import { usePlayerProfile } from './hooks/usePlayerProfile';
import { authService } from './services/authService';
import * as WebBrowser from "expo-web-browser";
import SpriteActivityIndicator from './Components/Actual Game/Loading/SpriteActivityIndicator';

// Google & Facebook Auth Hooks
import { useGoogleAuth } from './auth/useGoogleAuth';
import { useFacebookAuth } from './auth/useFacebookAuth';

WebBrowser.maybeCompleteAuthSession();

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState(''); // Holds inline error
  const [isLoggingIn, setIsLoggingIn] = useState(false); // Controls button text

  const { login, loginWithGoogle, loginWithFacebook, user } = useAuth();
  const { checkIdentifierExists } = usePlayerProfile();
  const router = useRouter();

  const { gRequest, handleGoogleLogin } = useGoogleAuth(loginWithGoogle);
  const { fbRequest, handleFacebookLogin } = useFacebookAuth(loginWithFacebook);

  useEffect(() => {
    if (user) {
      router.replace('/map'); 
    }
  }, [user]);

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMessage('Please enter both email or username and password.');
      return;
    }

    setErrorMessage(''); // Clear previous error
    setIsLoggingIn(true); // Change button text to "Logging in"

    try {
      // 1. Check if email or username exists using playerService
      const identifierExists = await checkIdentifierExists(email);

      // 2. If identifier doesn't exist, display error and stop
      if (!identifierExists) {
        setErrorMessage('Incorrect Email or Username.');
        setIsLoggingIn(false);
        return;
      }
      // 3. Identifier exists! Attempt to log in with password
      await login(email, password);

    } catch (error) {
      // If network fails (e.g. localhost server is off)
      if (error.message === 'Network Error' || error.name === 'TypeError') {
        setErrorMessage('Network error. Is the server running?');
      } else {
        // 4. If login fails here, the identifier exists, so it MUST be an incorrect password
        setErrorMessage('Incorrect Password.');
      }
    } finally {
      setIsLoggingIn(false); // Revert button text to "Log In"
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setErrorMessage('Please enter your email.');
      return;
    }

    setErrorMessage('');
    try {
      const response = await authService.forgotPassword(email);
      Alert.alert('Forgot Password', response?.message || 'Request sent. Check your email.');
    } catch (error) {
      Alert.alert('Forgot Password', error?.message || 'Failed to send reset link.');
    }
  };

  return (
    <ImageBackground
      source={require('./loginBackground.jpg')}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent} 
            showsVerticalScrollIndicator={false}
          >
            {/* Header Section */}
            <View style={styles.headerContainer}>
              <Text style={styles.appTitle}>Micomi</Text>
              <Text style={styles.signInTitle}>Sign In</Text>
              <Text style={styles.tagline}>Log in and Fight with Micomi Now!</Text>
            </View>

            {/* Form Section */}
            <View style={styles.formContainer}>
              
              {/* Email Input */}
              <View style={[styles.inputWrapper, errorMessage.includes('Email') ? styles.inputErrorBorder : null]}>
                <TextInput
                  style={styles.input}
                  placeholder="Email or Username"
                  placeholderTextColor="#6b7280"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setErrorMessage(''); // Clear error when user types
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Password Input */}
              <View style={[styles.inputWrapper, errorMessage.includes('Password') ? styles.inputErrorBorder : null]}>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#6b7280"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setErrorMessage(''); // Clear error when user types
                  }}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity 
                  style={styles.eyeIcon} 
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons 
                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                    size={gameScale(20)} 
                    color="#6b7280" 
                  />
                </TouchableOpacity>
              </View>

              {/* Error Message Displayed Inline */}
              {errorMessage ? (
                <Text style={styles.errorText}>{errorMessage}</Text>
              ) : null}

              {/* Forgot Password */}
              <TouchableOpacity style={styles.forgotPassContainer} onPress={handleForgotPassword}>
                <Text style={styles.forgotPassText}>Forget Password?</Text>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.dividerContainer}>
                <View style={styles.line} />
                <Text style={styles.orText}>Or</Text>
                <View style={styles.line} />
              </View>

              {/* Social Login Buttons */}
              <View style={styles.socialRow}>
                {/* <TouchableOpacity 
                  style={[styles.socialButton, !fbRequest && { opacity: 0.5 }]} 
                  onPress={handleFacebookLogin}
                  disabled={!fbRequest}
                >
                  <FontAwesome5 name="facebook" size={gameScale(20)} color="#1877F2" />
                  <Text style={styles.socialText}>Facebook</Text>
                </TouchableOpacity> */}

                <TouchableOpacity 
                  style={[styles.socialButton, !gRequest && { opacity: 0.5 }]} 
                  onPress={handleGoogleLogin}
                  disabled={!gRequest}
                >
                  <ImageGoogleIcon />
                  <Text style={styles.socialText}>Google</Text>
                </TouchableOpacity>
              </View>

              {/* Login Button */}
              <TouchableOpacity 
                style={[styles.loginButton, isLoggingIn && { opacity: 0.7 }]} 
                onPress={handleLogin}
                disabled={isLoggingIn}
              >
                {isLoggingIn ? (
                  <View style={styles.loginButtonContent}>
                    <SpriteActivityIndicator size={gameScale(32)} />
                    <Text style={styles.loginButtonText}>Logging in</Text>
                  </View>
                ) : (
                  <Text style={styles.loginButtonText}>Log In</Text>
                )}
              </TouchableOpacity>

              {/* Footer */}
              <View style={styles.footerContainer}>
                <Text style={styles.footerText}>Don't have account? </Text>
                <TouchableOpacity onPress={() => router.push('./Components/Authentication/Signup')}>
                  <Text style={styles.signUpText}>Sign Up</Text>
                </TouchableOpacity>
              </View>

            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </ImageBackground>
  );
}

// Simple Google Icon Component
const ImageGoogleIcon = () => (
  <FontAwesome5 name="google" size={gameScale(20)} color="#DB4437" />
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(16, 16, 53, 0.44)',
    paddingTop: Platform.OS === 'ios' ? hp(5) : 0,
  },
  keyboardView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: scaleWidth(30),
    paddingBottom: scaleHeight(50),
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: scaleHeight(40),
    marginTop: scaleHeight(60),
  },
  appTitle: {
    fontSize: gameScale(48),
    fontFamily: 'Grobold',
    color: '#FFFFFF',
    marginBottom: scaleHeight(10),
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 4,
  },
  signInTitle: {
    fontSize: gameScale(32),
    fontFamily: 'Grobold',
    color: '#3B82F6',
    marginBottom: scaleHeight(10),
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2,
  },
  tagline: {
    fontSize: gameScale(14),
    color: '#9CA3AF',
    fontFamily: 'DynaPuff',
  },
  formContainer: { width: '100%' },
  inputWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: gameScale(12),
    marginBottom: scaleHeight(20),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(15),
    height: scaleHeight(55),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputErrorBorder: {
    borderColor: '#EF4444', 
    borderWidth: 1.5,
  },
  input: {
    flex: 1,
    height: '100%',
    color: '#1F2937',
    fontSize: gameScale(14),
    fontFamily: 'DynaPuff',
  },
  eyeIcon: { padding: scaleWidth(5) },
  
  // Custom Red Error Text
  errorText: {
    color: '#EF4444',
    fontSize: gameScale(13),
    fontFamily: 'DynaPuff',
    marginTop: scaleHeight(-12), 
    marginBottom: scaleHeight(10),
    marginLeft: scaleWidth(5),
  },

  forgotPassContainer: { alignSelf: 'flex-end', marginBottom: scaleHeight(30) },
  forgotPassText: {
    color: '#3B82F6',
    fontSize: gameScale(12),
    fontFamily: 'DynaPuff',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaleHeight(30),
  },
  line: { flex: 1, height: 1, backgroundColor: '#4B5563' },
  orText: {
    marginHorizontal: scaleWidth(15),
    color: '#9CA3AF',
    fontSize: gameScale(14),
    fontFamily: 'DynaPuff',
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scaleHeight(40)
  },
  socialButton: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    width: '100%',
    height: scaleHeight(50),
    borderRadius: gameScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: scaleWidth(10),
  },
  socialText: {
    fontSize: gameScale(14),
    color: '#374151',
    fontWeight: '600',
    fontFamily: 'DynaPuff',
  },
  loginButton: {
    backgroundColor: '#3B82F6',
    height: scaleHeight(55),
    borderRadius: gameScale(15),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scaleHeight(20),
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: gameScale(18),
    fontFamily: 'Grobold',
  },
  loginButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(8),
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: scaleHeight(10),
  },
  footerText: {
    color: '#FFFFFF',
    fontSize: gameScale(14),
    fontFamily: 'DynaPuff',
  },
  signUpText: {
    color: '#3B82F6',
    fontSize: gameScale(14),
    fontFamily: 'DynaPuff',
    marginLeft: scaleWidth(5),
  },
});