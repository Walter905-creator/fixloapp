// Consolidated Expo configuration - single source of truth
// IMPORTANT: This project must always build under the "fixlo-app" account.
// This is the paid Expo account for iOS/Android builds to prevent free-plan quota exhaustion.
export default {
  expo: {
    name: "Fixlo",
    slug: "fixloapp",
    scheme: "fixloapp",
    owner: "fixlo-app",
    version: "1.0.2",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    description: "Fixlo - Connect with trusted home service professionals. Book, manage, and pay for services all in one place.",
    runtimeVersion: "1.0.2",

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
      },
      permissions: [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "NOTIFICATIONS",
        "VIBRATE",
        "INTERNET",
        "ACCESS_NETWORK_STATE"
      ]
    },

    web: {
      favicon: "./assets/icon.png"
    },

    plugins: [
      "expo-notifications",
      [
        "expo-build-properties",
        {
          "ios": {
            "useFrameworks": "static"
          }
        }
      ],
      [
        "expo-updates",
        {
          "username": "fixloapp"
        }
      ]
    ],

    extra: {
      eas: {
        projectId: "f13247bf-8aca-495f-9b71-e94d1cc480a5"
      }
    }
  }
};
