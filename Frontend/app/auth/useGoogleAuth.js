import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from "expo-auth-session/providers/google";
import * as AuthSession from 'expo-auth-session';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { OAUTH_CONFIG } from './oauthConfig';

// Utility to build the Expo Proxy Start URL
const buildExpoProxyStartUrl = (proxyRedirectUri, authUrl, returnUrl) => {
  try {
    const parsedProxyUrl = new URL(proxyRedirectUri);
    // This creates: https://auth.expo.io/@noelcantcode/micomi
    const proxyBaseUrl = `${parsedProxyUrl.origin}${parsedProxyUrl.pathname}`.replace(/\/$/, '');

    // Appends /start?authUrl=...&returnUrl=...
    return `${proxyBaseUrl}/start?authUrl=${encodeURIComponent(authUrl)}&returnUrl=${encodeURIComponent(returnUrl)}`;
  } catch {
    return authUrl;
  }
};

export const useGoogleAuth = (onSuccess) => {
  const [googleAuthLoading, setGoogleAuthLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const proxyRedirectUri = 'https://auth.expo.io/@noelcantcode/micomi';
  const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

  // 1. The URL Google will redirect to (Must exactly match Google Cloud Console)
  const googleRedirectUri = isExpoGo
    ? proxyRedirectUri
    : AuthSession.makeRedirectUri({ scheme: 'micomi' });

  // 2. The URL the proxy/native auth will redirect back to your app after success
  const authSessionReturnUrl = isExpoGo
    ? AuthSession.makeRedirectUri()
    : AuthSession.makeRedirectUri({ scheme: 'micomi' });

  useEffect(() => { }, []);

  // ⚠️ ADDED: responseType: "id_token" so Google gives us the JWT the backend wants!
  const [gRequest] = Google.useAuthRequest({
    clientId: OAUTH_CONFIG.GOOGLE.clientId,
    scopes: OAUTH_CONFIG.GOOGLE.scopes,
    redirectUri: googleRedirectUri,
    responseType: "id_token",
  });

  const handleGoogleLogin = async () => {
    setErrorMessage('');

    if (!gRequest) {
      const message = 'Google Sign-In is not ready yet. Please try again in a second.';
      setErrorMessage(message);
      Alert.alert('Google Sign-In', message);
      return;
    }

    try {
      setGoogleAuthLoading(true);

      const authUrl = gRequest?.url;
      const returnUrl = authSessionReturnUrl;

      const authSessionUrl = authUrl
        ? (isExpoGo
          ? buildExpoProxyStartUrl(proxyRedirectUri, authUrl, returnUrl)
          : authUrl)
        : undefined;

      if (!authSessionUrl) {
        throw new Error('Unable to build Google auth URL. Request URL is missing.');
      }

      const response = await WebBrowser.openAuthSessionAsync(authSessionUrl, returnUrl);

      if (!response || response.type !== 'success') {
        if (response?.type === 'dismiss') {
          setErrorMessage('Google sign-in session was dismissed. Please try again.');
        }
        return;
      }

      const returnedUrl = response.url || '';
      const queryString = returnedUrl.includes('?') ? returnedUrl.split('?')[1]?.split('#')[0] || '' : '';
      const hashString = returnedUrl.includes('#') ? returnedUrl.split('#')[1] || '' : '';
      const queryParams = new URLSearchParams(queryString);
      const hashParams = new URLSearchParams(hashString);

      const mergedParams = {};
      queryParams.forEach((value, key) => { mergedParams[key] = value; });
      hashParams.forEach((value, key) => { mergedParams[key] = value; });

      const idToken = mergedParams?.id_token;

      if (!idToken) {
        throw new Error(`Google ID token was not returned. Params received: ${Object.keys(mergedParams).join(', ')}`);
      }

      if (onSuccess) {
        await onSuccess(idToken);
      }

    } catch (error) {
      const message = error?.message || 'Google login failed. Please try again.';
      setErrorMessage(message);
      Alert.alert('Google Login Error', message);
    } finally {
      setGoogleAuthLoading(false);
    }
  };

  return {
    gRequest,
    googleAuthLoading,
    errorMessage,
    handleGoogleLogin,
    redirectUri: googleRedirectUri
  };
};