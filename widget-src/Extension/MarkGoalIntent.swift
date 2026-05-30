import AppIntents
import WidgetKit

@available(iOS 17.0, *)
struct MarkGoalIntent: AppIntent {
  static var title: LocalizedStringResource = "Mark Goal"

  @Parameter(title: "Activity Type") var activityType: String
  @Parameter(title: "Target")        var target: Int

  init() {}
  init(activityType: String, target: Int) {
    self.activityType = activityType
    self.target = target
  }

  func perform() async throws -> some IntentResult {
    guard let ud = UserDefaults(suiteName: appGroupID) else { return .result() }

    // Optimistic update → widget refreshes instantly
    applyLocalUpdate(ud: ud)
    ud.synchronize()
    WidgetCenter.shared.reloadAllTimelines()

    // Background API call
    if !(await logOnBackend(ud: ud)) {
      // Queue for retry when app opens
      let pending = ud.string(forKey: "salah_pending_goals") ?? ""
      let entry   = "\(activityType):\(target)"
      ud.set(pending.isEmpty ? entry : "\(pending),\(entry)", forKey: "salah_pending_goals")
    }

    WidgetCenter.shared.reloadAllTimelines()
    return .result()
  }

  // MARK: - Value builder per activity type

  private func buildValue() -> [String: Any] {
    switch activityType {
    case "quran":        return ["pages": target]
    case "dhikr":        return ["subtype": "Genel", "count": target]
    case "nafile":       return ["type": "diger", "rakaat": target]
    case "fasting":      return ["type": "nafile"]
    case "dua":          return ["type": "Genel", "minutes": target]
    case "memorization": return ["new_ayets": target, "revision_ayets": 0]
    default:             return ["count": target]
    }
  }

  // MARK: - Local optimistic update

  private func applyLocalUpdate(ud: UserDefaults) {
    guard let raw  = ud.data(forKey: "salah_goals_data"),
          var data = try? JSONDecoder().decode(GoalsData.self, from: raw),
          let idx  = data.goals.firstIndex(where: { $0.activity == activityType })
    else { return }

    data.goals[idx].progress = data.goals[idx].target
    data.completedCount = data.goals.filter(\.isDone).count

    if let enc = try? JSONEncoder().encode(data) {
      ud.set(enc, forKey: "salah_goals_data")
    }
  }

  // MARK: - Backend call

  private func logOnBackend(ud: UserDefaults) async -> Bool {
    guard let apiUrl = ud.string(forKey: "salah_api_url"),
          let token  = ud.string(forKey: "salah_access_token"), !token.isEmpty,
          let url    = URL(string: "\(apiUrl)/tracker")
    else { return false }

    if let ok = await postLog(url: url, token: token) { return ok }

    if let newToken = await refreshToken(ud: ud) {
      return await postLog(url: url, token: newToken) ?? false
    }
    return false
  }

  private func postLog(url: URL, token: String) async -> Bool? {
    var req = URLRequest(url: url, timeoutInterval: 10)
    req.httpMethod = "POST"
    req.setValue("application/json", forHTTPHeaderField: "Content-Type")
    req.setValue("Bearer \(token)",  forHTTPHeaderField: "Authorization")
    req.httpBody = try? JSONSerialization.data(withJSONObject: [
      "activity_type": activityType,
      "value": buildValue(),
    ])
    do {
      let (_, res) = try await URLSession.shared.data(for: req)
      guard let http = res as? HTTPURLResponse else { return false }
      if http.statusCode == 401 { return nil }
      return (200...299).contains(http.statusCode)
    } catch { return false }
  }

  private func refreshToken(ud: UserDefaults) async -> String? {
    guard let apiUrl   = ud.string(forKey: "salah_api_url"),
          let refresh  = ud.string(forKey: "salah_refresh_token"), !refresh.isEmpty,
          let url      = URL(string: "\(apiUrl)/auth/refresh")
    else { return nil }

    var req = URLRequest(url: url, timeoutInterval: 10)
    req.httpMethod = "POST"
    req.setValue("application/json", forHTTPHeaderField: "Content-Type")
    req.httpBody = try? JSONSerialization.data(withJSONObject: ["refreshToken": refresh])

    do {
      let (data, _) = try await URLSession.shared.data(for: req)
      guard let json     = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
            let newAccess = json["accessToken"]  as? String,
            let newRefresh = json["refreshToken"] as? String
      else { return nil }
      ud.set(newAccess,  forKey: "salah_access_token")
      ud.set(newRefresh, forKey: "salah_refresh_token")
      return newAccess
    } catch { return nil }
  }
}
