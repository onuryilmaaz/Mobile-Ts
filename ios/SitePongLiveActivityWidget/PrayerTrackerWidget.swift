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
    let widget = WidgetData.load()
    let tracker = TrackerData.load()
    let cal = Calendar.current
    let now = Date()
    var entries: [PrayerTrackerEntry] = [PrayerTrackerEntry(date: now, tracker: tracker, widget: widget, theme: theme)]

    for timeStr in [widget?.imsak, widget?.gunes, widget?.ogle, widget?.ikindi, widget?.aksam, widget?.yatsi].compactMap({ $0 }) {
      let parts = timeStr.split(separator: ":").compactMap { Int($0) }
      guard parts.count >= 2 else { continue }
      var c = cal.dateComponents([.year, .month, .day], from: now)
      c.hour = parts[0]; c.minute = parts[1]; c.second = 1
      if let d = cal.date(from: c), d > now {
        entries.append(PrayerTrackerEntry(date: d, tracker: tracker, widget: widget, theme: theme))
      }
    }

    let midnight = cal.startOfDay(for: cal.date(byAdding: .day, value: 1, to: now)!)
    completion(Timeline(entries: entries, policy: .after(midnight)))
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

// MARK: - Progress Ring

struct PremiumRing: View {
  let progress: CGFloat
  let lineWidth: CGFloat
  let isKaza: Bool
  let trackColor: Color

  var body: some View {
    ZStack {
      Circle()
        .stroke(trackColor, style: StrokeStyle(lineWidth: lineWidth, lineCap: .round))

      Circle()
        .trim(from: 0, to: progress)
        .stroke(
          isKaza ? AngularGradient.salahKazaRing : AngularGradient.salahRing,
          style: StrokeStyle(lineWidth: lineWidth, lineCap: .round)
        )
        .rotationEffect(.degrees(-90))
        .shadow(
          color: (isKaza ? Color.salahAmber : Color.salahTeal).opacity(0.42),
          radius: 4
        )
    }
  }
}

// MARK: - Small Widget

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
  private var allDone: Bool { count == 5 }

  var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      // Header
      HStack(spacing: 5) {
        ZStack {
          if t == .dark {
            Circle()
              .fill((hasKaza ? Color.salahAmber : Color.salahTeal).opacity(0.35))
              .frame(width: 22, height: 22)
              .blur(radius: 6)
          }
          Image(systemName: allDone ? "checkmark.seal.fill" : "seal")
            .font(.system(size: 13, weight: .semibold))
            .foregroundStyle(
              hasKaza
                ? LinearGradient(colors: [Color.salahAmber, Color.salahAmber.opacity(0.7)], startPoint: .top, endPoint: .bottom)
                : LinearGradient(colors: [Color.salahTeal, Color.salahTealDark], startPoint: .topLeading, endPoint: .bottomTrailing)
            )
            .shadow(color: (hasKaza ? Color.salahAmber : Color.salahTeal).opacity(t == .light ? 0.45 : 0.0), radius: 3)
        }
        .frame(width: 18, height: 18)

        Text("NAMAZ")
          .font(.system(size: 11, weight: .black))
          .foregroundColor(t.textPrimary)
          .tracking(0.5)
        Spacer()
      }

      Spacer()

      // Ring + Count
      HStack {
        Spacer()
        ZStack {
          PremiumRing(
            progress: CGFloat(count) / 5.0,
            lineWidth: 5.5,
            isKaza: hasKaza,
            trackColor: t.ringTrack
          )
          VStack(spacing: -1) {
            Text("\(count)")
              .font(.system(size: 30, weight: .heavy, design: .rounded))
              .foregroundColor(t.textPrimary)
            Text("/ 5")
              .font(.system(size: 11, weight: .bold))
              .foregroundColor(t.textSecondary)
          }
        }
        .frame(width: 76, height: 76)
        Spacer()
      }

      Spacer()

      // Prayer indicator pills
      HStack(spacing: 6) {
        ForEach(allPrayers, id: \.id) { p in
          let done = isPrayerCompleted(p.id, in: completed)
          let kaza = done && isPrayerKaza(p.id, in: entry.tracker?.kazaPrayers ?? [])
          if done {
            let g = kaza ? kazaGradient() : prayerGradient(for: p.id)
            RoundedRectangle(cornerRadius: 3)
              .fill(g.linear)
              .frame(width: 20, height: 8)
              .shadow(color: g.glow.opacity(t == .light ? 0.50 : 0.0), radius: 3)
          } else {
            RoundedRectangle(cornerRadius: 3)
              .fill(t.dotInactive)
              .frame(width: 20, height: 8)
          }
        }
      }
    }
    .padding(15)
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
  }
}

