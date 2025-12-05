export default {
  expo: {
    owner: "fixlo-app",
    name: "Fixlo",
    slug: "fixloapp",
    version: "1.0.3",
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
      bundleIdentifier: "com.fixloapp.mobile",
      buildNumber: "31",
      supportsTablet: true,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false
      }
    },
    android: {
      package: "com.fixloapp.mobile",
      versionCode: 10,
      adaptiveIcon: {
        foregroundImage: "./assets/icon.png",
        backgroundColor: "#ffffff"
      },
      permissions: [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "CAMERA",
        "NOTIFICATIONS"
      ]
    },
    plugins: [
      "expo-notifications",
      "expo-secure-store",
      [
        "expo-build-properties",
        {
          ios: {
            useFrameworks: "static"
          },
          android: {
            enableProguardInReleaseBuilds: true
          }
        }
      ]
    ],
    extra: {
      eas: {
        projectId: "f13247bf-8aca-495f-9b71-e94d1cc480a5"
      },
      apiUrl: process.env.EXPO_PUBLIC_API_URL
    },
    updates: {
      enabled: true,
      fallbackToCacheTimeout: 0
    },
    runtimeVersion: {
      policy: "sdkVersion"
    }
  }
};
