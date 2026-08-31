const { withXcodeProject, withInfoPlist } = require('@expo/config-plugins');

module.exports = function withIphoneOnly(config) {
  config = withXcodeProject(config, (config) => {
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

  config = withInfoPlist(config, (config) => {
    // Remove iPad interface orientations if they exist from previous non-clean builds
    if (config.modResults['UISupportedInterfaceOrientations~ipad']) {
      delete config.modResults['UISupportedInterfaceOrientations~ipad'];
    }
    
    // Force UIDeviceFamily to strictly contain only 1 (iPhone)
    config.modResults['UIDeviceFamily'] = [1];
    
    // Remove "audio" from UIBackgroundModes (Guideline 2.5.4)
    if (Array.isArray(config.modResults['UIBackgroundModes'])) {
      config.modResults['UIBackgroundModes'] = config.modResults['UIBackgroundModes'].filter(mode => mode !== 'audio');
      // If the array is empty after removing audio, delete the key entirely
      if (config.modResults['UIBackgroundModes'].length === 0) {
        delete config.modResults['UIBackgroundModes'];
      }
    }
    
    return config;
  });

  return config;
};
