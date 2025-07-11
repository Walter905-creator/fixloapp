export default {
  expo: {
    name: "Fixlo",
    slug: "fixlo-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#3b82f6"
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
        backgroundColor: "#3b82f6"
      },
      package: "com.fixlo.app",
      versionCode: 1
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL || "https://fixlo-backend.onrender.com",
      websiteUrl: "https://fixloapp.com",
      privacyPolicyUrl: "https://fixloapp.com/privacy",
      termsOfServiceUrl: "https://fixloapp.com/terms",
      eas: {
        projectId: "your-project-id-here" // Will be set when running eas init
      }
    },
    plugins: [
      [
        "expo-notifications",
        {
          icon: "./assets/notification-icon.png",
          color: "#ffffff",
          sounds: ["./assets/notification-sound.wav"]
        }
      ]
    ]
  }
};
