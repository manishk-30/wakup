const { withXcodeProject } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withAlarmAudio(config) {
  return withXcodeProject(config, async (config) => {
    const xcodeProject = config.modResults;
    const projectPath = config.modRequest.projectRoot;
    
    const soundsDir = path.join(projectPath, 'assets', 'sounds');
    const iosRootPath = config.modRequest.platformProjectRoot;
    const iosWakupPath = path.join(config.modRequest.platformProjectRoot, config.name);
    
    // Ensure destination directories exist
    if (!fs.existsSync(iosWakupPath)) {
      fs.mkdirSync(iosWakupPath, { recursive: true });
    }
    
    // Scan the sounds directory and bundle all .wav files
    if (fs.existsSync(soundsDir)) {
      const files = fs.readdirSync(soundsDir);
      const wavFiles = files.filter(f => f.endsWith('.wav'));
      
      if (wavFiles.length === 0) {
        console.warn("WARNING: No .wav files found in assets/sounds/!");
      }
      
      for (const file of wavFiles) {
        const sourcePath = path.join(soundsDir, file);
        
        // FAILSAFE: Xcode's path resolution through node-xcode is buggy. 
        // We will copy the audio files to BOTH locations it might look for them.
        fs.copyFileSync(sourcePath, path.join(iosRootPath, file));
        fs.copyFileSync(sourcePath, path.join(iosWakupPath, file));
        
        // Add the file to the Xcode project so it gets bundled
        if (!xcodeProject.hasFile(file)) {
          // Fix for newer Expo versions where the 'Resources' group might not exist by default.
          // We set its path to config.name (Wakup) so Xcode knows the files are in ios/Wakup/
          if (!xcodeProject.pbxGroupByName('Resources')) {
            xcodeProject.addPbxGroup([], 'Resources', config.name);
          }
          xcodeProject.addResourceFile(file, { target: xcodeProject.getFirstTarget().uuid });
        }
      }
    } else {
      console.warn("WARNING: assets/sounds/ directory not found! Please create it and add .wav alarm sounds.");
    }
    
    return config;
  });
};
