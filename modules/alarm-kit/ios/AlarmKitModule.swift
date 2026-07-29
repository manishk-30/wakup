import ExpoModulesCore
import AlarmKit
import AppIntents
import AVFoundation
import SwiftUI

@available(iOS 26.0, *)
struct AppMetadata: AlarmMetadata { }
@available(iOS 26.0, *)
public struct StartChallengeIntent: LiveActivityIntent {
    public static var title: LocalizedStringResource = "Start Challenge"
    public static var supportedModes: IntentModes {
        .foreground(.immediate)
    }
    
    @Parameter(title: "Alarm ID")
    public var alarmId: String
    
    public init() {
        self.alarmId = ""
    }
    
    public init(alarmId: String) {
        self.alarmId = alarmId
    }
    
    public func perform() async throws -> some IntentResult & OpensIntent {
        let url = URL(string: "wakup://alarm/ringing?alarmId=\(alarmId)")!
        return .result(opensIntent: OpenURLIntent(url))
    }
}

@available(iOS 26.0, *)
public struct StopAlarmIntent: LiveActivityIntent {
    public static var title: LocalizedStringResource = "Stop Alarm"
    
    @Parameter(title: "Alarm ID")
    public var alarmId: String
    
    public init() {
        self.alarmId = ""
    }
    
    public init(alarmId: String) {
        self.alarmId = alarmId
    }
    
    public func perform() async throws -> some IntentResult {
        // Stop is tapped natively. Save it so the app knows a challenge is pending when it resumes.
        UserDefaults.standard.set(alarmId, forKey: "PendingGameAlarmId")
        return .result()
    }
}

@available(iOS 26.0, *)
public struct AlarmKitAppIntentsPackage: AppIntentsPackage {
    public static var intentClasses: [any AppIntent.Type] {
        return [StartChallengeIntent.self, StopAlarmIntent.self]
    }
}

public class AlarmKitModule: Module {
  public func definition() -> ModuleDefinition {
    Name("AlarmKit")

    AsyncFunction("requestAuthorization") { (promise: Promise) in
      if #available(iOS 26.0, *) {
        Task {
          do {
              let state = try await AlarmManager.shared.requestAuthorization()
              promise.resolve(state == .authorized)
          } catch {
              promise.resolve(false)
          }
        }
      } else {
        promise.resolve(false)
      }
    }

    AsyncFunction("configureAudioSession") { (promise: Promise) in
      do {
        try AVAudioSession.sharedInstance().setCategory(.playback, options: [.duckOthers])
        try AVAudioSession.sharedInstance().setActive(true)
        promise.resolve(true)
      } catch {
        promise.resolve(["success": false, "error": error.localizedDescription])
      }
    }

    AsyncFunction("scheduleAlarm") { (options: [String: Any], promise: Promise) in
      if #available(iOS 26.0, *) {
        Task {
          guard let idString = options["id"] as? String,
                let id = UUID(uuidString: idString),
                let hour = options["hour"] as? Int,
                let minute = options["minute"] as? Int,
                let label = options["label"] as? String else {
            promise.resolve(["success": false, "error": "Invalid arguments"])
            return
          }
          
          let repeatDays = options["repeatDays"] as? [Int] ?? []
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
              metadata: AppMetadata(),
              tintColor: Color.blue
          )
          
          let config = AlarmManager.AlarmConfiguration(
              schedule: schedule,
              attributes: attributes,
              stopIntent: StopAlarmIntent(alarmId: idString),
              secondaryIntent: StartChallengeIntent(alarmId: idString)
          )
          
          do {
              _ = try await AlarmManager.shared.schedule(id: id, configuration: config)
              promise.resolve(["success": true, "alarmId": id.uuidString])
          } catch {
              promise.resolve(["success": false, "error": error.localizedDescription])
          }
        }
      } else {
        promise.resolve(["success": false, "error": "AlarmKit requires iOS 26.0"])
      }
    }

    AsyncFunction("cancelAlarm") { (idString: String, promise: Promise) in
      if #available(iOS 26.0, *) {
        Task {
          guard let id = UUID(uuidString: idString) else {
              promise.resolve(false)
              return
          }
          do {
              try AlarmManager.shared.cancel(id: id)
              promise.resolve(true)
          } catch {
              promise.resolve(false)
          }
        }
      } else {
        promise.resolve(false)
      }
    }

    AsyncFunction("stopAlarm") { (id: String, promise: Promise) in
      promise.resolve(true)
    }

    AsyncFunction("snoozeAlarm") { (id: String, promise: Promise) in
      promise.resolve(true)
    }

    Function("getPendingGameAlarmId") { () -> String? in
      let id = UserDefaults.standard.string(forKey: "PendingGameAlarmId")
      UserDefaults.standard.removeObject(forKey: "PendingGameAlarmId")
      return id
    }
  }
}