// MARK: - Prayer Tile

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
          // Hale (sadece dark)
          if theme == .dark {
            RoundedRectangle(cornerRadius: 15, style: .continuous)
              .fill(gradient.glow.opacity(0.55))
              .frame(width: 52, height: 52)
              .blur(radius: 10)
              .offset(y: 2)
          }

          // Gradient gövde
          RoundedRectangle(cornerRadius: 15, style: .continuous)
            .fill(gradient.linear)
            .frame(width: 50, height: 50)
            .shadow(
              color: gradient.base.opacity(theme.tileShadowOpacity),
              radius: theme.tileShadowRadius, x: 0, y: 4
            )

          // Üst parlaklık
          RoundedRectangle(cornerRadius: 15, style: .continuous)
            .fill(LinearGradient(
              colors: [Color.white.opacity(0.22), Color.white.opacity(0)],
              startPoint: .top, endPoint: .center
            ))
            .frame(width: 50, height: 50)
            .allowsHitTesting(false)

          if theme == .dark {
            RoundedRectangle(cornerRadius: 15, style: .continuous)
              .strokeBorder(Color.white.opacity(0.12), lineWidth: 0.7)
              .frame(width: 50, height: 50)
          }

          Image(systemName: iconName)
            .font(.system(size: 20, weight: .semibold))
            .foregroundColor(.white)
            .shadow(color: gradient.base.opacity(0.75), radius: 4, x: 0, y: 1)

        } else if !isAvailable {
          // Henüz vakti gelmedi — minimal
          RoundedRectangle(cornerRadius: 15, style: .continuous)
            .fill(theme.subtleBg)
            .frame(width: 50, height: 50)
          Image(systemName: iconName)
            .font(.system(size: 16, weight: .light))
            .foregroundColor(theme.dotInactive.opacity(0.50))

        } else {
          // Vakit girdi, kılınmadı — çerçeveli, tıklanabilir
          RoundedRectangle(cornerRadius: 15, style: .continuous)
            .fill(gradient.base.opacity(theme == .light ? 0.06 : 0.10))
            .frame(width: 50, height: 50)
          RoundedRectangle(cornerRadius: 15, style: .continuous)
            .strokeBorder(
              LinearGradient(
                colors: [gradient.highlight, gradient.base],
                startPoint: .topLeading, endPoint: .bottomTrailing
              ),
              lineWidth: 1.5
            )
            .frame(width: 50, height: 50)
          Image(systemName: iconName)
            .font(.system(size: 20, weight: .medium))
            .foregroundStyle(gradient.linear)
            .opacity(0.85)
        }
      }

      Text(prayer.label)
        .font(.system(size: 11, weight: .bold))
        .foregroundColor(
          isDone ? gradient.glow :
          isAvailable ? theme.textPrimary :
          theme.dotInactive
        )
    }
  }
}

