import SwiftUI
import WidgetKit

@main
struct SitePongLiveActivityWidgetBundle: WidgetBundle {
  var body: some Widget {
    // Home screen widgets
    PrayerTimesWidget()
    PrayerTrackerWidget()
    AmelWidget()
    InspirationWidget()

    // Light theme variants
    PrayerTimesLightWidget()
    PrayerTrackerLightWidget()
    AmelLightWidget()
    InspirationLightWidget()

    // Kilit ekranı widget'ları (iOS 16+)
    SalahNextPrayerLockWidget()
    SalahTrackerLockWidget()

    // Live Activity
    SitePongLiveActivityWidgetLiveActivity()
  }
}
