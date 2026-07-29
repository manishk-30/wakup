const { withXcodeProject } = require('@expo/config-plugins');
const path = require('path');

module.exports = function withAlarmKitNative(config) {
  return withXcodeProject(config, async (config) => {
    const xcodeProject = config.modResults;
    const projectName = config.modRequest.projectName;
    
    // Files to add
    const files = [
      'AlarmKitModule.swift',
      'StartChallengeIntent.swift',
      'StopAlarmIntent.swift'
    ];
    
    // Create or find group in Xcode project
    const groupName = 'AlarmKit';
    let groupKey = xcodeProject.findPBXGroupKey({ name: groupName });
    if (!groupKey) {
      const mainGroupKey = xcodeProject.findPBXGroupKey({ name: projectName });
      // The group path is just the name, files will handle their own relative paths
      groupKey = xcodeProject.addPbxGroup([], groupName, groupName).uuid;
      if (mainGroupKey) {
        xcodeProject.addToPbxGroup(groupKey, mainGroupKey);
      }
    }
    
    const targetUuid = xcodeProject.findTargetKey(projectName);
    
    files.forEach(file => {
      // Relative path from ios/Wakup.xcodeproj to modules/alarm-kit/ios/
      const filePath = path.join('..', 'modules', 'alarm-kit', 'ios', file);
      
      // Add the source file directly from the modules directory
      if (!xcodeProject.hasFile(filePath)) {
        xcodeProject.addSourceFile(filePath, { target: targetUuid }, groupKey);
      }
    });
    
    return config;
  });
};
