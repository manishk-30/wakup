import AppIntents
import UIKit

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
