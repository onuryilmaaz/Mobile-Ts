import SwiftUI
import WidgetKit

struct PrayerTimesEntry: TimelineEntry {
  let date: Date
  let data: WidgetData?
  let theme: SalahTheme
}

struct PrayerTimesProvider: TimelineProvider {
  let theme: SalahTheme

  func placeholder(in _: Context) -> PrayerTimesEntry {
    PrayerTimesEntry(date: Date(), data: nil, theme: theme)
  }
  func getSnapshot(in _: Context, completion: @escaping (PrayerTimesEntry) -> Void) {
    completion(PrayerTimesEntry(date: Date(), data: WidgetData.load(), theme: theme))
  }
  func getTimeline(in _: Context, completion: @escaping (Timeline<PrayerTimesEntry>) -> Void) {
    let entry = PrayerTimesEntry(date: Date(), data: WidgetData.load(), theme: theme)
    let next = Calendar.current.date(byAdding: .minute, value: 1, to: Date())!
    completion(Timeline(entries: [entry], policy: .after(next)))
  }
}

// MARK: - Backend ID → widget ID (vakit ismini renge çevirmek için)

private func prayerKeyFromName(_ name: String) -> String {
  let n = name.lowercased()
  if n.contains("sabah") || n.contains("imsak") || n.contains("fajr") { return "sabah" }
  if n.contains("öğle") || n.contains("ogle") || n.contains("dhuhr") { return "ogle" }
  if n.contains("ikindi") || n.contains("asr") { return "ikindi" }
  if n.contains("akşam") || n.contains("aksam") || n.contains("maghrib") { return "aksam" }
  if n.contains("yatsı") || n.contains("yatsi") || n.contains("isha") { return "yatsi" }
  return "ogle"
}

// MARK: - Small Widget

struct PrayerTimesSmallView: View {
  let entry: PrayerTimesEntry
  private var t: SalahTheme { entry.theme }

  private var endDate: Date? {
    guard let d = entry.data, d.endTimeMs > 0 else { return nil }
    return Date(timeIntervalSince1970: d.endTimeMs / 1000)
  }

  private var prayerKey: String {
    prayerKeyFromName(entry.data?.prayerName ?? "")
  }
  private var gradient: PrayerGradient { prayerGradient(for: prayerKey) }
  private var iconName: String { prayerCompletedIcon(for: prayerKey) }

  var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      // Üst: vakit ikonu + Salah etiketi
      HStack(spacing: 6) {
        ZStack {
          // Dark için ikon arkası glow
          if t == .dark {
            Circle()
              .fill(gradient.glow.opacity(0.45))
              .frame(width: 26, height: 26)
              .blur(radius: 6)
          }
          Image(systemName: iconName)
            .font(.system(size: 14, weight: .bold))
            .foregroundStyle(gradient.linear)
            .shadow(color: gradient.base.opacity(t == .light ? 0.55 : 0.35), radius: 4, x: 0, y: 1)
        }
        .frame(width: 22, height: 22)

        Text("VAKİT")
          .font(.system(size: 10, weight: .black))
          .foregroundColor(t.textSecondary)
          .tracking(0.7)
        Spacer()
      }

      Spacer(minLength: 6)

      // Vakit adı — büyük neon gradient
      Text(entry.data?.prayerName ?? "--")
        .font(.system(size: 26, weight: .heavy, design: .rounded))
        .foregroundStyle(gradient.linear)
        .shadow(color: gradient.base.opacity(t == .light ? 0.40 : 0.0), radius: 5, x: 0, y: 1)
        .minimumScaleFactor(0.7)
        .lineLimit(1)

      // Sayaç
      if let end = endDate {
        Text(timerInterval: Date.now...end, pauseTime: nil)
          .font(.system(size: 16, weight: .bold, design: .rounded).monospacedDigit())
          .foregroundColor(t.textPrimary)
          .lineLimit(1)
          .minimumScaleFactor(0.7)
      } else {
        Text("--:--:--")
          .font(.system(size: 16, weight: .bold, design: .rounded).monospacedDigit())
          .foregroundColor(t.textSecondary)
      }

      Spacer()

      // Sonraki vakit chip
      nextPrayerChip
    }
    .padding(14)
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
  }

  @ViewBuilder
  private var nextPrayerChip: some View {
    let nextKey = prayerKeyFromName(entry.data?.nextPrayer ?? "")
    let nextGrad = prayerGradient(for: nextKey)
    HStack(spacing: 5) {
      Image(systemName: "arrow.right")
        .font(.system(size: 9, weight: .bold))
        .foregroundColor(nextGrad.glow.opacity(t == .light ? 0.85 : 0.75))
      Text(entry.data?.nextPrayer ?? "--")
        .font(.system(size: 11, weight: .bold))
        .foregroundColor(nextGrad.glow.opacity(t == .light ? 0.85 : 0.80))
        .lineLimit(1)
    }
    .padding(.horizontal, 8)
    .padding(.vertical, 4)
    .background(
      Capsule()
        .fill(nextGrad.base.opacity(t == .light ? 0.10 : 0.18))
    )
    .overlay(
      Capsule()
        .strokeBorder(nextGrad.glow.opacity(t == .light ? 0.35 : 0.30), lineWidth: 0.8)
    )
  }
}

// MARK: - Medium Widget

struct PrayerTimesMediumView: View {
  let entry: PrayerTimesEntry
  private var t: SalahTheme { entry.theme }

