import ExpoModulesCore
import AlarmKit
import AVFoundation

public class AlarmKitModule: Module {

  public func definition() -> ModuleDefinition {
    Name("AlarmKit")
    
    Events("onChallengeRequested")
    
    OnCreate {
        NotificationCenter.default.addObserver(
            forName: NSNotification.Name("WakupChallengeRequested"),
            object: nil,
            queue: nil
        ) { [weak self] notification in
            guard let self = self,
                  let userInfo = notification.userInfo,
                  let alarmId = userInfo["alarmId"] as? String,
                  let reason = userInfo["reason"] as? String else { return }
            
            print("[AlarmKit] Pending challenge delivered to React Native")
            self.sendEvent("onChallengeRequested", [
                "alarmId": alarmId,
                "reason": reason
            ])
        }
    }

    AsyncFunction("requestAuthorization") { (promise: Promise) in
      if #available(iOS 26.0, *) {
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
        
        // Notify intents that the custom app audio is about to start
        NotificationCenter.default.post(
            name: NSNotification.Name("WakupAudioSessionConfigured"),
            object: nil
        )
        
        promise.resolve(true)
      } catch {
        promise.resolve(["success": false, "error": error.localizedDescription])
      }
    }

    AsyncFunction("scheduleAlarm") { (options: [String: Any], promise: Promise) in
      if #available(iOS 26.0, *) {
        Task {
          print("[AlarmKit] Received options from JS: \(options)")
          
          guard let idString = options["id"] as? String else {
            promise.resolve(["success": false, "error": "Invalid argument: 'id' must be a String (got \(String(describing: options["id"])))"])
            return
          }
          
          let parsedHour: Int?
          if let h = options["hour"] as? Int {
            parsedHour = h
          } else if let h = options["hour"] as? Double {
            parsedHour = Int(h)
          } else if let h = options["hour"] as? NSNumber {
            parsedHour = h.intValue
          } else {
            parsedHour = nil
          }

          guard let hour = parsedHour else {
            promise.resolve(["success": false, "error": "Invalid argument: 'hour' must be an Int (got \(String(describing: options["hour"])))"])
            return
          }
          
          let parsedMinute: Int?
          if let m = options["minute"] as? Int {
            parsedMinute = m
          } else if let m = options["minute"] as? Double {
            parsedMinute = Int(m)
          } else if let m = options["minute"] as? NSNumber {
            parsedMinute = m.intValue
          } else {
            parsedMinute = nil
          }

          guard let minute = parsedMinute else {
            promise.resolve(["success": false, "error": "Invalid argument: 'minute' must be an Int (got \(String(describing: options["minute"])))"])
            return
          }
          
          guard let label = options["label"] as? String else {
            promise.resolve(["success": false, "error": "Invalid argument: 'label' must be a String (got \(String(describing: options["label"])))"])
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

          var sanitizedOptions = options
          sanitizedOptions["hour"] = hour
          sanitizedOptions["minute"] = minute
          sanitizedOptions["repeatDays"] = repeatDays
          
          do {
              let (success, alarmId, errorMsg) = try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<(Bool, String?, String?), Error>) in
                  NotificationCenter.default.post(
                      name: NSNotification.Name("WakupScheduleAlarm"),
                      object: nil,
                      userInfo: [
                          "options": sanitizedOptions,
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
      if #available(iOS 26.0, *) {
        Task {
          print("[AlarmKit] Received cancel request for JS ID: \(idString)")

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
