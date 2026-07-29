import AppIntents
import UIKit

@available(iOS 16.0, *)
public struct StartChallengeIntent: LiveActivityIntent, ForegroundContinuableIntent {
    public static var title: LocalizedStringResource = "Start Challenge"
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
        try await requestToContinueInForeground()
        
        UserDefaults.standard.set(
            alarmId,
            forKey: "PendingGameAlarmId"
        )
        
        UserDefaults.standard.set(
            "startChallenge",
            forKey: "PendingGameReason"
        )
        
        return .result()
    }
}
