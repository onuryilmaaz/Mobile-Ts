import AppIntents
import WidgetKit

@available(iOS 17.0, *)
struct MarkPrayerIntent: AppIntent {
  static var title: LocalizedStringResource = "Mark Prayer"

  @Parameter(title: "Prayer ID")
  var prayerId: String

  init() {}
  init(prayerId: String) { self.prayerId = prayerId }

  func perform() async throws -> some IntentResult {
    guard let ud = UserDefaults(suiteName: appGroupID) else { return .result() }

    // Update local tracker data so the widget reflects it immediately
    if let raw = ud.data(forKey: "salah_tracker_data"),
      var tracker = try? JSONDecoder().decode(TrackerData.self, from: raw)
    {
      // Check both widget id and backend id to avoid duplicates
      let backendId = widgetToBackendPrayerID[prayerId] ?? prayerId
      let alreadyDone = tracker.completedPrayers.contains(prayerId)
        || tracker.completedPrayers.contains(backendId)

      if !alreadyDone {
        // Store backend id in completedPrayers for consistency with app data
        tracker.completedPrayers.append(backendId)
        if let enc = try? JSONEncoder().encode(tracker) {
          ud.set(enc, forKey: "salah_tracker_data")
        }
      }
    }

    // Queue for the app to sync with backend — always use backend id
    let backendId = widgetToBackendPrayerID[prayerId] ?? prayerId
    let pending = ud.string(forKey: "salah_pending_prayers") ?? ""
    ud.set(pending.isEmpty ? backendId : "\(pending),\(backendId)", forKey: "salah_pending_prayers")

    WidgetCenter.shared.reloadTimelines(ofKind: "SalahTrackerWidget")
    return .result()
  }
}
