import AppIntents

@available(iOS 26.0, *)
public struct AlarmKitAppIntentsPackage: AppIntentsPackage {
    public static var intentClasses: [any AppIntent.Type] {
        return [
            StartChallengeIntent.self,
            StopAlarmIntent.self
        ]
    }
}
