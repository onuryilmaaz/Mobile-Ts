import ActivityKit
import SwiftUI
import WidgetKit

// MARK: - Helpers

private func prayerKeyFromName(_ name: String) -> String {
  let n = name.lowercased()
  if n.contains("sabah") || n.contains("imsak") || n.contains("fajr") { return "sabah" }
  if n.contains("öğle") || n.contains("ogle") || n.contains("dhuhr") { return "ogle" }
  if n.contains("ikindi") || n.contains("asr") { return "ikindi" }
  if n.contains("akşam") || n.contains("aksam") || n.contains("maghrib") { return "aksam" }
  if n.contains("yatsı") || n.contains("yatsi") || n.contains("isha") { return "yatsi" }
  return "ogle"
}

// MARK: - Lock Screen Banner (Premium, sistem temasıyla uyumlu)

struct SalahLockScreenView: View {
  let state: SitePongActivityAttributes.ContentState
  @Environment(\.colorScheme) private var colorScheme

  private var endDate: Date { Date(timeIntervalSince1970: state.endTimeMs / 1000) }
  private var prayerKey: String { prayerKeyFromName(state.prayerName) }
  private var nextKey: String { prayerKeyFromName(state.nextPrayer) }
  private var gradient: PrayerGradient { prayerGradient(for: prayerKey) }
  private var iconName: String { prayerCompletedIcon(for: prayerKey) }
  private var isDark: Bool { colorScheme == .dark }

