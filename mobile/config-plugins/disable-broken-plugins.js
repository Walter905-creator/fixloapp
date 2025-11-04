// config-plugins/disable-broken-plugins.js
module.exports = function withDisableBrokenPlugins(config) {
  // remove expo-in-app-purchases from the auto-plugins list
  if (config._internal && Array.isArray(config._internal.plugins)) {
    config._internal.plugins = config._internal.plugins.filter(
      (p) => !String(p).includes("expo-in-app-purchases")
    );
  }
  return config;
};
