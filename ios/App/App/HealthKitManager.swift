// IMPORTANT:
// - Read-only HealthKit access
// - No workout writing
// - No background delivery
// - Must stay aligned with Info.plist usage descriptions

import HealthKit

final class HealthKitManager {

    static let shared = HealthKitManager()
    private let healthStore = HKHealthStore()

    private init() {}

    func requestReadAuthorization(completion: @escaping (Bool) -> Void) {
        guard HKHealthStore.isHealthDataAvailable() else {
            completion(false)
            return
        }

        var readTypes: Set<HKObjectType> = []

        readTypes.insert(HKObjectType.workoutType())

        if let heartRate = HKObjectType.quantityType(forIdentifier: .heartRate) {
            readTypes.insert(heartRate)
        }

        if let energy = HKObjectType.quantityType(forIdentifier: .activeEnergyBurned) {
            readTypes.insert(energy)
        }

        if let runDistance = HKObjectType.quantityType(forIdentifier: .distanceRunning) {
            readTypes.insert(runDistance)
        }

        if let cycleDistance = HKObjectType.quantityType(forIdentifier: .distanceCycling) {
            readTypes.insert(cycleDistance)
        }

        healthStore.requestAuthorization(
            toShare: [],
            read: readTypes
        ) { success, _ in
            DispatchQueue.main.async {
                completion(success)
            }
        }
    }
}
