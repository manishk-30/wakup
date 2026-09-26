import AppIntents
import UIKit

@available(iOS 26.0, *)
public struct StopAlarmIntent: LiveActivityIntent, ForegroundContinuableIntent {
    public static var title: LocalizedStringResource = "Stop Alarm"
    public static var openAppWhenRun: Bool = true
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
    
    public func perform() async throws -> some IntentResult {
        print("[AlarmKit] StopAlarmIntent.perform alarmId=\(alarmId)")
        
        UserDefaults.standard.set(
            alarmId,
            forKey: "PendingGameAlarmId"
        )
        
        UserDefaults.standard.set(
            "stopAlarm",
            forKey: "PendingGameReason"
        )
        
        print("[AlarmKit] Pending challenge stored from StopAlarmIntent")
        
        NotificationCenter.default.post(
            name: NSNotification.Name("WakupChallengeRequested"),
            object: nil,
            userInfo: [
                "alarmId": alarmId,
                "reason": "stopAlarm"
            ]
        )
        
        try await requestToContinueInForeground()
        print("[AlarmKit] App became active from Stop intent")
        
        return .result()
    }
}
