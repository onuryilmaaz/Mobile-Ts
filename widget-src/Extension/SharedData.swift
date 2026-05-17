import Foundation

let appGroupID = "group.com.onur6541.salah"

struct WidgetData: Codable {
  var prayerName: String
  var prayerTime: String
  var nextPrayer: String
  var endTimeMs: Double
  var imsak: String
  var gunes: String
  var ogle: String
  var ikindi: String
  var aksam: String
  var yatsi: String

  static func load() -> WidgetData? {
    guard
      let ud = UserDefaults(suiteName: appGroupID),
      let data = ud.data(forKey: "salah_widget_data"),
      let obj = try? JSONDecoder().decode(WidgetData.self, from: data)
    else { return nil }
    return obj
  }
}

struct TrackerData: Codable {
  var completedPrayers: [String]
  var kazaPrayers: [String]
  var date: String

  static func load() -> TrackerData? {
    guard
      let ud = UserDefaults(suiteName: appGroupID),
      let data = ud.data(forKey: "salah_tracker_data"),
      let obj = try? JSONDecoder().decode(TrackerData.self, from: data)
    else { return nil }
    return obj
  }
}

struct AmelData: Codable {
  var types: [String]
  var totalCount: Int
  var date: String

  static func load() -> AmelData? {
    guard
      let ud = UserDefaults(suiteName: appGroupID),
      let data = ud.data(forKey: "salah_amel_data"),
      let obj = try? JSONDecoder().decode(AmelData.self, from: data)
    else { return nil }
    return obj
  }
}

struct InspirationData: Codable {
  var text: String
  var source: String
  var type: String
  var arabic: String
  var date: String

  static func load() -> InspirationData? {
    guard
      let ud = UserDefaults(suiteName: appGroupID),
      let data = ud.data(forKey: "salah_inspiration_data"),
      let obj = try? JSONDecoder().decode(InspirationData.self, from: data)
    else { return nil }
    return obj
  }
}

// MARK: - Prayer ID Mapping (Widget ↔ Backend)
// Backend uses: fajr, dhuhr, asr, maghrib, isha
// Widget uses:  sabah, ogle, ikindi, aksam, yatsi

let widgetToBackendPrayerID: [String: String] = [
  "sabah":  "fajr",
  "ogle":   "dhuhr",
  "ikindi": "asr",
  "aksam":  "maghrib",
  "yatsi":  "isha",
]

let backendToWidgetPrayerID: [String: String] = [
  "fajr":    "sabah",
  "dhuhr":   "ogle",
  "asr":     "ikindi",
  "maghrib": "aksam",
  "isha":    "yatsi",
]

/// Check if a backend prayer ID is in the completed list (handles both id formats)
func isPrayerCompleted(_ widgetId: String, in completedPrayers: [String]) -> Bool {
  let backendId = widgetToBackendPrayerID[widgetId] ?? widgetId
  return completedPrayers.contains(widgetId) || completedPrayers.contains(backendId)
}

/// Check if a backend prayer ID is in the kaza list (handles both id formats)
func isPrayerKaza(_ widgetId: String, in kazaPrayers: [String]) -> Bool {
  let backendId = widgetToBackendPrayerID[widgetId] ?? widgetId
  return kazaPrayers.contains(widgetId) || kazaPrayers.contains(backendId)
}
