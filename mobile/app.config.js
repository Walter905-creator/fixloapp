/** @type {import('@expo/config').ExpoConfig} */
module.exports = {
  expo: {
    name: "Fixlo",
    slug: "mobile",
    owner: "fixloapp",
    scheme: "fixlo",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.fixlo.app",
      buildNumber: "1"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.fixlo.app",
      versionCode: 1
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL || "https://fixloapp.onrender.com",
      websiteUrl: "https://fixloapp.com",
      privacyPolicyUrl: "https://fixloapp.com/privacy",
      termsOfServiceUrl: "https://fixloapp.com/terms",
      stripePublishableKey: "pk_live_REPLACE",
      eas: {
        projectId: "c557b673-3e59-434b-a5e2-f6154d4fbfc8"
      }
    },
    plugins: [
      [
        "expo-notifications",
        {
          color: "#ffffff"
        }
      ]
    ]
  }
};
