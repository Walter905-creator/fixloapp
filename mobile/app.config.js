// Consolidated Expo configuration - single source of truth
export default {
  expo: {
    name: "Fixlo",
    slug: "fixloapp",
    scheme: "fixloapp",
    owner: "fixloapp",
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
      buildNumber: "22",
      icon: "./assets/icon.png",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSCameraUsageDescription: "Allow Fixlo to access your camera for profile photos.",
        NSPhotoLibraryUsageDescription: "Allow Fixlo to access your photo library for uploads.",
        NSLocationWhenInUseUsageDescription: "Allow Fixlo to use your location to show nearby services."
      },
      entitlements: {
        "com.apple.developer.in-app-payments": ["merchant.com.fixloapp.mobile"]
      }
    },

    android: {
      package: "com.fixloapp.mobile",
      versionCode: 22,
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      }
    },

    web: {
      favicon: "./assets/icon.png"
    },

    plugins: ["expo-notifications"],

    extra: {
      eas: {
        projectId: "f13247bf-8aca-495f-9b71-e94d1cc480a5"
      }
    }
  }
};
