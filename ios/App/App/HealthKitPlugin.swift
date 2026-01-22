import Foundation
import Capacitor
import HealthKit

@objc(HealthKitPlugin)
public class HealthKitPlugin: CAPPlugin {
    
    @objc func requestReadAuthorization(_ call: CAPPluginCall) {
        HealthKitManager.shared.requestReadAuthorization { success in
            if success {
                call.resolve([
                    "authorized": true
                ])
            } else {
                call.reject("HealthKit authorization failed or HealthKit is not available")
            }
        }
    }
}