  var body: some View {
    HStack(spacing: 14) {
      // Sol: büyük gradient ikon kutusu
      ZStack {
        if isDark {
          RoundedRectangle(cornerRadius: 14, style: .continuous)
            .fill(gradient.glow.opacity(0.55))
            .frame(width: 58, height: 58)
            .blur(radius: 10)
            .offset(y: 2)
        }
        RoundedRectangle(cornerRadius: 14, style: .continuous)
          .fill(gradient.linear)
          .frame(width: 54, height: 54)
          .shadow(color: gradient.base.opacity(isDark ? 0.0 : 0.50), radius: 8, x: 0, y: 3)

        if isDark {
          RoundedRectangle(cornerRadius: 14, style: .continuous)
            .fill(
              LinearGradient(
                colors: [Color.white.opacity(0.22), Color.white.opacity(0)],
                startPoint: .top, endPoint: .center
              )
            )
            .frame(width: 54, height: 54)
          RoundedRectangle(cornerRadius: 14, style: .continuous)
            .strokeBorder(Color.white.opacity(0.14), lineWidth: 0.8)
            .frame(width: 54, height: 54)
        }

        Image(systemName: iconName)
          .font(.system(size: 24, weight: .semibold))
          .foregroundColor(.white)
          .shadow(color: gradient.base.opacity(0.80), radius: 3, x: 0, y: 1)
          .shadow(color: gradient.glow.opacity(0.55), radius: 8, x: 0, y: 0)
      }

      // Orta: vakit ismi + sayaç
      VStack(alignment: .leading, spacing: 2) {
        Text(state.prayerName)
          .font(.system(size: 17, weight: .heavy, design: .rounded))
          .foregroundStyle(gradient.linear)
          .shadow(color: gradient.base.opacity(isDark ? 0.0 : 0.40), radius: 4, x: 0, y: 1)
          .lineLimit(1)
          .minimumScaleFactor(0.7)

        Text(timerInterval: Date.now...endDate, pauseTime: nil)
          .font(.system(size: 22, weight: .bold, design: .rounded).monospacedDigit())
          .foregroundColor(.primary)
          .lineLimit(1)
          .minimumScaleFactor(0.7)
      }

      Spacer(minLength: 6)

      // Sağ: sonraki vakit chip
      let nextGrad = prayerGradient(for: nextKey)
      VStack(alignment: .trailing, spacing: 3) {
        Text("SONRAKİ")
          .font(.system(size: 8, weight: .black))
          .foregroundColor(.secondary)
          .tracking(0.5)
        HStack(spacing: 4) {
          Image(systemName: "arrow.right")
            .font(.system(size: 9, weight: .bold))
            .foregroundColor(nextGrad.glow)
          Text(state.nextPrayer)
            .font(.system(size: 12, weight: .bold))
            .foregroundColor(nextGrad.glow)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(
          Capsule()
            .fill(nextGrad.base.opacity(isDark ? 0.20 : 0.12))
        )
        .overlay(
          Capsule()
            .strokeBorder(nextGrad.glow.opacity(isDark ? 0.35 : 0.45), lineWidth: 0.8)
        )
      }
    }
    .padding(.horizontal, 16)
    .padding(.vertical, 14)
    .frame(maxWidth: .infinity)
    .background(
      // Sistem temasıyla otomatik uyumlu cam arka plan
      ContainerRelativeShape()
        .fill(.ultraThinMaterial)
    )
  }
}

// MARK: - Compact Pill Components (Dynamic Island'da kayma olmasın diye dar tasarlandı)

// Kalan dakika string'i — sabit ~3-4 karakter, daima dar
private func remainingMinutesText(endTimeMs: Double) -> String {
  let end = Date(timeIntervalSince1970: endTimeMs / 1000)
  let now = Date()
  let diff = max(0, end.timeIntervalSince(now))
  let minutes = Int(diff / 60)
  if minutes >= 60 {
    let hours = minutes / 60
    let rem = minutes % 60
    return rem == 0 ? "\(hours)s" : "\(hours)s\(rem)d"   // "2s30d" tarzı
  }
  return "\(minutes)d"
}

// MARK: - Live Activity Widget

struct SitePongLiveActivityWidgetLiveActivity: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: SitePongActivityAttributes.self) { context in
      // Kilit ekranı banner
      SalahLockScreenView(state: context.state)
        .activityBackgroundTint(Color.clear)
        .activitySystemActionForegroundColor(.primary)

    } dynamicIsland: { context in
      let endDate = Date(timeIntervalSince1970: context.state.endTimeMs / 1000)
      let prayerKey = prayerKeyFromName(context.state.prayerName)
      let nextKey = prayerKeyFromName(context.state.nextPrayer)
      let gradient = prayerGradient(for: prayerKey)
      let nextGradient = prayerGradient(for: nextKey)
      let iconName = prayerCompletedIcon(for: prayerKey)
      let nextIconName = prayerCompletedIcon(for: nextKey)

      return DynamicIsland {
        // ── EXPANDED (uzun bas / dokun) ──

        DynamicIslandExpandedRegion(.leading) {
          HStack(spacing: 8) {
            ZStack {
              Circle()
                .fill(gradient.glow.opacity(0.45))
                .frame(width: 36, height: 36)
                .blur(radius: 6)
              Circle()
                .fill(gradient.linear)
                .frame(width: 32, height: 32)
              Image(systemName: iconName)
                .font(.system(size: 15, weight: .semibold))
                .foregroundColor(.white)
                .shadow(color: gradient.base.opacity(0.7), radius: 2, x: 0, y: 1)
            }
            VStack(alignment: .leading, spacing: 0) {
              Text(context.state.prayerName)
                .font(.system(size: 14, weight: .heavy, design: .rounded))
                .foregroundStyle(gradient.linear)
              Text("VAKTİ")
                .font(.system(size: 8, weight: .black))
                .foregroundColor(.secondary)
                .tracking(0.5)
            }
          }
          .padding(.leading, 6)
        }

        DynamicIslandExpandedRegion(.trailing) {
          VStack(alignment: .trailing, spacing: 0) {
            Text("SONRAKİ")
              .font(.system(size: 8, weight: .black))
              .foregroundColor(.secondary)
              .tracking(0.5)
            HStack(spacing: 4) {
              Image(systemName: nextIconName)
                .font(.system(size: 11, weight: .bold))
                .foregroundColor(nextGradient.glow)
              Text(context.state.nextPrayer)
                .font(.system(size: 13, weight: .bold))
                .foregroundColor(nextGradient.glow)
            }
            .padding(.horizontal, 8)
            .padding(.vertical, 3)
            .background(
              Capsule().fill(nextGradient.base.opacity(0.20))
            )
            .overlay(
              Capsule().strokeBorder(nextGradient.glow.opacity(0.40), lineWidth: 0.8)
            )
          }
          .padding(.trailing, 6)
        }

        DynamicIslandExpandedRegion(.bottom) {
          VStack(spacing: 4) {
            Text(timerInterval: Date.now...endDate, pauseTime: nil)
              .font(.system(size: 40, weight: .heavy, design: .rounded).monospacedDigit())
              .foregroundColor(.white)
              .minimumScaleFactor(0.7)
              .lineLimit(1)

            Text("NAMAZIN ÇIKMASINA KALAN SÜRE")
              .font(.system(size: 9, weight: .black))
              .foregroundColor(.secondary)
              .tracking(1.0)
          }
          .padding(.bottom, 8)
        }

      } compactLeading: {
        // ── SOL PILL: sadece vakit ikonu, sabit dar genişlik ──
        Image(systemName: iconName)
          .font(.system(size: 14, weight: .bold))
          .foregroundStyle(gradient.linear)
          .frame(width: 22, height: 22)

      } compactTrailing: {
        // ── SAĞ PILL: kalan dakika (kısa string), sabit dar genişlik ──
        // "23d" veya "1s30d" gibi maksimum 5 karakter — taşma yok
        Text(remainingMinutesText(endTimeMs: context.state.endTimeMs))
          .font(.system(size: 13, weight: .heavy, design: .rounded).monospacedDigit())
          .foregroundStyle(gradient.linear)
          .lineLimit(1)
          .frame(minWidth: 22, alignment: .trailing)

      } minimal: {
        Image(systemName: iconName)
          .font(.system(size: 13, weight: .bold))
          .foregroundStyle(gradient.linear)
      }
    }
  }
}