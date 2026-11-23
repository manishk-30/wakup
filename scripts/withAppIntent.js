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
                    let hourVal: Int?
                    if let h = options["hour"] as? Int {
                        hourVal = h
                    } else if let h = options["hour"] as? Double {
                        hourVal = Int(h)
                    } else if let h = options["hour"] as? NSNumber {
                        hourVal = h.intValue
                    } else {
                        hourVal = nil
                    }

                    let minuteVal: Int?
                    if let m = options["minute"] as? Int {
                        minuteVal = m
                    } else if let m = options["minute"] as? Double {
                        minuteVal = Int(m)
                    } else if let m = options["minute"] as? NSNumber {
                        minuteVal = m.intValue
                    } else {
                        minuteVal = nil
                    }

                    guard let idString = options["id"] as? String,
                          let id = UUID(uuidString: idString),
                          let hour = hourVal,
                          let minute = minuteVal,
                          let label = options["label"] as? String else {
                        completion(false, nil, "Invalid arguments")
                        return
                    }
                    let repeatDays: [Int]
                    if let days = options["repeatDays"] as? [Int] {
                        repeatDays = days
                    } else if let days = options["repeatDays"] as? [Double] {
                        repeatDays = days.map { Int($0) }
                    } else if let days = options["repeatDays"] as? [NSNumber] {
                        repeatDays = days.map { $0.intValue }
                    } else {
                        repeatDays = []
                    }
                    let gameId = options["gameId"] as? String ?? "random"
                    let soundName = options["soundName"] as? String ?? "radar.wav"
                    let success = try await self.schedule(id: id, hour: hour, minute: minute, label: label, repeatDays: repeatDays, gameId: gameId, soundName: soundName)
                    completion(success, id.uuidString, nil)
                } catch {
                    let nsError = error as NSError
                    print("[AlarmKit-Diag] WakupScheduleAlarm caught: domain=\\(nsError.domain) code=\\(nsError.code) desc=\\(nsError.localizedDescription) userInfo=\\(nsError.userInfo)")
                    completion(false, nil, "[\\(nsError.domain) Code \\(nsError.code)] \\(nsError.localizedDescription) (userInfo: \\(nsError.userInfo))")
                }
            }
        }
        
        NotificationCenter.default.addObserver(forName: NSNotification.Name("WakupCancelAlarm"), object: nil, queue: nil) { [weak self] notification in
            guard let self = self,
                  let userInfo = notification.userInfo,
                  let completion = userInfo["completion"] as? (Bool) -> Void else { return }
                  
            guard let idString = userInfo["id"] as? String,
                  let id = UUID(uuidString: idString) else {
                completion(false)
                return
            }
            
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
    
    public func schedule(id: UUID, hour: Int, minute: Int, label: String, repeatDays: [Int], gameId: String, soundName: String) async throws -> Bool {
        // Diagnostic 1: Authorization state before calling requestAuthorization()
        let stateBefore = AlarmManager.shared.authorizationState
        print("[AlarmKit-Diag] 1. authorizationState BEFORE requestAuthorization(): \\(stateBefore)")

        // Diagnostic 2: State returned by requestAuthorization()
        let stateAfter = try await AlarmManager.shared.requestAuthorization()
        print("[AlarmKit-Diag] 2. authorizationState AFTER requestAuthorization(): \\(stateAfter)")

        guard stateAfter == .authorized else {
            print("[AlarmKit-Diag] FAILED at our own guard: stateAfter is not authorized (\\(stateAfter))")
            throw NSError(domain: "com.apple.AlarmKit.Alarm", code: 1, userInfo: [NSLocalizedDescriptionKey: "WakupGuard: Alarm permission is required. Current state: \\(stateAfter)"])
        }

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
        
        let gameNames: [String: String] = [
            "mines": "Play Minesweeper",
            "dragon-tower": "Play Tower Climb",
            "blackjack": "Play Sundoku",
            "lucky-race": "Play Lucky Race",
            "roulette": "Play Color Wheel",
            "dice": "Play Dice",
            "higher-lower": "Play Higher / Lower",
            "coin-flip": "Play Coin Flip",
            "card-guess": "Play Card Guess",
            "potion-mix": "Play Potion Mix",
            "random": "Start Challenge"
        ]
        let btnText = gameNames[gameId] ?? "Start Challenge"
        
        let titleResource = LocalizedStringResource(stringLiteral: label)
        let stopBtn = AlarmButton(text: "Stop", textColor: .white, systemImageName: "stop.circle")
        let gameBtn = AlarmButton(text: LocalizedStringResource(stringLiteral: btnText), textColor: .white, systemImageName: "gamecontroller.fill")
        
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
            tintColor: Color(red: 1.0, green: 176.0/255.0, blue: 0.0)
        )
        
        let cleanSoundName = soundName.replacingOccurrences(of: ".wav", with: "")
        
        let config = AlarmManager.AlarmConfiguration(
            schedule: schedule,
            attributes: attributes,
            stopIntent: StopAlarmIntent(alarmId: id.uuidString),
            secondaryIntent: StartChallengeIntent(alarmId: id.uuidString),
            sound: .named(cleanSoundName)
        )
        
        // Diagnostic 3: Whether execution reaches AlarmManager.shared.schedule()
        print("[AlarmKit-Diag] 3. Reached AlarmManager.shared.schedule(id: \\(id), configuration: ...)")

        do {
            _ = try await AlarmManager.shared.schedule(id: id, configuration: config)
            print("[AlarmKit-Diag] 3b. AlarmManager.shared.schedule SUCCEEDED!")
            return true
        } catch {
            // Diagnostic 4: If scheduling throws, capture NSError domain, code, localizedDescription and userInfo
            let nsError = error as NSError
            print("[AlarmKit-Diag] 4. AlarmManager.shared.schedule THREW:")
            print("[AlarmKit-Diag]    domain: \\(nsError.domain)")
            print("[AlarmKit-Diag]    code: \\(nsError.code)")
            print("[AlarmKit-Diag]    localizedDescription: \\(nsError.localizedDescription)")
            print("[AlarmKit-Diag]    userInfo: \\(nsError.userInfo)")
            throw error
        }
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
