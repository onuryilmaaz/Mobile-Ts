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

// MARK: - Premium Progress Ring (daha güçlü neon glow)

struct PremiumRing: View {
  let progress: CGFloat
  let lineWidth: CGFloat
  let isKaza: Bool
  let trackColor: Color

  var body: some View {
    ZStack {
      Circle()
        .stroke(trackColor, style: StrokeStyle(lineWidth: lineWidth, lineCap: .round))

      // Dış neon halka
      Circle()
        .trim(from: 0, to: progress)
        .stroke(
          (isKaza ? Color(red: 1.0, green: 0.55, blue: 0.10) : Color(red: 0.10, green: 0.95, blue: 0.82)).opacity(0.55),
          style: StrokeStyle(lineWidth: lineWidth + 6, lineCap: .round)
        )
        .blur(radius: 6)
        .rotationEffect(.degrees(-90))

      Circle()
        .trim(from: 0, to: progress)
        .stroke(
          isKaza ? AngularGradient.salahKazaRing : AngularGradient.salahRing,
          style: StrokeStyle(lineWidth: lineWidth, lineCap: .round)
        )
        .rotationEffect(.degrees(-90))
    }
  }
}

// MARK: - Small Widget View

struct PrayerTrackerSmallView: View {
  let entry: PrayerTrackerEntry
  private var t: SalahTheme { entry.theme }
  private var completed: [String] { entry.tracker?.completedPrayers ?? [] }
  private var count: Int {
    allPrayers.filter { isPrayerCompleted($0.id, in: completed) }.count
  }

  private var hasKaza: Bool {
    completed.contains { isPrayerKaza($0, in: entry.tracker?.kazaPrayers ?? []) }
  }

  var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      HStack(spacing: 6) {
        Image(systemName: "checkmark.seal.fill")
          .foregroundStyle(
            LinearGradient(
              colors: hasKaza
                ? [Color(red: 1.00, green: 0.78, blue: 0.20), Color(red: 1.00, green: 0.42, blue: 0.00)]
                : [Color(red: 0.30, green: 1.00, blue: 0.85), Color(red: 0.00, green: 0.78, blue: 0.70)],
              startPoint: .topLeading,
              endPoint: .bottomTrailing
            )
          )
          .font(.system(size: 15, weight: .bold))
        Text("Namaz")
          .font(.system(size: 13, weight: .bold))
          .foregroundColor(t.textPrimary)
        Spacer()
      }
      Spacer()
      HStack {
        Spacer()
        ZStack {
          PremiumRing(
            progress: CGFloat(count) / 5.0,
            lineWidth: 5.5,
            isKaza: hasKaza,
            trackColor: t.ringTrack
          )
          VStack(spacing: -2) {
            Text("\(count)")
              .font(.system(size: 28, weight: .heavy, design: .rounded))
              .foregroundColor(t.textPrimary)
            Text("/ 5")
              .font(.system(size: 12, weight: .semibold))
              .foregroundColor(t.textSecondary)
          }
        }
        .frame(width: 72, height: 72)
        Spacer()
      }
      Spacer()
      HStack(spacing: 8) {
        ForEach(allPrayers, id: \.id) { p in
          let done = isPrayerCompleted(p.id, in: completed)
          let kaza = done && isPrayerKaza(p.id, in: entry.tracker?.kazaPrayers ?? [])
          if done && kaza {
            Circle()
              .fill(kazaGradient().linear)
              .frame(width: 10, height: 10)
              .shadow(color: kazaGradient().glow.opacity(t == .light ? 0.6 : 0.0), radius: 3)
          } else if done {
            let g = prayerGradient(for: p.id)
            Circle()
              .fill(g.linear)
              .frame(width: 10, height: 10)
              .shadow(color: g.glow.opacity(t == .light ? 0.6 : 0.0), radius: 3)
          } else {
            Circle()
              .fill(t.dotInactive)
              .frame(width: 10, height: 10)
          }
        }
      }
    }
    .padding(16)
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
  }
}

// MARK: - Prayer Tile (Neon Premium)

struct PrayerCircleView: View {
  let prayer: PrayerInfo
  let isDone: Bool
  let isAvailable: Bool
  let isKaza: Bool
  let theme: SalahTheme

