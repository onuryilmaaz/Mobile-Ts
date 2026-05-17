import ActivityKit
import SwiftUI
import WidgetKit

// MARK: - Lock Screen Banner

struct SalahLockScreenView: View {
  let state: SitePongActivityAttributes.ContentState

  private var endDate: Date { Date(timeIntervalSince1970: state.endTimeMs / 1000) }

  var body: some View {
    HStack(spacing: 12) {
      Image(systemName: "moon.fill")
        .foregroundColor(.salahTeal)
        .font(.system(size: 18, weight: .bold))

      VStack(alignment: .leading, spacing: 2) {
        Text(state.prayerName)
          .font(.system(size: 15, weight: .bold))
          .foregroundColor(.salahTeal)
        Text(timerInterval: Date.now...endDate, pauseTime: nil)
          .font(.system(size: 13, weight: .medium).monospacedDigit())
          .foregroundColor(.primary)
      }

      Spacer()

      HStack(spacing: 4) {
        Text("→")
          .font(.system(size: 12))
          .foregroundColor(.secondary)
        Text(state.nextPrayer)
          .font(.system(size: 13, weight: .semibold))
          .foregroundColor(.secondary)
      }
    }
    .padding(.horizontal, 20)
    .padding(.vertical, 14)
  }
}

// MARK: - Widget

struct SitePongLiveActivityWidgetLiveActivity: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: SitePongActivityAttributes.self) { context in
      SalahLockScreenView(state: context.state)
        .activityBackgroundTint(Color(.systemBackground))
        .activitySystemActionForegroundColor(.primary)
    } dynamicIsland: { context in
      let endDate = Date(timeIntervalSince1970: context.state.endTimeMs / 1000)

      return DynamicIsland {
        // ── Expanded: Leading ──
        DynamicIslandExpandedRegion(.leading) {
          HStack(spacing: 4) {
            Image(systemName: "moon.fill")
              .foregroundColor(.salahTeal)
              .font(.system(size: 13, weight: .bold))
            Text(context.state.prayerName)
              .font(.system(size: 13, weight: .bold))
              .foregroundColor(.salahTeal)
              .lineLimit(1)
          }
        }

        // ── Expanded: Trailing ──
        DynamicIslandExpandedRegion(.trailing) {
          Text("→ \(context.state.nextPrayer)")
            .font(.system(size: 11, weight: .semibold))
            .foregroundColor(.secondary)
            .lineLimit(1)
        }

        // ── Expanded: Bottom — minimal, tek satır ──
        DynamicIslandExpandedRegion(.bottom) {
          HStack(spacing: 6) {
            Text(timerInterval: Date.now...endDate, pauseTime: nil)
              .font(.system(size: 24, weight: .bold).monospacedDigit())
              .foregroundColor(.primary)
            Text("kalan")
              .font(.system(size: 11, weight: .medium))
              .foregroundColor(.secondary)
          }
          .padding(.vertical, 4)
        }
      } compactLeading: {
        // ── Compact sol pill: sadece ikon + isim ──
        HStack(spacing: 3) {
          Image(systemName: "moon.fill")
            .foregroundColor(.salahTeal)
            .font(.system(size: 10, weight: .bold))
          Text(context.state.prayerName)
            .font(.system(size: 11, weight: .bold))
            .foregroundColor(.salahTeal)
            .lineLimit(1)
        }
      } compactTrailing: {
        // ── Compact sağ pill: sadece geri sayım ──
        Text(timerInterval: Date.now...endDate, pauseTime: nil)
          .font(.system(size: 11, weight: .semibold).monospacedDigit())
          .foregroundColor(.primary)
          .frame(minWidth: 32, alignment: .trailing)
      } minimal: {
        Image(systemName: "moon.fill")
          .foregroundColor(.salahTeal)
          .font(.system(size: 11, weight: .bold))
      }
    }
  }
}
