import ExpoModulesCore
import AlarmKit
import AVFoundation

public protocol AlarmSchedulerProtocol {
    func requestAuthorization() async throws -> Bool
    func schedule(id: UUID, hour: Int, minute: Int, label: String, repeatDays: [Int]) async throws -> Bool
    func cancel(id: UUID) throws
}

public class AlarmKitModule: Module {
  public static var delegate: AlarmSchedulerProtocol?

  public func definition() -> ModuleDefinition {
    Name("AlarmKit")

    AsyncFunction("requestAuthorization") { (promise: Promise) in
      if #available(iOS 26.0, *) {
        Task {
          do {
              let authorized = try await AlarmKitModule.delegate?.requestAuthorization() ?? false
              promise.resolve(authorized)
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
          
          do {
              let success = try await AlarmKitModule.delegate?.schedule(id: id, hour: hour, minute: minute, label: label, repeatDays: repeatDays) ?? false
              if success {
                  promise.resolve(["success": true, "alarmId": id.uuidString])
              } else {
                  promise.resolve(["success": false, "error": "Scheduler failed"])
              }
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
              try AlarmKitModule.delegate?.cancel(id: id)
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

    Function("getPendingGameAlarm") { () -> [String: String]? in
      guard let alarmId = UserDefaults.standard.string(
          forKey: "PendingGameAlarmId"
      ) else {
          return nil
      }
  
      let reason = UserDefaults.standard.string(
          forKey: "PendingGameReason"
      ) ?? "unknown"
  
      UserDefaults.standard.removeObject(
          forKey: "PendingGameAlarmId"
      )
  
      UserDefaults.standard.removeObject(
          forKey: "PendingGameReason"
      )
  
      return [
          "alarmId": alarmId,
          "reason": reason
      ]
    }
  }
}