  var body: some View {
    if #available(iOS 17.0, *) {
      Button(intent: MarkPrayerIntent(prayerId: prayer.id)) {
        tileContent
      }
      .buttonStyle(.plain)
      .disabled(isDone || !isAvailable)
    } else {
      Link(destination: URL(string: "salah://home")!) {
        tileContent
      }
      .disabled(isDone || !isAvailable)
    }
  }

  @ViewBuilder
  private var tileContent: some View {
    let gradient: PrayerGradient = isKaza ? kazaGradient() : prayerGradient(for: prayer.id)
    let iconName = isKaza ? "exclamationmark.arrow.circlepath" : prayerCompletedIcon(for: prayer.id)

    VStack(spacing: 7) {
      ZStack {
        if isDone {
          // Dark için güçlü blur glow — tile'ın etrafında belirgin neon hale
          if theme == .dark {
            RoundedRectangle(cornerRadius: 14, style: .continuous)
              .fill(gradient.glow.opacity(0.65))
              .frame(width: 52, height: 52)
              .blur(radius: 10)
              .offset(y: 2)
          }

          // Ana doygun gradient body
          RoundedRectangle(cornerRadius: 14, style: .continuous)
            .fill(gradient.linear)
            .frame(width: 50, height: 50)
            .shadow(
              color: gradient.base.opacity(theme.tileShadowOpacity),
              radius: theme.tileShadowRadius,
              x: 0,
              y: 4
            )

          // Üst parlaklık — sadece dark'ta, light'ta beyazlık rengi yıkıyordu
          if theme == .dark {
            RoundedRectangle(cornerRadius: 14, style: .continuous)
              .fill(
                LinearGradient(
                  colors: [Color.white.opacity(0.22), Color.white.opacity(0)],
                  startPoint: .top,
                  endPoint: .center
                )
              )
              .frame(width: 50, height: 50)
              .allowsHitTesting(false)

            // İnce çerçeve — sadece dark'ta cam efekti için
            RoundedRectangle(cornerRadius: 14, style: .continuous)
              .strokeBorder(Color.white.opacity(0.14), lineWidth: 0.8)
              .frame(width: 50, height: 50)
          }

          // İkon — güçlü renkli shadow ile parlama
          Image(systemName: iconName)
            .font(.system(size: 19, weight: .semibold))
            .foregroundColor(.white)
            .shadow(color: gradient.base.opacity(0.85), radius: 4, x: 0, y: 1)
            .shadow(color: gradient.glow.opacity(0.55), radius: 8, x: 0, y: 0)
        } else if !isAvailable {
          RoundedRectangle(cornerRadius: 14, style: .continuous)
            .fill(theme.subtleBg)
            .frame(width: 50, height: 50)
          RoundedRectangle(cornerRadius: 14, style: .continuous)
            .strokeBorder(theme.subtleBorder, lineWidth: 0.8)
            .frame(width: 50, height: 50)
          Image(systemName: "lock.fill")
            .font(.system(size: 13, weight: .semibold))
            .foregroundColor(theme.dotInactive)
        } else {
          // Available — boş slot, sadece renkli outline ile vakit belirtilir
          // Done ile arasında dramatik kontrast olsun diye zemin nötr
          RoundedRectangle(cornerRadius: 14, style: .continuous)
            .fill(theme.subtleBg)
            .frame(width: 50, height: 50)
          RoundedRectangle(cornerRadius: 14, style: .continuous)
            .strokeBorder(
              gradient.glow.opacity(theme == .light ? 0.45 : 0.40),
              style: StrokeStyle(lineWidth: 1.2, dash: [3, 2.5])
            )
            .frame(width: 50, height: 50)
          Image(systemName: "plus")
            .font(.system(size: 16, weight: .bold))
            .foregroundColor(gradient.glow.opacity(theme == .light ? 0.75 : 0.65))
        }
      }
      Text(prayer.label)
        .font(.system(size: 11, weight: .bold))
        .foregroundColor(isDone ? gradient.glow : theme.textSecondary)
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

  private var hasKaza: Bool {
    completed.contains { isPrayerKaza($0, in: entry.tracker?.kazaPrayers ?? []) }
  }

  var body: some View {
    VStack(alignment: .leading, spacing: 14) {
      HStack(alignment: .center) {
        VStack(alignment: .leading, spacing: 4) {
          Text("GÜNLÜK NAMAZ TAKİBİ")
            .font(.system(size: 10, weight: .black))
            .foregroundColor(t.textSecondary)
            .tracking(0.7)
          HStack(alignment: .firstTextBaseline, spacing: 4) {
            Text("\(count)")
              .font(.system(size: 28, weight: .heavy, design: .rounded))
              .foregroundColor(t.textPrimary)
            Text("/ 5 tamamlandı")
              .font(.system(size: 12, weight: .bold))
              .foregroundColor(t.textSecondary)
          }
        }
        Spacer()
        PremiumRing(
          progress: CGFloat(count) / 5.0,
          lineWidth: 3.5,
          isKaza: hasKaza,
          trackColor: t.ringTrack
        )
        .frame(width: 34, height: 34)
      }

      HStack(spacing: 0) {
        ForEach(allPrayers, id: \.id) { prayer in
          let done = isPrayerCompleted(prayer.id, in: completed)
          let isKaza = isPrayerKaza(prayer.id, in: entry.tracker?.kazaPrayers ?? [])
          let available = isPrayerAvailable(prayer, widget: entry.widget)
          PrayerCircleView(
            prayer: prayer,
            isDone: done,
            isAvailable: available,
            isKaza: isKaza,
            theme: t
          )
          .frame(maxWidth: .infinity)
        }
      }
    }
    .padding(16)
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

// MARK: - Widget Definitions

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