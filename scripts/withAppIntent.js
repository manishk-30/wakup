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
public struct WakupAppIntents: AppIntentsPackage {
    public static var includedPackages: [any AppIntentsPackage.Type] {
        #if canImport(alarm_kit)
        return [AlarmKitAppIntentsPackage.self]
        #else
        return []
        #endif
    }
}
`;
}
    
    if (!config.modResults.contents.includes('WakupAppIntents.self')) {
      const target = 'override func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {';
      const replacement = target + `
    if #available(iOS 26.0, *) {
      let _ = WakupAppIntents.self
    }`;
      
      // Some Expo versions omit the '= nil' part
      const target2 = 'override func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil) -> Bool {';
      
      if (config.modResults.contents.includes(target)) {
          config.modResults.contents = config.modResults.contents.replace(target, replacement);
      } else if (config.modResults.contents.includes(target2)) {
          config.modResults.contents = config.modResults.contents.replace(target2, target2 + `\n    if #available(iOS 26.0, *) {\n      let _ = WakupAppIntents.self\n    }`);
      } else {
          // Fallback regex
          config.modResults.contents = config.modResults.contents.replace(
            /didFinishLaunchingWithOptions[\s\S]*?\{/,
            match => match + `\n    if #available(iOS 26.0, *) {\n      let _ = WakupAppIntents.self\n    }`
          );
      }
    }
    return config;
  });
};
