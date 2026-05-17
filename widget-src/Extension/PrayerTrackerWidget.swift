import AppIntents
import SwiftUI
import WidgetKit

// MARK: - Entry & Provider

struct PrayerTrackerEntry: TimelineEntry {
  let date: Date
  let tracker: TrackerData?
  let widget: WidgetData?
  let theme: SalahTheme
}

struct PrayerTrackerProvider: TimelineProvider {
  let theme: SalahTheme

  func placeholder(in _: Context) -> PrayerTrackerEntry {
    PrayerTrackerEntry(date: Date(), tracker: nil, widget: nil, theme: theme)
  }
  func getSnapshot(in _: Context, completion: @escaping (PrayerTrackerEntry) -> Void) {
    completion(PrayerTrackerEntry(date: Date(), tracker: TrackerData.load(), widget: WidgetData.load(), theme: theme))
  }
  func getTimeline(in _: Context, completion: @escaping (Timeline<PrayerTrackerEntry>) -> Void) {
    let entry = PrayerTrackerEntry(date: Date(), tracker: TrackerData.load(), widget: WidgetData.load(), theme: theme)
    let next = Calendar.current.date(byAdding: .minute, value: 1, to: Date())!
    completion(Timeline(entries: [entry], policy: .after(next)))
  }
}

// MARK: - Prayer Definitions

struct PrayerInfo {
  let id: String
  let label: String
  let timeKey: String
}

let allPrayers: [PrayerInfo] = [
  PrayerInfo(id: "sabah",  label: "Sabah",  timeKey: "imsak"),
  PrayerInfo(id: "ogle",   label: "Öğle",   timeKey: "ogle"),
  PrayerInfo(id: "ikindi", label: "İkindi", timeKey: "ikindi"),
  PrayerInfo(id: "aksam",  label: "Akşam",  timeKey: "aksam"),
  PrayerInfo(id: "yatsi",  label: "Yatsı",  timeKey: "yatsi"),
]

func isPrayerAvailable(_ p: PrayerInfo, widget: WidgetData?) -> Bool {
  guard let w = widget else { return false }
  let timeStr: String
  switch p.timeKey {
  case "imsak":  timeStr = w.imsak
  case "ogle":   timeStr = w.ogle
  case "ikindi": timeStr = w.ikindi
  case "aksam":  timeStr = w.aksam
  case "yatsi":  timeStr = w.yatsi
  default: return false
  }
  guard !timeStr.isEmpty else { return false }
  let parts = timeStr.split(separator: ":").compactMap { Int($0) }
  guard parts.count >= 2 else { return false }
  let now = Calendar.current.dateComponents([.hour, .minute], from: Date())
  let pMin = parts[0] * 60 + parts[1]
  let nowMin = (now.hour ?? 0) * 60 + (now.minute ?? 0)
  return nowMin >= pMin
}

// MARK: - Small Widget View

struct PrayerTrackerSmallView: View {
  let entry: PrayerTrackerEntry
  private var t: SalahTheme { entry.theme }
  private var completed: [String] { entry.tracker?.completedPrayers ?? [] }
  private var count: Int {
    allPrayers.filter { isPrayerCompleted($0.id, in: completed) }.count
  }

  var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      HStack(spacing: 4) {
        Image(systemName: "checkmark.circle.fill")
          .foregroundColor(.salahTeal)
          .font(.system(size: 14, weight: .bold))
        Text("Namaz")
          .font(.system(size: 13, weight: .bold))
          .foregroundColor(t.textPrimary)
      }
      Spacer()
      HStack {
        Spacer()
        ZStack {
          Circle()
            .stroke(t.ringTrack, lineWidth: 6)
          Circle()
            .trim(from: 0, to: CGFloat(count) / 5.0)
            .stroke(Color.salahTeal, style: StrokeStyle(lineWidth: 6, lineCap: .round))
            .rotationEffect(.degrees(-90))
          VStack(spacing: -2) {
            Text("\(count)")
              .font(.system(size: 26, weight: .bold))
              .foregroundColor(.salahTeal)
            Text("/ 5")
              .font(.system(size: 12, weight: .semibold))
              .foregroundColor(t.textSecondary)
          }
        }
        .frame(width: 70, height: 70)
        Spacer()
      }
      Spacer()
      HStack(spacing: 8) {
        ForEach(allPrayers, id: \.id) { p in
          let done = isPrayerCompleted(p.id, in: completed)
          Circle()
            .fill(done ? prayerColor(for: p.id) : t.dotInactive)
            .frame(width: 9, height: 9)
        }
      }
    }
    .padding(14)
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
  }
}

// MARK: - Prayer Circle (Medium Widget)

struct PrayerCircleView: View {
  let prayer: PrayerInfo
  let isDone: Bool
  let isAvailable: Bool
  let theme: SalahTheme

