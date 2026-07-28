const { withXcodeProject } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withAlarmAudio(config) {
  return withXcodeProject(config, async (config) => {
    const xcodeProject = config.modResults;
    const projectPath = config.modRequest.projectRoot;
    
    const soundsDir = path.join(projectPath, 'assets', 'sounds');
    const iosPath = path.join(config.modRequest.platformProjectRoot, config.name);
    
    // Ensure destination directory exists
    if (!fs.existsSync(iosPath)) {
      fs.mkdirSync(iosPath, { recursive: true });
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
        const destPath = path.join(iosPath, file);
        
        fs.copyFileSync(sourcePath, destPath);
        
        // Add the file to the Xcode project so it gets bundled
        if (!xcodeProject.hasFile(file)) {
          const group = xcodeProject.findPBXGroupKey({ name: 'Resources' });
          xcodeProject.addResourceFile(file, { target: xcodeProject.getFirstTarget().uuid });
        }
      }
    } else {
      console.warn("WARNING: assets/sounds/ directory not found! Please create it and add .wav alarm sounds.");
    }
    
    return config;
  });
};
