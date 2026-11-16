const { withXcodeProject, withInfoPlist } = require('@expo/config-plugins');

module.exports = function withIphoneOnly(config) {
  config = withXcodeProject(config, (config) => {
    const xcodeProject = config.modResults;
    const buildConfigs = xcodeProject.pbxXCBuildConfigurationSection();
    
    // Support both iPhone (1) and iPad (2) across all build configurations
    for (const uuid in buildConfigs) {
      const buildConfig = buildConfigs[uuid];
      if (typeof buildConfig === 'object' && buildConfig.buildSettings) {
        buildConfig.buildSettings['TARGETED_DEVICE_FAMILY'] = '"1,2"';
      }
    }
    
    return config;
  });

  config = withInfoPlist(config, (config) => {
    // Preserve portrait orientations for iPad
    config.modResults['UISupportedInterfaceOrientations~ipad'] = [
      'UIInterfaceOrientationPortrait',
      'UIInterfaceOrientationPortraitUpsideDown',
    ];
    
    // Support both iPhone (1) and iPad (2)
    config.modResults['UIDeviceFamily'] = [1, 2];
    
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
