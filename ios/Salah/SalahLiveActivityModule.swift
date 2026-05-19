import ActivityKit
import Foundation
import React
import WidgetKit

@objc(SalahLiveActivityModule)
class SalahLiveActivityModule: NSObject {

  private let appGroupID = "group.com.onur6541.salah"

  @objc static func requiresMainQueueSetup() -> Bool { false }

  // MARK: - Live Activity

  @objc func startPrayerActivity(
    _ params: NSDictionary,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    guard #available(iOS 16.2, *) else { resolve(nil); return }
    let prayerName = params["prayerName"] as? String ?? ""
    let nextPrayer = params["nextPrayer"] as? String ?? ""
    let endTimeMs = params["endTimeMs"] as? Double ?? 0

    Task {
      for activity in Activity<SitePongActivityAttributes>.activities {
        await activity.end(nil, dismissalPolicy: .immediate)
      }
      
      let state = SitePongActivityAttributes.ContentState(
        prayerName: prayerName, nextPrayer: nextPrayer, endTimeMs: endTimeMs)
      let attrs = SitePongActivityAttributes()
      let content = ActivityContent(state: state, staleDate: nil)
      
      do {
        let activity = try Activity<SitePongActivityAttributes>.request(
          attributes: attrs, content: content, pushType: nil)
        resolve(activity.id)
      } catch {
        reject("ERROR", error.localizedDescription, error)
      }
    }
  }

  @objc func endPrayerActivity(
    _ resolve: @escaping RCTPromiseResolveBlock,
    reject _: @escaping RCTPromiseRejectBlock
  ) {
    guard #available(iOS 16.2, *) else { resolve(nil); return }
    Task {
      for activity in Activity<SitePongActivityAttributes>.activities {
        await activity.end(nil, dismissalPolicy: .immediate)
      }
      resolve(nil)
    }
  }

  // MARK: - Widget UserDefaults

  private func defaults() -> UserDefaults? {
    UserDefaults(suiteName: appGroupID)
  }

  @objc func updateWidgetData(_ params: NSDictionary) {
    guard let ud = defaults() else { return }
    let dict: [String: Any] = [
      "prayerName": params["prayerName"] as? String ?? "",
      "prayerTime": params["prayerTime"] as? String ?? "",
      "nextPrayer": params["nextPrayer"] as? String ?? "",
      "endTimeMs": params["endTimeMs"] as? Double ?? 0,
      "imsak": params["imsak"] as? String ?? "",
      "gunes": params["gunes"] as? String ?? "",
      "ogle": params["ogle"] as? String ?? "",
      "ikindi": params["ikindi"] as? String ?? "",
      "aksam": params["aksam"] as? String ?? "",
      "yatsi": params["yatsi"] as? String ?? "",
    ]
    if let data = try? JSONSerialization.data(withJSONObject: dict) {
      ud.set(data, forKey: "salah_widget_data")
    }
    WidgetCenter.shared.reloadTimelines(ofKind: "SalahPrayerTimesWidget")
    WidgetCenter.shared.reloadTimelines(ofKind: "SalahPrayerTimesWidgetLight")
  }

  @objc func updatePrayerTrackerData(_ params: NSDictionary) {
    guard let ud = defaults() else { return }
    let dict: [String: Any] = [
      "completedPrayers": params["completedPrayers"] as? [String] ?? [],
      "kazaPrayers": params["kazaPrayers"] as? [String] ?? [],
      "date": params["date"] as? String ?? "",
    ]
    if let data = try? JSONSerialization.data(withJSONObject: dict) {
      ud.set(data, forKey: "salah_tracker_data")
    }
    WidgetCenter.shared.reloadTimelines(ofKind: "SalahTrackerWidget")
    WidgetCenter.shared.reloadTimelines(ofKind: "SalahTrackerWidgetLight")
  }

  @objc func updateAmelData(_ params: NSDictionary) {
    guard let ud = defaults() else { return }
    let dict: [String: Any] = [
      "types": params["types"] as? [String] ?? [],
      "totalCount": params["totalCount"] as? Int ?? 0,
      "date": params["date"] as? String ?? "",
    ]
    if let data = try? JSONSerialization.data(withJSONObject: dict) {
      ud.set(data, forKey: "salah_amel_data")
    }
    WidgetCenter.shared.reloadTimelines(ofKind: "SalahAmelWidget")
    WidgetCenter.shared.reloadTimelines(ofKind: "SalahAmelWidgetLight")
  }

  @objc func updateInspirationData(_ params: NSDictionary) {
    guard let ud = defaults() else { return }
    let dict: [String: Any] = [
      "text": params["text"] as? String ?? "",
      "source": params["source"] as? String ?? "",
      "type": params["type"] as? String ?? "",
      "arabic": params["arabic"] as? String ?? "",
      "date": params["date"] as? String ?? "",
    ]
    if let data = try? JSONSerialization.data(withJSONObject: dict) {
      ud.set(data, forKey: "salah_inspiration_data")
    }
    WidgetCenter.shared.reloadTimelines(ofKind: "SalahInspirationWidget")
    WidgetCenter.shared.reloadTimelines(ofKind: "SalahInspirationWidgetLight")
  }

  @objc func getPendingWidgetPrayers(
    _ resolve: @escaping RCTPromiseResolveBlock,
    reject _: @escaping RCTPromiseRejectBlock
  ) {
    let ud = defaults()
    let pending = ud?.string(forKey: "salah_pending_prayers") ?? ""
    ud?.removeObject(forKey: "salah_pending_prayers")
    resolve(pending)
  }

  // Writes auth tokens + API URL into App Group so the widget can call the backend directly
  @objc func updateAuthData(_ params: NSDictionary) {
    guard let ud = defaults() else { return }
    if let token = params["accessToken"] as? String {
      if token.isEmpty { ud.removeObject(forKey: "salah_access_token") }
      else { ud.set(token, forKey: "salah_access_token") }
    }
    if let refresh = params["refreshToken"] as? String {
      if refresh.isEmpty { ud.removeObject(forKey: "salah_refresh_token") }
      else { ud.set(refresh, forKey: "salah_refresh_token") }
    }
    if let url = params["apiUrl"] as? String, !url.isEmpty {
      ud.set(url, forKey: "salah_api_url")
    }
  }
}
