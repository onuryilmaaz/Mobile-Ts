import ActivityKit
import SwiftUI
import WidgetKit

// MARK: - Lock Screen Banner (Kilit Ekranı - Buzlu Cam Tasarımı)

struct SalahLockScreenView: View {
  let state: SitePongActivityAttributes.ContentState
  private var endDate: Date { Date(timeIntervalSince1970: state.endTimeMs / 1000) }

  var body: some View {
    HStack(spacing: 14) {
      Image(systemName: "moon.stars.fill")
        .font(.system(size: 24, weight: .semibold))
        .foregroundColor(Color(red: 0.0, green: 0.65, blue: 0.62))

      VStack(alignment: .leading, spacing: 2) {
        Text("\(state.prayerName) Namazı")
          .font(.system(size: 16, weight: .bold))
          .foregroundColor(Color(red: 0.0, green: 0.55, blue: 0.52))
        
        Text(timerInterval: Date.now...endDate, pauseTime: nil)
          .font(.system(size: 22, weight: .medium).monospacedDigit())
          .foregroundColor(.black.opacity(0.85))
      }

      Spacer()

      HStack(spacing: 4) {
        Text("→")
          .font(.system(size: 15, weight: .medium))
          .foregroundColor(.black.opacity(0.7))
        Text(state.nextPrayer)
          .font(.system(size: 16, weight: .semibold))
          .foregroundColor(.black.opacity(0.8))
      }
    }
    .padding(.horizontal, 20)
    .padding(.vertical, 16)
    .frame(maxWidth: .infinity)
    .background(
      ZStack {
        ContainerRelativeShape().fill(.ultraThinMaterial)
        LinearGradient(
          colors: [Color(red: 0.0, green: 0.75, blue: 0.70).opacity(0.22), Color.white.opacity(0.65)],
          startPoint: .trailing, endPoint: .leading
        )
      }
    )
  }
}

// MARK: - Widget (Dynamic Island Premium Tasarım)

struct SitePongLiveActivityWidgetLiveActivity: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: SitePongActivityAttributes.self) { context in
      SalahLockScreenView(state: context.state)
        .activityBackgroundTint(Color.clear)
        .activitySystemActionForegroundColor(.primary)
    } dynamicIsland: { context in
      let endDate = Date(timeIntervalSince1970: context.state.endTimeMs / 1000)

      return DynamicIsland {
        // ── BASILI TUTUNCA AÇILAN (EXPANDED) PREMIUM GÖRÜNÜM ──
        
        // Üst Sol: Vakit İsmi
        DynamicIslandExpandedRegion(.leading) {
          VStack(alignment: .leading, spacing: 2) {
            Text(context.state.prayerName)
              .font(.system(size: 14, weight: .black))
              .foregroundColor(.salahTeal)
            Text("VAKTİ")
              .font(.system(size: 10, weight: .bold))
              .foregroundColor(.secondary)
          }
          .padding(.leading, 8)
        }

        // Üst Sağ: İkon
        DynamicIslandExpandedRegion(.trailing) {
          Image(systemName: "moon.stars.fill")
            .font(.system(size: 20, weight: .bold))
            .foregroundColor(.salahTeal)
            .padding(.trailing, 8)
        }

        // Alt Merkez: Dev Sayaç ve Durum
        DynamicIslandExpandedRegion(.bottom) {
          VStack(spacing: 4) {
            Text(timerInterval: Date.now...endDate, pauseTime: nil)
              .font(.system(size: 36, weight: .medium).monospacedDigit())
              .foregroundColor(.white)
              .minimumScaleFactor(0.8)
            
            Text("Namazın çıkmasına kalan süre")
              .font(.system(size: 11, weight: .semibold))
              .foregroundColor(.secondary)
              .textCase(.uppercase)
              .tracking(1.2)
          }
          .padding(.bottom, 12)
        }

      } compactLeading: {
        // ── SOL PILL (KÜÇÜK) ──
        HStack {
          Spacer(minLength: 12)
          Image(systemName: "moon.stars.fill")
            .foregroundColor(.salahTeal)
            .font(.system(size: 11, weight: .bold))
        }
        .frame(maxWidth: 26, alignment: .trailing)
      } compactTrailing: {
        // ── SAĞ PILL (YENİDEN DARALTILAN KISIM) ──
        // Spacer kaldırıldı ve maxWidth tam sınıra (48) çekilerek genişleme engellendi
        Text(timerInterval: Date.now...endDate, pauseTime: nil)
          .font(.system(size: 11, weight: .bold).monospacedDigit())
          .foregroundColor(.white)
          .frame(maxWidth: 48, alignment: .leading)
      } minimal: {
        Image(systemName: "moon.stars.fill")
          .foregroundColor(.salahTeal)
          .font(.system(size: 11, weight: .bold))
      }
    }
  }
}