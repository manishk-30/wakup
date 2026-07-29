const { withXcodeProject } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withAlarmKitNative(config) {
  return withXcodeProject(config, async (config) => {
    const xcodeProject = config.modResults;
    const projectRoot = config.modRequest.projectRoot;
    const projectName = config.modRequest.projectName;
    
    // Paths
    const sourceDir = path.join(projectRoot, 'modules', 'alarm-kit', 'ios');
    const targetDir = path.join(projectRoot, 'ios', projectName, 'AlarmKit');
    
    // Create target directory
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // Files to copy and add
    const files = [
      'AlarmKitModule.swift',
      'StartChallengeIntent.swift',
      'StopAlarmIntent.swift'
    ];
    
    // Copy files
    files.forEach(file => {
      const srcPath = path.join(sourceDir, file);
      const destPath = path.join(targetDir, file);
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
      }
    });
    
    // Add files to Xcode project
    const groupName = 'AlarmKit';
    
    // Check if group exists, if not create it
    let group = xcodeProject.pbxGroupByName(groupName);
    if (!group) {
      const projectGroup = xcodeProject.pbxGroupByName(projectName);
      const groupKey = xcodeProject.addPbxGroup([], groupName, groupName).uuid;
      if (projectGroup) {
        xcodeProject.addToPbxGroup(groupKey, projectGroup);
      }
    }
    
    // Add source files to the target
    const targetUuid = xcodeProject.findTargetKey(projectName);
    
    files.forEach(file => {
      const filePath = path.join(projectName, 'AlarmKit', file);
      // Ensure we don't add duplicates
      if (!xcodeProject.hasFile(filePath)) {
        xcodeProject.addSourceFile(filePath, { target: targetUuid }, groupName);
      }
    });
    
    return config;
  });
};
