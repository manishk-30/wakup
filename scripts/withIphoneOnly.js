const { withXcodeProject } = require('@expo/config-plugins');

module.exports = function withIphoneOnly(config) {
  return withXcodeProject(config, (config) => {
    const xcodeProject = config.modResults;
    const buildConfigs = xcodeProject.pbxXCBuildConfigurationSection();
    
    // Force TARGETED_DEVICE_FAMILY to 1 (iPhone only) across all build configurations
    for (const uuid in buildConfigs) {
      const buildConfig = buildConfigs[uuid];
      if (typeof buildConfig === 'object' && buildConfig.buildSettings) {
        buildConfig.buildSettings['TARGETED_DEVICE_FAMILY'] = '"1"';
      }
    }
    
    return config;
  });
};
