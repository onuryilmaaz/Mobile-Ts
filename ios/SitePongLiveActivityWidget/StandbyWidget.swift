import SwiftUI
import WidgetKit

// MARK: - Entry & Provider

struct StandbyEntry: TimelineEntry {
  let date: Date
  let data: WidgetData?
}

struct StandbyProvider: TimelineProvider {
  func placeholder(in _: Context) -> StandbyEntry {
    StandbyEntry(date: Date(), data: nil)
  }
  func getSnapshot(in _: Context, completion: @escaping (StandbyEntry) -> Void) {
    completion(StandbyEntry(date: Date(), data: WidgetData.load()))
  }
  func getTimeline(in _: Context, completion: @escaping (Timeline<StandbyEntry>) -> Void) {
    let now = Date()
    let data = WidgetData.load()
    let nextChange = computeNextPrayer(data: data, at: now)?.endDate
      ?? Calendar.current.date(byAdding: .minute, value: 15, to: now)!
    completion(Timeline(
      entries: [StandbyEntry(date: now, data: data)],
      policy: .after(nextChange),
    ))
  }
}

// MARK: - Standby System Small (big clock-style)

// iOS 16 fallback: containerBackground iOS 17+ only
extension View {
  @ViewBuilder
  func standbyBackground() -> some View {
    if #available(iOS 17.0, *) {
      self.containerBackground(for: .widget) {
        LinearGradient(
          colors: [Color.salahTealDark, Color(red: 0.02, green: 0.06, blue: 0.18)],
          startPoint: .topLeading, endPoint: .bottomTrailing
        )
      }
    } else {
      self.background(
        LinearGradient(
          colors: [Color.salahTealDark, Color(red: 0.02, green: 0.06, blue: 0.18)],
          startPoint: .topLeading, endPoint: .bottomTrailing
        )
      )
    }
  }

  @ViewBuilder
  func standbyAccessoryBackground() -> some View {
    if #available(iOS 17.0, *) {
      self.containerBackground(for: .widget) { Color.clear }
    } else {
      ZStack {
        AccessoryWidgetBackground()
        self
      }
    }
  }
}

struct StandbySystemSmallView: View {
  let entry: StandbyEntry

  private var state: ComputedPrayerState? { computeNextPrayer(data: entry.data, at: entry.date) }

  var body: some View {
    Group {
      if let s = state {
        VStack(alignment: .leading, spacing: 0) {
          Text(s.prayerName.uppercased())
            .font(.system(size: 11, weight: .black, design: .rounded))
            .foregroundColor(.white.opacity(0.7))
            .tracking(1.2)

          Spacer(minLength: 4)

          Text(s.endDate, style: .timer)
            .font(.system(size: 48, weight: .heavy, design: .rounded))
            .foregroundColor(.white)
            .minimumScaleFactor(0.4)
            .lineLimit(1)
            .monospacedDigit()

          Spacer(minLength: 4)

          HStack {
            Text(s.prayerTime)
              .font(.system(size: 16, weight: .bold, design: .rounded))
              .foregroundColor(.white.opacity(0.85))
            Spacer()
            Text("›  " + s.nextPrayer)
              .font(.system(size: 11, weight: .semibold))
              .foregroundColor(.white.opacity(0.55))
          }
        }
        .padding(14)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
      } else {
        Text("Vakit bekleniyor")
          .font(.system(size: 13, weight: .semibold))
          .foregroundColor(.white.opacity(0.6))
          .padding(14)
          .frame(maxWidth: .infinity, maxHeight: .infinity)
      }
    }
    .standbyBackground()
  }
}

// MARK: - Standby Accessory (Lock screen rectangular, also visible in Standby)

struct StandbyAccessoryRectView: View {
  let entry: StandbyEntry
  private var state: ComputedPrayerState? { computeNextPrayer(data: entry.data, at: entry.date) }

  var body: some View {
    Group {
      if let s = state {
        VStack(alignment: .leading, spacing: 1) {
          HStack(spacing: 4) {
            Image(systemName: "moon.stars.fill")
              .font(.system(size: 10, weight: .semibold))
            Text(s.prayerName)
              .font(.system(size: 13, weight: .heavy))
          }
          Text(s.endDate, style: .timer)
            .font(.system(size: 22, weight: .heavy, design: .rounded))
            .minimumScaleFactor(0.5)
            .lineLimit(1)
            .monospacedDigit()
          Text("\(s.prayerTime) · sonra \(s.nextPrayer)")
            .font(.system(size: 10, weight: .medium))
            .opacity(0.7)
        }
      } else {
        Text("Vakit yok")
          .font(.system(size: 12, weight: .semibold))
      }
    }
    .standbyAccessoryBackground()
  }
}

// MARK: - Entry View

struct StandbyWidgetEntryView: View {
  @Environment(\.widgetFamily) var family
  let entry: StandbyEntry
  var body: some View {
    switch family {
    case .accessoryRectangular:
      StandbyAccessoryRectView(entry: entry)
    default:
      StandbySystemSmallView(entry: entry)
    }
  }
}

// MARK: - Widget Definition

struct StandbyPrayerWidget: Widget {
  let kind = "SalahStandbyPrayerWidget"
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: StandbyProvider()) { entry in
      StandbyWidgetEntryView(entry: entry)
        .widgetURL(URL(string: "salah://home"))
    }
    .configurationDisplayName("Salah · Standby")
    .description("Standby modu için büyük namaz vakti sayacı. iPhone şarjda ve yatay duruyorken görünür.")
    .supportedFamilies([.systemSmall, .accessoryRectangular])
  }
}
