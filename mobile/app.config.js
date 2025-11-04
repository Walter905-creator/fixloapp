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
      entitlements: {
        "com.apple.InAppPurchase": true
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

    // 🚫 Important: Skip loading the invalid expo-in-app-purchases plugin
    plugins: [
      "expo-notifications",
      [
        "expo-in-app-purchases",
        {
          _disabled: true
        }
      ]
    ],

    extra: {
      eas: {
        projectId: "8e7a9024-28f9-47f1-bed0-cb74077b66ae"
      }
    }
  }
};
