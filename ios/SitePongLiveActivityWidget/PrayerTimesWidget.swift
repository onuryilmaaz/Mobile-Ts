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

// MARK: - Small Widget

struct PrayerTimesSmallView: View {
  let entry: PrayerTimesEntry
  private var t: SalahTheme { entry.theme }

  private var endDate: Date? {
    guard let d = entry.data, d.endTimeMs > 0 else { return nil }
    return Date(timeIntervalSince1970: d.endTimeMs / 1000)
  }

  var body: some View {
    VStack(alignment: .leading, spacing: 4) {
      Text("Salah")
        .font(.system(size: 10, weight: .heavy))
        .foregroundColor(t.textSecondary)
        .tracking(0.5)

      Text(entry.data?.prayerName ?? "--")
        .font(.system(size: 20, weight: .bold))
        .foregroundColor(.salahTeal)
        .minimumScaleFactor(0.7)

      if let end = endDate {
        Text(timerInterval: Date.now...end, pauseTime: nil)
          .font(.system(size: 16, weight: .medium).monospacedDigit())
          .foregroundColor(t.textPrimary)
      } else {
        Text("--:--:--")
          .font(.system(size: 16, weight: .medium).monospacedDigit())
          .foregroundColor(t.textSecondary)
      }

      Spacer()

      HStack(spacing: 2) {
        Text("→")
          .font(.system(size: 10))
          .foregroundColor(t.textSecondary)
        Text(entry.data?.nextPrayer ?? "--")
          .font(.system(size: 10, weight: .medium))
          .foregroundColor(t.textSecondary)
      }
    }
    .padding(12)
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
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

  var body: some View {
    HStack {
      VStack(alignment: .leading, spacing: 4) {
        HStack(spacing: 4) {
          Image(systemName: "moon.stars.fill")
            .font(.system(size: 11))
            .foregroundColor(t.textSecondary)
          Text("Sonraki Namaz")
            .font(.system(size: 10, weight: .heavy))
            .foregroundColor(t.textSecondary)
            .tracking(0.3)
        }

        Text(entry.data?.prayerName ?? "--")
          .font(.system(size: 24, weight: .bold))
          .foregroundColor(.salahTeal)
          .minimumScaleFactor(0.6)

        if let end = endDate {
          Text(timerInterval: Date.now...end, pauseTime: nil)
            .font(.system(size: 16, weight: .medium).monospacedDigit())
            .foregroundColor(t.textPrimary)
        }

        Spacer()

        HStack(spacing: 2) {
          Text("→")
            .font(.system(size: 10))
            .foregroundColor(t.textSecondary)
          Text(entry.data?.nextPrayer ?? "--")
            .font(.system(size: 10, weight: .medium))
            .foregroundColor(t.textSecondary)
        }
      }
      Spacer()
    }
    .padding(14)
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
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
