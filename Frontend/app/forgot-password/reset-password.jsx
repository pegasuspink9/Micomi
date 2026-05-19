import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { gameScale, scaleWidth, scaleHeight } from '../Components/Responsiveness/gameResponsive';
import { authService } from '../services/authService';

export default function ResetPassword() {
  const { token } = useLocalSearchParams();
  const router = useRouter();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tokenValue = Array.isArray(token) ? token[0] : token;

  const handleResetPassword = async () => {
    if (!tokenValue) {
      setErrorMessage('Missing reset token. Please use the link from your email.');
      return;
    }

    if (!newPassword || !confirmPassword) {
      setErrorMessage('Please enter and confirm your new password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const response = await authService.resetPassword(tokenValue.trim(), newPassword);
      Alert.alert(
        'Password Reset',
        response?.message || 'Password has been successfully reset. You can now login.',
        [{ text: 'OK', onPress: () => router.replace('/') }]
      );
    } catch (error) {
      Alert.alert('Reset Failed', error?.message || 'Failed to reset password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>Enter a new password for your account.</Text>

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="New Password"
            placeholderTextColor="#6b7280"
            value={newPassword}
            onChangeText={(text) => {
              setNewPassword(text);
              setErrorMessage('');
            }}
            secureTextEntry
          />
        </View>

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Confirm New Password"
            placeholderTextColor="#6b7280"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              setErrorMessage('');
            }}
            secureTextEntry
          />
        </View>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        <TouchableOpacity
          style={[styles.button, isSubmitting && styles.buttonDisabled]}
          onPress={handleResetPassword}
          disabled={isSubmitting}
        >
          <Text style={styles.buttonText}>{isSubmitting ? 'Resetting...' : 'Reset Password'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(24),
    backgroundColor: '#0b1220'
  },
  card: {
    width: '100%',
    backgroundColor: '#111827',
    borderRadius: gameScale(16),
    padding: scaleWidth(24),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6
  },
  title: {
    fontSize: gameScale(24),
    color: '#FFFFFF',
    fontFamily: 'Grobold',
    marginBottom: scaleHeight(6)
  },
  subtitle: {
    fontSize: gameScale(12),
    color: '#9CA3AF',
    fontFamily: 'DynaPuff',
    marginBottom: scaleHeight(18)
  },
  inputWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: gameScale(12),
    marginBottom: scaleHeight(14),
    paddingHorizontal: scaleWidth(14),
    height: scaleHeight(50),
    justifyContent: 'center'
  },
  input: {
    color: '#111827',
    fontSize: gameScale(14),
    fontFamily: 'DynaPuff'
  },
  errorText: {
    color: '#EF4444',
    fontSize: gameScale(12),
    fontFamily: 'DynaPuff',
    marginBottom: scaleHeight(10)
  },
  button: {
    backgroundColor: '#3B82F6',
    height: scaleHeight(50),
    borderRadius: gameScale(12),
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonDisabled: {
    opacity: 0.7
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: gameScale(16),
    fontFamily: 'Grobold'
  }
});
