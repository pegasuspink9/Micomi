# Google OAuth Setup Guide for Micomi

## Steps to Fix "Authorization Error"

### 1. Get Your Redirect URI
- Run your Expo app: `npm start`
- Open it in Expo Go
- Check the console logs - you'll see the redirect URI logged
- It will look like: `https://auth.expo.io/@yourusername/micomi/...`

### 2. Update Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Find your project: **Micomi App**
3. Navigate to **Credentials** → **OAuth 2.0 Client IDs**
4. Click on your **Web Client** (the one with ID: `459111764902-09uhkdrbfq1tv7gml6dbce3t05ka3jlj.apps.googleusercontent.com`)
5. Under **Authorized redirect URIs**, add:
   - The redirect URI you got from step 1
   - Example: `https://auth.expo.io/@yourusername/micomi/--/expo-auth-session/callback`
6. Click **Save**

### 3. Verify Configuration
- **clientId**: `459111764902-09uhkdrbfq1tv7gml6dbce3t05ka3jlj.apps.googleusercontent.com`
- **Redirect URL**: The one logged from your Expo console
- **useProxy**: Must be `true` for Expo Go to work

### 4. Test
- Close and reopen the app in Expo Go
- Try signing in with Google
- It should now work!

## Common Issues

| Issue | Solution |
|-------|----------|
| "Authorization Error" | Redirect URI not added to Google Cloud Console |
| "Invalid client" | Using wrong client ID or client type |
| "Invalid redirect_uri" | Exact URI doesn't match in Google Cloud Console (case-sensitive) |
| Works locally but not on device | The redirect URI changes per device - make sure you're using the logged URI |

## Notes
- The redirect URI changes if you change:
  - Your Expo username
  - Your app slug (in app.json)
  - Your project directory path
- Always use the URI logged in your console
- `useProxy: true` is required for Expo Go development
