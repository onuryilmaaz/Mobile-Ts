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

    let backendId = widgetToBackendPrayerID[prayerId] ?? prayerId

    // Detect kaza: load widget prayer times and check if window has expired
    var isKaza = false
    if let raw = ud.data(forKey: "salah_widget_data"),
       let widget = try? JSONDecoder().decode(WidgetData.self, from: raw) {
      isKaza = prayerIsExpired(prayerId: prayerId, widget: widget)
    }

    // Update local tracker data so the widget reflects it immediately
    if let raw = ud.data(forKey: "salah_tracker_data"),
       var tracker = try? JSONDecoder().decode(TrackerData.self, from: raw) {
      let alreadyDone = tracker.completedPrayers.contains(prayerId)
        || tracker.completedPrayers.contains(backendId)

      if !alreadyDone {
        tracker.completedPrayers.append(backendId)
        if isKaza {
          tracker.kazaPrayers.append(backendId)
        }
        if let enc = try? JSONEncoder().encode(tracker) {
          ud.set(enc, forKey: "salah_tracker_data")
        }
      }
    }

    // Queue for the app to sync with backend — include :kaza flag if needed
    let pending = ud.string(forKey: "salah_pending_prayers") ?? ""
    let entry = isKaza ? "\(backendId):kaza" : backendId
    ud.set(pending.isEmpty ? entry : "\(pending),\(entry)", forKey: "salah_pending_prayers")

    WidgetCenter.shared.reloadTimelines(ofKind: "SalahTrackerWidget")
    WidgetCenter.shared.reloadTimelines(ofKind: "SalahTrackerWidgetLight")
    return .result()
  }

  // Returns minutes since midnight from "HH:mm" string, 0 if unparseable
  private func timeToMinutes(_ timeStr: String) -> Int {
    let parts = timeStr.split(separator: ":").compactMap { Int($0) }
    guard parts.count >= 2 else { return 0 }
    return parts[0] * 60 + parts[1]
  }

  // A prayer is kaza if its time window has already ended
  private func prayerIsExpired(prayerId: String, widget: WidgetData) -> Bool {
    let now = Calendar.current.dateComponents([.hour, .minute], from: Date())
    let nowMin = (now.hour ?? 0) * 60 + (now.minute ?? 0)

    let imsakMin = timeToMinutes(widget.imsak)
    // Bridge period: after midnight but before imsak → previous Islamic day, all expired
    let inBridge = imsakMin > 0 && nowMin < imsakMin

    switch prayerId {
    case "sabah":   // fajr window ends at gunes (sunrise)
      if inBridge { return true }
      let endMin = timeToMinutes(widget.gunes)
      return endMin > 0 && nowMin >= endMin
    case "ogle":    // dhuhr window ends at ikindi
      if inBridge { return true }
      let endMin = timeToMinutes(widget.ikindi)
      return endMin > 0 && nowMin >= endMin
    case "ikindi":  // asr window ends at aksam
      if inBridge { return true }
      let endMin = timeToMinutes(widget.aksam)
      return endMin > 0 && nowMin >= endMin
    case "aksam":   // maghrib window ends at yatsi
      if inBridge { return true }
      let endMin = timeToMinutes(widget.yatsi)
      return endMin > 0 && nowMin >= endMin
    case "yatsi":   // isha never expires (lasts until next imsak)
      return false
    default:
      return false
    }
  }
}