// MARK: - Medium Widget

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
    VStack(alignment: .leading, spacing: 12) {
      // Header
      HStack(alignment: .center) {
        VStack(alignment: .leading, spacing: 2) {
          Text("GÜNLÜK NAMAZ TAKİBİ")
            .font(.system(size: 9, weight: .black))
            .foregroundColor(t.textSecondary)
            .tracking(0.8)

          HStack(alignment: .firstTextBaseline, spacing: 5) {
            Text("\(count)")
              .font(.system(size: 26, weight: .heavy, design: .rounded))
              .foregroundColor(t.textPrimary)
            Text(count == 5 ? "Tamamlandı" : "/ 5 kılındı")
              .font(.system(size: 12, weight: .bold))
              .foregroundColor(count == 5 ? Color.salahTeal : t.textSecondary)
          }
        }

        Spacer()

        PremiumRing(
          progress: CGFloat(count) / 5.0,
          lineWidth: 3.5,
          isKaza: hasKaza,
          trackColor: t.ringTrack
        )
        .frame(width: 36, height: 36)
      }

      // İnce progress çizgisi
      GeometryReader { geo in
        ZStack(alignment: .leading) {
          Capsule()
            .fill(t.ringTrack)
            .frame(height: 3)
          Capsule()
            .fill(hasKaza ? AnyShapeStyle(AngularGradient.salahKazaRing) : AnyShapeStyle(AngularGradient.salahRing))
            .frame(width: max(6, geo.size.width * CGFloat(count) / 5.0), height: 3)
            .shadow(
              color: (hasKaza ? Color.salahAmber : Color.salahTeal).opacity(0.40),
              radius: 3
            )
        }
      }
      .frame(height: 3)

      // Prayer tiles
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
    .padding(15)
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

// MARK: - Lock Screen: Prayer Tracker

private let lockPrayerIDs = ["sabah", "ogle", "ikindi", "aksam", "yatsi"]

struct TrackerLockView: View {
  let entry: PrayerTrackerEntry
  @Environment(\.widgetFamily) var family

  private var completed: [String] { entry.tracker?.completedPrayers ?? [] }
  private var count: Int { lockPrayerIDs.filter { isPrayerCompleted($0, in: completed) }.count }
  private let total = 5

  var body: some View {
    if family == .accessoryCircular {
      circularBody
    } else {
      rectangularBody
    }
  }

  private var circularBody: some View {
    Gauge(value: Double(count), in: 0...Double(total)) {
      EmptyView()
    } currentValueLabel: {
      VStack(spacing: 0) {
        Text("\(count)")
          .font(.system(size: 18, weight: .black, design: .rounded))
          .widgetAccentable()
        Text("/ \(total)")
          .font(.system(size: 9, weight: .bold))
          .foregroundStyle(.secondary)
      }
    }
    .gaugeStyle(.accessoryCircular)
    .tint(.white)
    .widgetAccentable()
    .withAccessoryBackground()
  }

  private var rectangularBody: some View {
    VStack(alignment: .leading, spacing: 4) {
      HStack(spacing: 5) {
        Image(systemName: "checklist")
          .font(.system(size: 12, weight: .bold))
          .widgetAccentable()
        Text("Namaz Takibi")
          .font(.system(size: 13, weight: .black))
          .widgetAccentable()
        Spacer()
        Text("\(count)/\(total)")
          .font(.system(size: 12, weight: .bold))
          .foregroundStyle(.secondary)
      }
      prayerIconRow
    }
    .padding(.horizontal, 2)
  }

  private var prayerIconRow: some View {
    HStack(spacing: 8) {
      ForEach(lockPrayerIDs, id: \.self) { prayerId in
        prayerIcon(for: prayerId)
      }
      Spacer()
    }
  }

  @ViewBuilder
  private func prayerIcon(for id: String) -> some View {
    if isPrayerCompleted(id, in: completed) {
      Image(systemName: "checkmark.circle.fill")
        .font(.system(size: 16, weight: .semibold))
        .widgetAccentable()
    } else {
      Image(systemName: "circle")
        .font(.system(size: 16, weight: .semibold))
        .foregroundStyle(.secondary)
    }
  }
}

struct SalahTrackerLockWidget: Widget {
  let kind = "SalahTrackerLockWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: PrayerTrackerProvider(theme: .dark)) { entry in
      TrackerLockView(entry: entry)
        .lockWidgetBackground()
        .widgetURL(URL(string: "salah://home"))
    }
    .configurationDisplayName("Namaz Takibi")
    .description("Bugün kılınan namazların özeti.")
    .supportedFamilies([.accessoryCircular, .accessoryRectangular])
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
