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
    guard obj.date == todayDateString() else { return nil }
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
    guard obj.date == todayDateString() else { return nil }
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
    guard obj.date == todayDateString() else { return nil }
    return obj
  }
}

struct GoalItem: Codable {
  var activity: String
  var label: String
  var target: Int
  var progress: Int
  var unit: String
  var colorHex: String
  var sfSymbol: String

  var pct: Double { target > 0 ? min(1.0, Double(progress) / Double(target)) : 0 }
  var isDone: Bool { progress >= target }
}

struct GoalsData: Codable {
  var goals: [GoalItem]
  var completedCount: Int
  var totalCount: Int
  var date: String

  static func load() -> GoalsData? {
    guard
      let ud = UserDefaults(suiteName: appGroupID),
      let data = ud.data(forKey: "salah_goals_data"),
      let obj = try? JSONDecoder().decode(GoalsData.self, from: data)
    else { return nil }
    guard obj.date == todayDateString() else { return nil }
    return obj
  }
}

// MARK: - Date Helpers

private func todayDateString() -> String {
  let f = DateFormatter()
  f.dateFormat = "yyyy-MM-dd"
  return f.string(from: Date())
}

// MARK: - Dynamic Prayer Computation

struct ComputedPrayerState {
  let prayerName: String
  let prayerTime: String
  let endDate: Date
  let nextPrayer: String
}

func computeNextPrayer(data: WidgetData?, at entryDate: Date) -> ComputedPrayerState? {
  guard let data = data else { return nil }
  let cal = Calendar.current

  func toDate(_ timeStr: String) -> Date? {
    guard !timeStr.isEmpty else { return nil }
    let parts = timeStr.split(separator: ":").compactMap { Int($0) }
    guard parts.count >= 2 else { return nil }
    var c = cal.dateComponents([.year, .month, .day], from: entryDate)
    c.hour = parts[0]; c.minute = parts[1]; c.second = 0
    return cal.date(from: c)
  }

  let checkpoints: [(String, String)] = [
    ("İmsak",  data.imsak),
    ("Güneş",  data.gunes),
    ("Öğle",   data.ogle),
    ("İkindi", data.ikindi),
    ("Akşam",  data.aksam),
    ("Yatsı",  data.yatsi),
  ]

  for i in 0..<checkpoints.count {
    let (name, timeStr) = checkpoints[i]
    guard let checkDate = toDate(timeStr), checkDate > entryDate else { continue }
    let nextName = checkpoints[(i + 1) % checkpoints.count].0
    return ComputedPrayerState(prayerName: name, prayerTime: timeStr, endDate: checkDate, nextPrayer: nextName)
  }

  // All today's checkpoints have passed — show tomorrow's İmsak
  let imsakStr = data.imsak
  guard !imsakStr.isEmpty else { return nil }
  let parts = imsakStr.split(separator: ":").compactMap { Int($0) }
  guard parts.count >= 2, let tomorrow = cal.date(byAdding: .day, value: 1, to: entryDate) else { return nil }
  var c = cal.dateComponents([.year, .month, .day], from: tomorrow)
  c.hour = parts[0]; c.minute = parts[1]; c.second = 0
  guard let tomorrowImsak = cal.date(from: c) else { return nil }
  return ComputedPrayerState(prayerName: "İmsak", prayerTime: imsakStr, endDate: tomorrowImsak, nextPrayer: "Güneş")
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
