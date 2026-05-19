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

/// Vakit ilerleme yüzdesi (0 = yeni başladı, 1 = vakit bitti)
/// Vaktin başlangıç saati ContentState'de yok, bu yüzden son 120dk'ı referans alıyoruz
/// (vakit aralıkları tipik olarak 1-2 saat, bu görsel olarak doğru sinyali verir)
private func prayerProgress(endTimeMs: Double) -> Double {
  let end = Date(timeIntervalSince1970: endTimeMs / 1000)
  let remaining = end.timeIntervalSince(Date())
  guard remaining > 0 else { return 1.0 }
  let windowSeconds: Double = 120 * 60  // 120 dakika referans aralık
  let elapsed = max(0, windowSeconds - remaining)
  return min(1.0, elapsed / windowSeconds)
}

// MARK: - Compact Progress Ring (24pt — kayma yapmaz, sabit boyut)

private struct CompactProgressRing: View {
  let progress: Double
  let gradient: PrayerGradient
  let centerIcon: String   // ortadaki küçük ikon (ör. clock, hourglass)

  var body: some View {
    ZStack {
      // Track
      Circle()
        .stroke(Color.white.opacity(0.18), style: StrokeStyle(lineWidth: 2.5, lineCap: .round))

      // Progress — gradient angular
      Circle()
        .trim(from: 0, to: CGFloat(progress))
        .stroke(
          AngularGradient(
            colors: [gradient.base, gradient.highlight, gradient.glow, gradient.highlight, gradient.base],
            center: .center,
            startAngle: .degrees(-90),
            endAngle: .degrees(270)
          ),
          style: StrokeStyle(lineWidth: 2.5, lineCap: .round)
        )
        .rotationEffect(.degrees(-90))
        .shadow(color: gradient.glow.opacity(0.55), radius: 2)

      // Ortadaki minik vakit ikonu — net görünsün diye biraz büyük
      Image(systemName: centerIcon)
        .font(.system(size: 10, weight: .bold))
        .foregroundStyle(gradient.linear)
        .shadow(color: gradient.glow.opacity(0.5), radius: 1.5)
    }
    .frame(width: 22, height: 22)
  }
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
      ZStack {
        if isDark {
          RoundedRectangle(cornerRadius: 14, style: .continuous)
            .fill(gradient.glow.opacity(0.55))
            .frame(width: 58, height: 58).blur(radius: 10).offset(y: 2)
        }
        RoundedRectangle(cornerRadius: 14, style: .continuous)
          .fill(gradient.linear)
          .frame(width: 54, height: 54)
          .shadow(color: gradient.base.opacity(isDark ? 0.0 : 0.50), radius: 8, x: 0, y: 3)

        if isDark {
          RoundedRectangle(cornerRadius: 14, style: .continuous)
            .fill(LinearGradient(colors: [Color.white.opacity(0.22), Color.white.opacity(0)], startPoint: .top, endPoint: .center))
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

      VStack(alignment: .leading, spacing: 2) {
        Text(state.prayerName)
          .font(.system(size: 17, weight: .heavy, design: .rounded))
          .foregroundStyle(gradient.linear)
          .shadow(color: gradient.base.opacity(isDark ? 0.0 : 0.40), radius: 4, x: 0, y: 1)
          .lineLimit(1).minimumScaleFactor(0.7)

        Text(timerInterval: Date.now...endDate, pauseTime: nil)
          .font(.system(size: 22, weight: .bold, design: .rounded).monospacedDigit())
          .foregroundColor(.primary)
          .lineLimit(1).minimumScaleFactor(0.7)
      }

      Spacer(minLength: 6)

      let nextGrad = prayerGradient(for: nextKey)
      VStack(alignment: .trailing, spacing: 3) {
        Text("SONRAKİ")
          .font(.system(size: 8, weight: .black))
          .foregroundColor(.secondary).tracking(0.5)
        HStack(spacing: 4) {
          Image(systemName: "arrow.right")
            .font(.system(size: 9, weight: .bold))
            .foregroundColor(nextGrad.glow)
          Text(state.nextPrayer)
            .font(.system(size: 12, weight: .bold))
            .foregroundColor(nextGrad.glow)
        }
        .padding(.horizontal, 8).padding(.vertical, 4)
        .background(Capsule().fill(nextGrad.base.opacity(isDark ? 0.20 : 0.12)))
        .overlay(Capsule().strokeBorder(nextGrad.glow.opacity(isDark ? 0.35 : 0.45), lineWidth: 0.8))
      }
    }
    .padding(.horizontal, 16)
    .padding(.vertical, 14)
    .frame(maxWidth: .infinity)
    .background(ContainerRelativeShape().fill(.ultraThinMaterial))
  }
}

// MARK: - Live Activity Widget

struct SitePongLiveActivityWidgetLiveActivity: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: SitePongActivityAttributes.self) { context in
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
      let progress = prayerProgress(endTimeMs: context.state.endTimeMs)

