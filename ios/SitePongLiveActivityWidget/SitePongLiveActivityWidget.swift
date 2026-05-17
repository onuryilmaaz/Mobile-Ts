import SwiftUI
import WidgetKit

@main
struct SitePongLiveActivityWidgetBundle: WidgetBundle {
  var body: some Widget {
    // Dark theme widgets (varsayılan)
    PrayerTimesWidget()
    PrayerTrackerWidget()
    AmelWidget()
    InspirationWidget()

    // Light theme widgets
    PrayerTimesLightWidget()
    PrayerTrackerLightWidget()
    AmelLightWidget()
    InspirationLightWidget()

    // Live Activity
    SitePongLiveActivityWidgetLiveActivity()
  }
}
