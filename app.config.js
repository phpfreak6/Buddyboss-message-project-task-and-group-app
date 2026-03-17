import { config } from 'dotenv';

// Load the .env file
config({ path: '.env.development' });

export default {
  expo: {
    name: 'Octopus',
    slug: 'octopus',
    extra: {
      API_URL: process.env.NODE_BACKEND,
      "eas": {
        "projectId": "39de190d-76bf-4ecb-b5f7-790bab52a25e"
      }
    },
    ios: {
      bundleIdentifier: "com.octopusworkapp.applenew",
      buildNumber: "1.0.0",
    },
    android: {
      package: "com.octopusworkapp.applenew",
    },
    assetBundlePatterns: ["**/*"],
  },
};