      return DynamicIsland {
        // ── EXPANDED — premium kompozit tasarım ──

        // Üst leading: kompakt vakit etiketi
        DynamicIslandExpandedRegion(.leading) {
          HStack(spacing: 6) {
            Image(systemName: iconName)
              .font(.system(size: 13, weight: .bold))
              .foregroundStyle(gradient.linear)
              .shadow(color: gradient.glow.opacity(0.6), radius: 3)
            Text(context.state.prayerName)
              .font(.system(size: 13, weight: .heavy, design: .rounded))
              .foregroundStyle(gradient.linear)
            Text("VAKTİ")
              .font(.system(size: 9, weight: .black))
              .foregroundColor(.secondary)
              .tracking(0.5)
          }
          .padding(.leading, 6)
        }

        // Üst trailing: sonraki vakit chip
        DynamicIslandExpandedRegion(.trailing) {
          HStack(spacing: 4) {
            Image(systemName: "arrow.right")
              .font(.system(size: 9, weight: .bold))
              .foregroundColor(.secondary)
            Image(systemName: nextIconName)
              .font(.system(size: 11, weight: .bold))
              .foregroundColor(nextGradient.glow)
            Text(context.state.nextPrayer)
              .font(.system(size: 12, weight: .bold))
              .foregroundColor(nextGradient.glow)
          }
          .padding(.horizontal, 9).padding(.vertical, 4)
          .background(Capsule().fill(nextGradient.base.opacity(0.20)))
          .overlay(Capsule().strokeBorder(nextGradient.glow.opacity(0.40), lineWidth: 0.8))
          .padding(.trailing, 6)
        }

        // BOTTOM — ana sahne: dev ring + sayaç + ilerleme çubuğu
        DynamicIslandExpandedRegion(.bottom) {
          VStack(spacing: 10) {
            HStack(spacing: 16) {
              // Sol: DEV progress ring (60pt) — ortada vakit ikonu
              ZStack {
                // Dış glow
                Circle()
                  .fill(gradient.glow.opacity(0.40))
                  .frame(width: 70, height: 70)
                  .blur(radius: 10)

                // Track
                Circle()
                  .stroke(Color.white.opacity(0.15), style: StrokeStyle(lineWidth: 4.5, lineCap: .round))
                  .frame(width: 60, height: 60)

                // Progress
                Circle()
                  .trim(from: 0, to: CGFloat(progress))
                  .stroke(
                    AngularGradient(
                      colors: [gradient.base, gradient.highlight, gradient.glow, gradient.highlight, gradient.base],
                      center: .center,
                      startAngle: .degrees(-90),
                      endAngle: .degrees(270)
                    ),
                    style: StrokeStyle(lineWidth: 4.5, lineCap: .round)
                  )
                  .frame(width: 60, height: 60)
                  .rotationEffect(.degrees(-90))
                  .shadow(color: gradient.glow.opacity(0.6), radius: 5)

                // Ortadaki vakit ikonu
                Image(systemName: iconName)
                  .font(.system(size: 24, weight: .semibold))
                  .foregroundStyle(gradient.linear)
                  .shadow(color: gradient.glow.opacity(0.7), radius: 4)
              }
              .frame(width: 70, height: 70)

              // Sağ: sayaç + etiket
              VStack(alignment: .leading, spacing: 2) {
                Text("KALAN SÜRE")
                  .font(.system(size: 9, weight: .black))
                  .foregroundColor(.secondary)
                  .tracking(0.8)

                Text(timerInterval: Date.now...endDate, pauseTime: nil)
                  .font(.system(size: 34, weight: .heavy, design: .rounded).monospacedDigit())
                  .foregroundStyle(gradient.linear)
                  .shadow(color: gradient.glow.opacity(0.55), radius: 4)
                  .lineLimit(1)
                  .minimumScaleFactor(0.6)

                Text("namazın çıkmasına")
                  .font(.system(size: 10, weight: .semibold))
                  .foregroundColor(.secondary)
              }

              Spacer(minLength: 0)
            }
            .padding(.horizontal, 4)

            // Alt: yatay ilerleme çubuğu (decoration)
            GeometryReader { geo in
              ZStack(alignment: .leading) {
                // Track
                Capsule()
                  .fill(Color.white.opacity(0.12))
                  .frame(height: 4)
                // Fill
                Capsule()
                  .fill(gradient.linear)
                  .frame(width: max(4, geo.size.width * CGFloat(progress)), height: 4)
                  .shadow(color: gradient.glow.opacity(0.6), radius: 3)
              }
            }
            .frame(height: 4)
            .padding(.horizontal, 4)
          }
          .padding(.bottom, 6)
          .padding(.top, 2)
        }

      } compactLeading: {
        // ── SOL: vakit ikonu (sabit 22pt, kayma yok) ──
        Image(systemName: iconName)
          .font(.system(size: 14, weight: .bold))
          .foregroundStyle(gradient.linear)
          .shadow(color: gradient.glow.opacity(0.6), radius: 3)
          .frame(width: 22, height: 22)

      } compactTrailing: {
        // ── SAĞ: progress ring (sabit 22pt, kayma yok) — ortada vakit ikonu ──
        CompactProgressRing(
          progress: progress,
          gradient: gradient,
          centerIcon: iconName
        )

      } minimal: {
        // ── MINIMAL: tek bir görsel (progress ring) ──
        ZStack {
          Circle()
            .stroke(Color.white.opacity(0.20), style: StrokeStyle(lineWidth: 2.0, lineCap: .round))
          Circle()
            .trim(from: 0, to: CGFloat(progress))
            .stroke(
              AngularGradient(
                colors: [gradient.base, gradient.highlight, gradient.glow, gradient.highlight, gradient.base],
                center: .center,
                startAngle: .degrees(-90),
                endAngle: .degrees(270)
              ),
              style: StrokeStyle(lineWidth: 2.0, lineCap: .round)
            )
            .rotationEffect(.degrees(-90))
            .shadow(color: gradient.glow.opacity(0.55), radius: 2)

          Image(systemName: iconName)
            .font(.system(size: 9, weight: .black))
            .foregroundStyle(gradient.linear)
        }
      }
    }
  }
}