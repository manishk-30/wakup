const { withAppDelegate } = require('@expo/config-plugins');

module.exports = function withAppIntent(config) {
  return withAppDelegate(config, (config) => {
    if (!config.modResults.contents.includes('WakupAppIntents')) {
      config.modResults.contents += `

import AppIntents
#if canImport(alarm_kit)
import alarm_kit
#endif

@available(iOS 26.0, *)
struct WakupAppIntents: AppIntentsPackage {
    static var includedPackages: [any AppIntentsPackage.Type] {
        #if canImport(alarm_kit)
        return [AlarmKitAppIntentsPackage.self]
        #else
        return []
        #endif
    }
}
`;
    }
    return config;
  });
};
