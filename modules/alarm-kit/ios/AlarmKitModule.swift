import ExpoModulesCore
import AlarmKit
import AVFoundation

public class AlarmKitModule: Module {

  public func definition() -> ModuleDefinition {
    Name("AlarmKit")

    AsyncFunction("requestAuthorization") { (promise: Promise) in
      if #available(iOS 16.0, *) {
        Task {
          do {
              let authorized = try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Bool, Error>) in
                  NotificationCenter.default.post(
                      name: NSNotification.Name("WakupRequestAuth"),
                      object: nil,
                      userInfo: [
                          "completion": { (success: Bool) in
                              continuation.resume(returning: success)
                          }
                      ]
                  )
              }
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
      if #available(iOS 16.0, *) {
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
              let (success, alarmId, errorMsg) = try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<(Bool, String?, String?), Error>) in
                  NotificationCenter.default.post(
                      name: NSNotification.Name("WakupScheduleAlarm"),
                      object: nil,
                      userInfo: [
                          "options": options,
                          "completion": { (s: Bool, a: String?, e: String?) in
                              continuation.resume(returning: (s, a, e))
                          }
                      ]
                  )
              }
              
              if success {
                  promise.resolve(["success": true, "alarmId": alarmId!])
              } else {
                  promise.resolve(["success": false, "error": errorMsg ?? "Scheduler failed"])
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
      if #available(iOS 16.0, *) {
        Task {
          guard let id = UUID(uuidString: idString) else {
              promise.resolve(false)
              return
          }
          do {
              let success = try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Bool, Error>) in
                  NotificationCenter.default.post(
                      name: NSNotification.Name("WakupCancelAlarm"),
                      object: nil,
                      userInfo: [
                          "id": idString,
                          "completion": { (s: Bool) in
                              continuation.resume(returning: s)
                          }
                      ]
                  )
              }
              promise.resolve(success)
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
