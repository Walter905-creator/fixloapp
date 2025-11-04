// This file mirrors `app.config.ts` to avoid Expo config conflicts.
export default {
  expo: {
    name: "Fixlo",
    slug: "fixloapp",
    version: "1.0.1",
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
      buildNumber: "7",
      infoPlist: {
        NSCameraUsageDescription: "Allow Fixlo to access your camera for profile photos.",
        NSPhotoLibraryUsageDescription: "Allow Fixlo to access your photo library for uploads.",
        NSLocationWhenInUseUsageDescription: "Allow Fixlo to use your location to show nearby services."
      }
    },

    android: {
      package: "com.fixloapp.mobile",
      versionCode: 7,
      adaptiveIcon: {
        foregroundImage: "./assets/icon.png",
        backgroundColor: "#ffffff"
      }
    },

    plugins: ["expo-notifications"],

    extra: {
      eas: {
        // keep projectId from the TypeScript config
        projectId: "8f3b81c3-891c-4c33-b655-b4c1d141a287"
      }
    }
  }
};
