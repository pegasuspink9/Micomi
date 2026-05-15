import { useEffect } from 'react';
import * as Facebook from "expo-auth-session/providers/facebook";
import { OAUTH_CONFIG } from './oauthConfig';

export const useFacebookAuth = (onSuccess) => {
  const [fbRequest, fbResponse, fbPromptAsync] = Facebook.useAuthRequest({
    clientId: OAUTH_CONFIG.FACEBOOK.clientId,
  });

  useEffect(() => {
    if (fbResponse?.type === "success") {
      const { access_token } = fbResponse.params;
      console.log("✅ Facebook accessToken acquired, sending to backend...");
      if (onSuccess) {
        onSuccess(access_token);
      }
    }
  }, [fbResponse, onSuccess]);

  const handleFacebookLogin = () => {
    if (fbRequest) fbPromptAsync();
  };

  return {
    fbRequest,
    fbResponse,
    handleFacebookLogin,
  };
};