  var body: some View {
    let color = prayerColor(for: prayer.id)

    if #available(iOS 17.0, *) {
      Button(intent: MarkPrayerIntent(prayerId: prayer.id)) {
        circleContent(color: color)
      }
      .buttonStyle(.plain)
      .disabled(isDone || !isAvailable)
    } else {
      Link(destination: URL(string: "salah://home")!) {
        circleContent(color: color)
      }
      .disabled(isDone || !isAvailable)
    }
  }

  @ViewBuilder
  private func circleContent(color: Color) -> some View {
    VStack(spacing: 5) {
      ZStack {
        if isDone {
          // Tamamlanmış — renkli dolu daire + beyaz checkmark
          Circle()
            .fill(color)
            .frame(width: 44, height: 44)
          Image(systemName: "checkmark")
            .font(.system(size: 18, weight: .bold))
            .foregroundColor(.white)
        } else if !isAvailable {
          // Kilitli — silik daire
          Circle()
            .fill(theme.subtleBg)
            .frame(width: 44, height: 44)
          Image(systemName: "lock.fill")
            .font(.system(size: 14, weight: .medium))
            .foregroundColor(theme.dotInactive)
        } else {
          // Müsait — boş stroke daire
          Circle()
            .strokeBorder(color.opacity(0.4), lineWidth: 2)
            .background(Circle().fill(color.opacity(0.08)))
            .frame(width: 44, height: 44)
        }
      }
      Text(prayer.label)
        .font(.system(size: 10, weight: .bold))
        .foregroundColor(isDone ? color : theme.textSecondary)
    }
  }
}

// MARK: - Medium Widget View

struct PrayerTrackerMediumView: View {
  let entry: PrayerTrackerEntry
  private var t: SalahTheme { entry.theme }
  private var completed: [String] { entry.tracker?.completedPrayers ?? [] }
  private var count: Int {
    allPrayers.filter { isPrayerCompleted($0.id, in: completed) }.count
  }

  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      // Header row
      HStack(alignment: .center) {
        VStack(alignment: .leading, spacing: 2) {
          Text("GÜNLÜK NAMAZ TAKİBİ")
            .font(.system(size: 10, weight: .heavy))
            .foregroundColor(t.textSecondary)
            .tracking(0.5)
          HStack(alignment: .firstTextBaseline, spacing: 2) {
            Text("\(count)")
              .font(.system(size: 26, weight: .heavy))
              .foregroundColor(t.textPrimary)
            Text("/ 5 tamamlandı")
              .font(.system(size: 12, weight: .medium))
              .foregroundColor(t.textSecondary)
          }
        }
        Spacer()
        ZStack {
          Circle()
            .stroke(t.ringTrack, lineWidth: 3.5)
          Circle()
            .trim(from: 0, to: CGFloat(count) / 5.0)
            .stroke(Color.salahTeal, style: StrokeStyle(lineWidth: 3.5, lineCap: .round))
            .rotationEffect(.degrees(-90))
        }
        .frame(width: 34, height: 34)
      }
      // Prayer circles
      HStack(spacing: 0) {
        ForEach(allPrayers, id: \.id) { prayer in
          let done = isPrayerCompleted(prayer.id, in: completed)
          let available = isPrayerAvailable(prayer, widget: entry.widget)
          PrayerCircleView(
            prayer: prayer,
            isDone: done,
            isAvailable: available,
            theme: t
          )
          .frame(maxWidth: .infinity)
        }
      }
    }
    .padding(14)
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
  }
}

// MARK: - Entry View

struct PrayerTrackerWidgetEntryView: View {
  @Environment(\.widgetFamily) var family
  let entry: PrayerTrackerEntry

  var body: some View {
    switch family {
    case .systemSmall:
      PrayerTrackerSmallView(entry: entry)
    default:
      PrayerTrackerMediumView(entry: entry)
    }
  }
}

// MARK: - Widget Definitions (Light + Dark)

struct PrayerTrackerWidget: Widget {
  let kind = "SalahTrackerWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: PrayerTrackerProvider(theme: .dark)) { entry in
      PrayerTrackerWidgetEntryView(entry: entry)
        .salahWidgetBackground(entry.theme)
        .widgetURL(URL(string: "salah://home"))
    }
    .configurationDisplayName("Namaz Takibi")
    .description("Günlük namaz takip durumu — koyu tema.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}

struct PrayerTrackerLightWidget: Widget {
  let kind = "SalahTrackerWidgetLight"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: PrayerTrackerProvider(theme: .light)) { entry in
      PrayerTrackerWidgetEntryView(entry: entry)
        .salahWidgetBackground(entry.theme)
        .widgetURL(URL(string: "salah://home"))
    }
    .configurationDisplayName("Namaz Takibi (Açık)")
    .description("Günlük namaz takip durumu — açık tema.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}
