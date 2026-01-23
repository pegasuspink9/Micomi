import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  Dimensions,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { gameScale, scaleWidth, scaleHeight, hp } from '../Components/Responsiveness/gameResponsive';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import * as Facebook from "expo-auth-session/providers/facebook";
import * as AuthSession from 'expo-auth-session'; 

WebBrowser.maybeCompleteAuthSession();

const { width } = Dimensions.get('window');

export default function Practice() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { login, loginWithGoogle, loginWithFacebook, loading, user } = useAuth();
  const router = useRouter();


  const googleRedirectUri = AuthSession.makeRedirectUri({
    useProxy: true, // THIS IS CRUCIAL! It tells Expo to generate a public https:// URI
  });

  console.log('Expo AuthSession Generated Redirect URI:', googleRedirectUri); // Log it to verify

   const [gRequest, gResponse, gPromptAsync] = Google.useAuthRequest({
    androidClientId: "459111764902-09uhkdrbfq1tv7gml6dbce3t05ka3jlj.apps.googleusercontent.com",
    iosClientId: "REPLACE_WITH_YOUR_IOS_CLIENT_ID.apps.googleusercontent.com",
    webClientId: "459111764902-09uhkdrbfq1tv7gml6dbce3t05ka3jlj.apps.googleusercontent.com",
    redirectUri: googleRedirectUri, // PASS THE GENERATED URI HERE
  });


  console.log('Google Auth Request Object (after custom redirectUri):', gRequest); 

  const [fbRequest, fbResponse, fbPromptAsync] = Facebook.useAuthRequest({
    clientId: "REPLACE_WITH_YOUR_FACEBOOK_APP_ID",
  });

  // Listen for Google response
  useEffect(() => {
    if (gResponse?.type === "success") {
      const { idToken } = gResponse.params;
      console.log("✅ Google idToken acquired, sending to backend...");
      loginWithGoogle(idToken);
    }
  }, [gResponse]);

    useEffect(() => {
    if (fbResponse?.type === "success") {
      const { access_token } = fbResponse.params;
      console.log("✅ Facebook accessToken acquired, sending to backend...");
      loginWithFacebook(access_token);
    }
  }, [fbResponse]);


  const handleLogin = async () => {
    if (!email || !password) {
        return;
    }
    await login(email, password);
  };

  const handleGoogleLogin = () => {
    if (gRequest) gPromptAsync();
  };

  const handleFacebookLogin = () => {
    if (fbRequest) fbPromptAsync();
  };


  return (
    <LinearGradient
      colors={['#101035', '#1B1F68', '#4248B5']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.container}
    >
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
            {/* Show different title if logged in */}
            <Text style={styles.signInTitle}>{user ? `Hi, ${user.player_name}` : 'Sign In'}</Text>
            <Text style={styles.tagline}>Log in and Fight with Micomi Now!</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formContainer}>
            
            {/* Email Input */}
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="alphainvent@gmail.com"
                placeholderTextColor="#6b7280"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#6b7280"
                value={password}
                onChangeText={setPassword}
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

            {/* Forgot Password */}
            <TouchableOpacity style={styles.forgotPassContainer} onPress={() => router.push('/ForgotPassword')}>
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
              <TouchableOpacity 
                style={[styles.socialButton, !fbRequest && { opacity: 0.5 }]} 
                onPress={handleFacebookLogin}
                disabled={!fbRequest}
              >
                <FontAwesome5 name="facebook" size={gameScale(20)} color="#1877F2" />
                <Text style={styles.socialText}>Facebook</Text>
              </TouchableOpacity>

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
                style={[styles.loginButton, loading && { opacity: 0.7 }]} 
                onPress={handleLogin}
                disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginButtonText}>Log In</Text>
              )}
            </TouchableOpacity>

            {/* Footer */}
            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>Don't have account? </Text>
              <TouchableOpacity onPress={() => router.push('../Components/Authentication/Signup')}>
                <Text style={styles.signUpText}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            {/* Debugging: Show Token data if successful */}
            {user && (
                <View style={{ marginTop: 20, padding: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 10 }}>
                    <Text style={{ color: 'white', fontFamily: 'DynaPuff' }}>
                        Logged in as ID: {user.player_id}
                    </Text>
                    <Text style={{ color: '#00ff00', fontFamily: 'DynaPuff', fontSize: 10 }}>
                         Access Token is active
                    </Text>
                </View>
            )}

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

// Simple Google Icon Component using text colors to simulate logo if no asset is available
const ImageGoogleIcon = () => (
  <FontAwesome5 name="google" size={gameScale(20)} color="#DB4437" />
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: scaleWidth(30),
    paddingBottom: scaleHeight(50),
  },
  
  // Header
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
    color: '#3B82F6', // Bright Blue
    marginBottom: scaleHeight(10),
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2,
  },
  tagline: {
    fontSize: gameScale(14),
    color: '#9CA3AF', // Gray-400
    fontFamily: 'DynaPuff', // Or system font if preferred
  },

  // Form
  formContainer: {
    width: '100%',
  },
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
  input: {
    flex: 1,
    height: '100%',
    color: '#1F2937',
    fontSize: gameScale(14),
    fontFamily: 'DynaPuff', // Using consistent font, remove if you want system font
  },
  eyeIcon: {
    padding: scaleWidth(5),
  },
  
  // Forgot Password
  forgotPassContainer: {
    alignSelf: 'flex-end',
    marginBottom: scaleHeight(30),
  },
  forgotPassText: {
    color: '#3B82F6',
    fontSize: gameScale(12),
    fontFamily: 'DynaPuff',
  },

  // Divider
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaleHeight(30),
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#4B5563', // Gray-600
  },
  orText: {
    marginHorizontal: scaleWidth(15),
    color: '#9CA3AF',
    fontSize: gameScale(14),
    fontFamily: 'DynaPuff',
  },

  // Social Buttons
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scaleHeight(40),
  },
  socialButton: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    width: '47%',
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

  // Login Button
  loginButton: {
    backgroundColor: '#3B82F6', // Bright Blue
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

  // Footer
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