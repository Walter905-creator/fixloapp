// This file mirrors `app.config.ts` to avoid Expo config conflicts.
export default {
  expo: {
    name: "Fixlo",
    slug: "fixloapp",
    version: "1.0.2",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",

    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },

    assetBundlePatterns: ["**/*"],

    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.fixloapp.mobile",
      buildNumber: "21",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSCameraUsageDescription: "Allow Fixlo to access your camera for profile photos.",
        NSPhotoLibraryUsageDescription: "Allow Fixlo to access your photo library for uploads.",
        NSLocationWhenInUseUsageDescription: "Allow Fixlo to use your location to show nearby services."
      }
    },

    android: {
      package: "com.fixloapp.mobile",
      versionCode: 21,
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      }
    },

    plugins: ["expo-notifications"],

    extra: {
      eas: {
        projectId: "f13247bf-8aca-495f-9b71-e94d1cc480a5"
      }
    }
  }
};
