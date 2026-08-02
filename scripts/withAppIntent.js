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
import SwiftUI
import AppIntents

@available(iOS 26.0, *)
public var GlobalAlarmScheduler: WakupAlarmScheduler?

@available(iOS 26.0, *)
struct WakupAppMetadata: AlarmMetadata { }

@available(iOS 26.0, *)
@objc public class WakupAlarmScheduler: NSObject {
    // Force the Swift linker to retain the runtime type metadata for AppIntents
    // by explicitly referencing them in an existential type array.
    public static var retainedIntents: [any AppIntent.Type] = [
        StartChallengeIntent.self,
        StopAlarmIntent.self
    ]
    
    public override init() {
        super.init()
        
        NotificationCenter.default.addObserver(forName: NSNotification.Name("WakupRequestAuth"), object: nil, queue: nil) { [weak self] notification in
            guard let self = self,
                  let userInfo = notification.userInfo,
                  let completion = userInfo["completion"] as? (Bool) -> Void else { return }
            Task {
                do {
                    let success = try await self.requestAuthorization()
                    completion(success)
                } catch {
                    completion(false)
                }
            }
        }
        
        NotificationCenter.default.addObserver(forName: NSNotification.Name("WakupScheduleAlarm"), object: nil, queue: nil) { [weak self] notification in
            guard let self = self,
                  let userInfo = notification.userInfo,
                  let options = userInfo["options"] as? [String: Any],
                  let completion = userInfo["completion"] as? (Bool, String?, String?) -> Void else { return }
            Task {
                do {
                    guard let idString = options["id"] as? String,
                          let id = UUID(uuidString: idString),
                          let hour = options["hour"] as? Int,
                          let minute = options["minute"] as? Int,
                          let label = options["label"] as? String else {
                        completion(false, nil, "Invalid arguments")
                        return
                    }
                    let repeatDays = options["repeatDays"] as? [Int] ?? []
                    let soundName = options["soundName"] as? String ?? "alarm.wav"
                    let success = try await self.schedule(id: id, hour: hour, minute: minute, label: label, repeatDays: repeatDays, soundName: soundName)
                    completion(success, id.uuidString, nil)
                } catch {
                    completion(false, nil, error.localizedDescription)
                }
            }
        }
        
        NotificationCenter.default.addObserver(forName: NSNotification.Name("WakupCancelAlarm"), object: nil, queue: nil) { [weak self] notification in
            guard let self = self,
                  let userInfo = notification.userInfo,
                  let idString = userInfo["id"] as? String,
                  let id = UUID(uuidString: idString),
                  let completion = userInfo["completion"] as? (Bool) -> Void else { return }
            Task {
                do {
                    try self.cancel(id: id)
                    completion(true)
                } catch {
                    completion(false)
                }
            }
        }
    }
    
    public func requestAuthorization() async throws -> Bool {
        let state = try await AlarmManager.shared.requestAuthorization()
        return state == .authorized
    }
    
    public func schedule(id: UUID, hour: Int, minute: Int, label: String, repeatDays: [Int], soundName: String) async throws -> Bool {
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
            sound: .named(soundName),
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

    // 2. Copy Intent files from alarm-kit module into the Wakup iOS target directory
    const moduleIosDir = path.join(projectRoot, 'modules', 'alarm-kit', 'ios');
    const startIntentPath = path.join(moduleIosDir, 'StartChallengeIntent.swift');
    const stopIntentPath = path.join(moduleIosDir, 'StopAlarmIntent.swift');
    
    if (fs.existsSync(startIntentPath)) {
        fs.copyFileSync(startIntentPath, path.join(wakupTargetDir, 'StartChallengeIntent.swift'));
    }
    
    if (fs.existsSync(stopIntentPath)) {
        fs.copyFileSync(stopIntentPath, path.join(wakupTargetDir, 'StopAlarmIntent.swift'));
    }

    // 3. Add files to the Wakup Xcode target directly
    const filesToAdd = [
      { relativePath: projectName + '/StartChallengeIntent.swift' },
      { relativePath: projectName + '/StopAlarmIntent.swift' },
      { relativePath: projectName + '/WakupAlarmScheduler.swift' }
    ];

    filesToAdd.forEach(file => {
      if (!xcodeProject.hasFile(file.relativePath)) {
        xcodeProject.addSourceFile(file.relativePath, { target: targetUuid, sourceTree: '"SOURCE_ROOT"' }, mainGroupKey);
      }
    });

    // Explicitly enable App Intents metadata generation deeply across all configurations
    // because xcodeProject.addBuildProperty only adds it to the project-level config, 
    // which Xcode/CocoaPods often overrides or ignores at the target level.
    const buildConfigs = xcodeProject.pbxXCBuildConfigurationSection();
    for (const uuid in buildConfigs) {
      const config = buildConfigs[uuid];
      if (typeof config === 'object' && config.buildSettings) {
        config.buildSettings['ENABLE_APP_INTENTS'] = 'YES';
      }
    }

    // 4. Inject GlobalAlarmScheduler assignment into AppDelegate
    const appDelegatePath = path.join(wakupTargetDir, 'AppDelegate.swift');
    if (fs.existsSync(appDelegatePath)) {
      let appDelegateContent = fs.readFileSync(appDelegatePath, 'utf8');
      
      if (!appDelegateContent.includes('GlobalAlarmScheduler')) {
        // Add initialization
        const target = 'override func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {';
        const target2 = 'override func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil) -> Bool {';
        const initCode = `\n    if #available(iOS 26.0, *) {\n        GlobalAlarmScheduler = WakupAlarmScheduler()\n    }\n`;
        
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
