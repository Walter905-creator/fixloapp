export default {
  expo: {
    name: "Fixlo",
    slug: "fixlo",
    scheme: "fixlo",
    owner: "fixloapp",
    version: "1.0.0",
    runtimeVersion: { policy: "sdkVersion" },
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: { image: "./assets/splash.png", resizeMode: "contain", backgroundColor: "#ffffff" },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.fixloapp.mobile",
      buildNumber: "5",
      infoPlist: {
        NSCameraUsageDescription: "Allow Fixlo to access your camera to take photos of your projects.",
        NSPhotoLibraryUsageDescription: "Allow Fixlo to access your photos to upload project images.",
        NSLocationWhenInUseUsageDescription: "Allow Fixlo to access your location to find nearby professionals."
      }
    },
    android: {
      package: "com.fixloapp.mobile",
      versionCode: 3,
      adaptiveIcon: { foregroundImage: "./assets/adaptive-icon.png", backgroundColor: "#ffffff" }
    },
    plugins: [
      "expo-notifications",
      [
        "expo-build-properties",
        {
          ios: { deploymentTarget: "15.1", useFrameworks: "static", flipper: false },
          android: { compileSdkVersion: 34, targetSdkVersion: 34, minSdkVersion: 24, kotlinVersion: "1.9.22" }
        }
      ]
    ],
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL,
      eas: { projectId: "e9a6436d-1383-45c9-bc7d-ee44e3228810" }
    }
  }
};
