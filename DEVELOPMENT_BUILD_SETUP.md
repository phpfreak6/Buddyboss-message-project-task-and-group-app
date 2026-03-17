# Development Build Setup for Android with QR Code

This guide will help you set up a development build on your Android phone using QR code.

## Prerequisites
- Android phone connected via USB (with USB debugging enabled)
- OR you can build an APK and install it manually

## Method 1: Build and Install Development Client (Recommended)

### Step 1: Build the Development Client APK

You have two options:

#### Option A: Build Locally (Fastest)
```bash
# Build and install directly to connected device
npx expo run:android --device

# OR build APK only (without installing)
cd android && ./gradlew assembleDebug
# APK will be at: android/app/build/outputs/apk/debug/app-debug.apk
```

#### Option B: Build via EAS (Cloud Build)
```bash
# Install EAS CLI globally (if not already installed)
npm install -g eas-cli

# Login to Expo
eas login

# Build development client
eas build --profile development --platform android
```

After the build completes, download the APK from the EAS dashboard and install it on your phone.

### Step 2: Install the Development Client on Your Phone

- **If using Option A**: The app should already be installed
- **If using Option B**: Transfer the APK to your phone and install it
  - Enable "Install from Unknown Sources" in Android settings
  - Open the APK file and install

### Step 3: Start the Development Server with QR Code

```bash
# Start Expo dev server with development client
npx expo start --dev-client

# OR use the npm script
npm start -- --dev-client
```

This will:
- Start the Metro bundler
- Display a QR code in the terminal
- Show a URL you can use

### Step 4: Connect Your Phone

1. Make sure your phone and computer are on the same Wi-Fi network
2. Open the **Expo Go** app (if you have it) OR the **Development Client** app you just installed
3. Scan the QR code displayed in the terminal
4. The app will load on your phone

## Method 2: Using Expo Go (Simpler, but limited)

If you don't need custom native code, you can use Expo Go:

```bash
# Start Expo dev server
npm start

# Scan QR code with Expo Go app from Play Store
```

**Note**: Expo Go has limitations and may not work with all native modules in your project.

## Troubleshooting

### QR Code Not Working?
- Ensure phone and computer are on the same Wi-Fi network
- Try using the connection URL manually in the dev client
- Check firewall settings

### Development Client Not Loading?
- Make sure you built the development client (not just Expo Go)
- Verify `expo-dev-client` is in your dependencies (it is ✓)
- Try clearing the app cache and restarting

### Build Errors?
- Make sure Android SDK is properly configured
- Check that `ANDROID_HOME` environment variable is set
- Verify Java/JDK is installed

## Quick Commands Reference

```bash
# Build development client locally
npx expo run:android --device

# Start dev server with QR code
npm start -- --dev-client

# Or using expo directly
npx expo start --dev-client
```