  private var endDate: Date? {
    guard let d = entry.data, d.endTimeMs > 0 else { return nil }
    return Date(timeIntervalSince1970: d.endTimeMs / 1000)
  }

  private var prayerKey: String {
    prayerKeyFromName(entry.data?.prayerName ?? "")
  }
  private var gradient: PrayerGradient { prayerGradient(for: prayerKey) }
  private var iconName: String { prayerCompletedIcon(for: prayerKey) }

  var body: some View {
    HStack(spacing: 16) {
      // Sol: büyük vakit ikonu - premium glow ile
      ZStack {
        if t == .dark {
          RoundedRectangle(cornerRadius: 18, style: .continuous)
            .fill(gradient.glow.opacity(0.55))
            .frame(width: 76, height: 76)
            .blur(radius: 12)
            .offset(y: 3)
        }
        RoundedRectangle(cornerRadius: 18, style: .continuous)
          .fill(gradient.linear)
          .frame(width: 76, height: 76)
          .shadow(
            color: gradient.base.opacity(t == .light ? 0.55 : 0.0),
            radius: 10, x: 0, y: 4
          )

        if t == .dark {
          RoundedRectangle(cornerRadius: 18, style: .continuous)
            .fill(
              LinearGradient(
                colors: [Color.white.opacity(0.22), Color.white.opacity(0)],
                startPoint: .top, endPoint: .center
              )
            )
            .frame(width: 76, height: 76)
            .allowsHitTesting(false)
          RoundedRectangle(cornerRadius: 18, style: .continuous)
            .strokeBorder(Color.white.opacity(0.14), lineWidth: 0.8)
            .frame(width: 76, height: 76)
        }

        Image(systemName: iconName)
          .font(.system(size: 32, weight: .semibold))
          .foregroundColor(.white)
          .shadow(color: gradient.base.opacity(0.85), radius: 4, x: 0, y: 1)
          .shadow(color: gradient.glow.opacity(0.55), radius: 9, x: 0, y: 0)
      }

      // Sağ: metin hierarchy
      VStack(alignment: .leading, spacing: 4) {
        Text("SONRAKİ NAMAZ")
          .font(.system(size: 10, weight: .black))
          .foregroundColor(t.textSecondary)
          .tracking(0.7)

        Text(entry.data?.prayerName ?? "--")
          .font(.system(size: 28, weight: .heavy, design: .rounded))
          .foregroundStyle(gradient.linear)
          .shadow(color: gradient.base.opacity(t == .light ? 0.40 : 0.0), radius: 5, x: 0, y: 1)
          .minimumScaleFactor(0.7)
          .lineLimit(1)

        if let end = endDate {
          Text(timerInterval: Date.now...end, pauseTime: nil)
            .font(.system(size: 18, weight: .bold, design: .rounded).monospacedDigit())
            .foregroundColor(t.textPrimary)
            .lineLimit(1)
            .minimumScaleFactor(0.7)
        }

        Spacer(minLength: 4)

        nextPrayerChip
      }
      Spacer(minLength: 0)
    }
    .padding(16)
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
  }

  @ViewBuilder
  private var nextPrayerChip: some View {
    let nextKey = prayerKeyFromName(entry.data?.nextPrayer ?? "")
    let nextGrad = prayerGradient(for: nextKey)
    HStack(spacing: 5) {
      Image(systemName: "arrow.right")
        .font(.system(size: 10, weight: .bold))
        .foregroundColor(nextGrad.glow.opacity(t == .light ? 0.85 : 0.75))
      Text(entry.data?.nextPrayer ?? "--")
        .font(.system(size: 12, weight: .bold))
        .foregroundColor(nextGrad.glow.opacity(t == .light ? 0.90 : 0.85))
        .lineLimit(1)
    }
    .padding(.horizontal, 10)
    .padding(.vertical, 5)
    .background(
      Capsule()
        .fill(nextGrad.base.opacity(t == .light ? 0.10 : 0.18))
    )
    .overlay(
      Capsule()
        .strokeBorder(nextGrad.glow.opacity(t == .light ? 0.40 : 0.30), lineWidth: 0.8)
    )
  }
}

// MARK: - Entry View

struct PrayerTimesWidgetEntryView: View {
  @Environment(\.widgetFamily) var family
  let entry: PrayerTimesEntry

  var body: some View {
    switch family {
    case .systemSmall:
      PrayerTimesSmallView(entry: entry)
    default:
      PrayerTimesMediumView(entry: entry)
    }
  }
}

// MARK: - Widget Definitions (Light + Dark)

struct PrayerTimesWidget: Widget {
  let kind = "SalahPrayerTimesWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: PrayerTimesProvider(theme: .dark)) { entry in
      PrayerTimesWidgetEntryView(entry: entry)
        .salahWidgetBackground(entry.theme)
        .widgetURL(URL(string: "salah://home"))
    }
    .configurationDisplayName("Namaz Vakitleri")
    .description("Sonraki namaz vakti — koyu tema.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}

struct PrayerTimesLightWidget: Widget {
  let kind = "SalahPrayerTimesWidgetLight"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: PrayerTimesProvider(theme: .light)) { entry in
      PrayerTimesWidgetEntryView(entry: entry)
        .salahWidgetBackground(entry.theme)
        .widgetURL(URL(string: "salah://home"))
    }
    .configurationDisplayName("Namaz Vakitleri (Açık)")
    .description("Sonraki namaz vakti — açık tema.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}