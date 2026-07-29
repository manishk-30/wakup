const { withXcodeProject } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

module.exports = function withAppIntent(config) {
  return withXcodeProject(config, async (config) => {
    const xcodeProject = config.modResults;
    const projectRoot = config.modRequest.projectRoot;
    const projectName = config.modRequest.projectName;
    
    const targetUuid = xcodeProject.findTargetKey(projectName);
    const mainGroupKey = xcodeProject.findPBXGroupKey({ name: projectName });

    // 1. Create WakupAlarmScheduler.swift in the iOS directory
    const wakupTargetDir = path.join(projectRoot, 'ios', projectName);
    if (!fs.existsSync(wakupTargetDir)) {
      fs.mkdirSync(wakupTargetDir, { recursive: true });
    }
    
    const schedulerCode = `import Foundation
import AlarmKit
import alarm_kit
import SwiftUI
import AppIntents

@available(iOS 26.0, *)
struct WakupAppMetadata: AlarmMetadata { }

@available(iOS 26.0, *)
@objc public class WakupAlarmScheduler: NSObject, AlarmSchedulerProtocol {
    public override init() {
        super.init()
    }
    
    public func requestAuthorization() async throws -> Bool {
        let state = try await AlarmManager.shared.requestAuthorization()
        return state == .authorized
    }
    
    public func schedule(id: UUID, hour: Int, minute: Int, label: String, repeatDays: [Int]) async throws -> Bool {
        let weekdays: [Locale.Weekday] = repeatDays.compactMap {
            switch $0 {
            case 0: return .sunday
            case 1: return .monday
            case 2: return .tuesday
            case 3: return .wednesday
            case 4: return .thursday
            case 5: return .friday
            case 6: return .saturday
            default: return nil
            }
        }
        
        let time = Alarm.Schedule.Relative.Time(hour: hour, minute: minute)
        let recurrence: Alarm.Schedule.Relative.Recurrence = weekdays.isEmpty ? .never : .weekly(weekdays)
        let schedule = Alarm.Schedule.relative(.init(time: time, repeats: recurrence))
        
        let titleResource = LocalizedStringResource(stringLiteral: label)
        let stopBtn = AlarmButton(text: "Stop", textColor: .white, systemImageName: "stop.circle")
        let gameBtn = AlarmButton(text: "Start Challenge", textColor: .white, systemImageName: "gamecontroller.fill")
        
        let alertContent = AlarmPresentation.Alert(
            title: titleResource,
            stopButton: stopBtn,
            secondaryButton: gameBtn,
            secondaryButtonBehavior: .custom
        )
        
        let presentation = AlarmPresentation(alert: alertContent)
        
        let attributes = AlarmAttributes(
            presentation: presentation,
            metadata: WakupAppMetadata(),
            tintColor: Color.blue
        )
        
        let config = AlarmManager.AlarmConfiguration(
            schedule: schedule,
            attributes: attributes,
            stopIntent: StopAlarmIntent(alarmId: id.uuidString),
            secondaryIntent: StartChallengeIntent(alarmId: id.uuidString)
        )
        
        _ = try await AlarmManager.shared.schedule(id: id, configuration: config)
        return true
    }
    
    public func cancel(id: UUID) throws {
        try AlarmManager.shared.cancel(id: id)
    }
}
`;
    const schedulerPath = path.join(wakupTargetDir, 'WakupAlarmScheduler.swift');
    fs.writeFileSync(schedulerPath, schedulerCode);

    // 2. Add files to the Wakup Xcode target directly
    const filesToAdd = [
      { name: 'StartChallengeIntent.swift', relativePath: path.join('..', 'modules', 'alarm-kit', 'ios', 'StartChallengeIntent.swift') },
      { name: 'StopAlarmIntent.swift', relativePath: path.join('..', 'modules', 'alarm-kit', 'ios', 'StopAlarmIntent.swift') },
      { name: 'WakupAlarmScheduler.swift', relativePath: path.join(projectName, 'WakupAlarmScheduler.swift') }
    ];

    filesToAdd.forEach(file => {
      if (!xcodeProject.hasFile(file.relativePath)) {
        xcodeProject.addSourceFile(file.relativePath, { target: targetUuid }, mainGroupKey);
      }
    });

    // 3. Inject GlobalAlarmScheduler assignment into AppDelegate
    const appDelegatePath = path.join(wakupTargetDir, 'AppDelegate.swift');
    if (fs.existsSync(appDelegatePath)) {
      let appDelegateContent = fs.readFileSync(appDelegatePath, 'utf8');
      
      if (!appDelegateContent.includes('AlarmKitModule.delegate')) {
        // Add import
        appDelegateContent = appDelegateContent.replace(
          /import UIKit/,
          "import UIKit\nimport alarm_kit"
        );
        
        // Add initialization
        const target = 'override func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {';
        const target2 = 'override func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil) -> Bool {';
        const initCode = `\n    if #available(iOS 26.0, *) {\n        alarm_kit.AlarmKitModule.delegate = WakupAlarmScheduler()\n    }\n`;
        
        if (appDelegateContent.includes(target)) {
          appDelegateContent = appDelegateContent.replace(target, target + initCode);
        } else if (appDelegateContent.includes(target2)) {
          appDelegateContent = appDelegateContent.replace(target2, target2 + initCode);
        } else {
          appDelegateContent = appDelegateContent.replace(
            /didFinishLaunchingWithOptions[\s\S]*?\{/,
            match => match + initCode
          );
        }
        fs.writeFileSync(appDelegatePath, appDelegateContent);
      }
    }

    return config;
  });
};
