export default {
  expo: {
    name: "Fixlo",
  slug: "fixloapp",
  scheme: "fixloapp",
  owner: "fixloapp",
  version: "1.0.2",
    runtimeVersion: { policy: "sdkVersion" },
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: ["**/*"],
  // Keep plugins in the TypeScript config so there's a single source of truth
  plugins: ["expo-notifications"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.fixloapp.mobile",
  buildNumber: "9",
      infoPlist: {
        NSCameraUsageDescription: "Allow Fixlo to access your camera for profile photos.",
        NSPhotoLibraryUsageDescription: "Allow Fixlo to access your photo library for uploads.",
        NSLocationWhenInUseUsageDescription: "Allow Fixlo to use your location to show nearby services."
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.fixloapp.mobile",
  versionCode: 9
    },
    web: {
      favicon: "./assets/icon.png"
    },
    extra: {
      eas: { projectId: "8f3b81c3-891c-4c33-b655-b4c1d141a287" }
    }
  }
};
