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

// MARK: - Provider

struct PrayerTrackerProvider: TimelineProvider {
  let theme: SalahTheme

  func placeholder(in _: Context) -> PrayerTrackerEntry {
    PrayerTrackerEntry(date: Date(), tracker: nil, widget: nil, theme: theme)
  }
  func getSnapshot(in _: Context, completion: @escaping (PrayerTrackerEntry) -> Void) {
    completion(PrayerTrackerEntry(date: Date(), tracker: TrackerData.load(), widget: WidgetData.load(), theme: theme))
  }
  func getTimeline(in _: Context, completion: @escaping (Timeline<PrayerTrackerEntry>) -> Void) {
    completion(buildTrackerTimeline(theme: theme))
  }
}

// MARK: - Shared timeline builder

private func buildTrackerTimeline(theme: SalahTheme) -> Timeline<PrayerTrackerEntry> {
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
  return Timeline(entries: entries, policy: .after(midnight))
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

// MARK: - Prayer Tile (Amel circle tile yapısı birebir — sadece şekil rounded rect ve büyük)

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
    let baseColor = gradient.base

    VStack(spacing: 5) {
      ZStack {
        if isDone {
          // ----- AKTİF: amel tile birebir kopyası, sadece şekil RoundedRect + boyut büyütülmüş -----

          // 1) Glow halo (dark only) — amel: 38 frame, base+6. Burada: 50 frame, tile+6
          if theme == .dark {
            RoundedRectangle(cornerRadius: 14, style: .continuous)
              .fill(baseColor.opacity(0.42))
              .frame(width: 50, height: 50)
              .blur(radius: 8)
          }

          // 2) Gradient gövde — amel ile birebir aynı shadow değerleri (0.38 / radius 8 / y:3)
          RoundedRectangle(cornerRadius: 13, style: .continuous)
            .fill(gradient.linear)
            .frame(width: 44, height: 44)
            .shadow(
              color: baseColor.opacity(theme == .light ? 0.38 : 0.0),
              radius: 8, x: 0, y: 3
            )

          // 3) Üst parlaklık — amel ile BİREBİR aynı: white 0.28 → 0, top → center
          RoundedRectangle(cornerRadius: 13, style: .continuous)
            .fill(LinearGradient(
              colors: [Color.white.opacity(0.28), Color.white.opacity(0)],
              startPoint: .top,
              endPoint: .center
            ))
            .frame(width: 44, height: 44)
            .allowsHitTesting(false)

          // 4) İkon — amel ile aynı: beyaz, .semibold, base shadow 0.45 radius 2
          Image(systemName: iconName)
            .font(.system(size: 18, weight: .semibold))
            .foregroundColor(.white)
            .shadow(color: baseColor.opacity(0.45), radius: 2)

        } else if !isAvailable {
          // ----- DURUM 1: KİLİTLİ (vakit girmemiş) — çok sönük, kilit ikonu -----
          let lockColor = gradient.highlight
          RoundedRectangle(cornerRadius: 13, style: .continuous)
            .fill(theme == .light ? baseColor.opacity(0.05) : lockColor.opacity(0.10))
            .frame(width: 44, height: 44)
          RoundedRectangle(cornerRadius: 13, style: .continuous)
            .stroke(
              theme == .light ? baseColor.opacity(0.22) : lockColor.opacity(0.40),
              style: StrokeStyle(lineWidth: 1.0, dash: [3, 2])
            )
            .frame(width: 44, height: 44)
          Image(systemName: "lock.fill")
            .font(.system(size: 13, weight: .semibold))
            .foregroundColor(theme == .light ? baseColor.opacity(0.32) : lockColor.opacity(0.55))

        } else {
          // ----- DURUM 2: BEKLİYOR (vakit girdi, kılınmadı) — dikkat çekici, eyleme çağırır -----
          let waitColor = theme == .light ? gradient.base : gradient.highlight
          // Renkli iç dolgu — durum 1'den ayırt edilebilir olsun
          RoundedRectangle(cornerRadius: 13, style: .continuous)
            .fill(LinearGradient(
              colors: [gradient.highlight.opacity(theme == .light ? 0.18 : 0.28),
                       gradient.base.opacity(theme == .light ? 0.10 : 0.18)],
              startPoint: .topLeading, endPoint: .bottomTrailing
            ))
            .frame(width: 44, height: 44)
          // Kalın, kesintisiz, doygun renkli border
          RoundedRectangle(cornerRadius: 13, style: .continuous)
            .strokeBorder(
              LinearGradient(
                colors: [gradient.highlight, gradient.base],
                startPoint: .topLeading, endPoint: .bottomTrailing
              ),
              lineWidth: 2.0
            )
            .frame(width: 44, height: 44)
          // İkon dolu ve doygun renkli
          Image(systemName: iconName)
            .font(.system(size: 18, weight: .bold))
            .foregroundColor(waitColor)
            .shadow(color: gradient.glow.opacity(theme == .light ? 0.25 : 0.45), radius: 3)
        }
      }
      .frame(width: 50, height: 50)

      Text(prayer.label)
        .font(.system(size: 13, weight: .heavy))
        .foregroundColor(labelColor(gradient: gradient))
        .shadow(
          color: labelGlowColor(gradient: gradient),
          radius: 3, x: 0, y: 0
        )
        .lineLimit(1)
        .minimumScaleFactor(0.75)
    }
  }

  private func labelGlowColor(gradient: PrayerGradient) -> Color {
    if isDone {
      return gradient.glow.opacity(theme == .light ? 0.30 : 0.55)
    }
    if isAvailable {
      return gradient.glow.opacity(theme == .light ? 0.22 : 0.45)
    }
    // kilitli — çok hafif
    return gradient.glow.opacity(theme == .light ? 0.0 : 0.15)
  }

  private func labelColor(gradient: PrayerGradient) -> Color {
    if isDone {
      // DURUM 3 & 4: işaretlenmiş (kaza veya vaktinde)
      return theme == .light ? gradient.base.opacity(0.90) : gradient.highlight
    }
    if isAvailable {
      // DURUM 2: bekliyor — parlak ve dikkat çekici
      return theme == .light ? gradient.base : gradient.highlight
    }
    // DURUM 1: kilitli — sönük
    return theme == .light ? gradient.base.opacity(0.40) : gradient.highlight.opacity(0.55)
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
  private var allDone: Bool { count == 5 }
  private var progress: CGFloat { CGFloat(count) / 5.0 }

  var body: some View {
    VStack(alignment: .leading, spacing: 12) {
      // Header
      HStack(alignment: .center) {
        VStack(alignment: .leading, spacing: 3) {
          Text("GÜNLÜK NAMAZ TAKİBİ")
            .font(.system(size: 12, weight: .black))
            .foregroundColor(t.textSecondary)
            .tracking(0.8)

          // Dinamik alt başlık — duruma göre değişir
          Text(subtitleText)
            .font(.system(size: 11, weight: .semibold))
            .foregroundColor(subtitleColor)
            .lineLimit(1)
        }

        Spacer()

        premiumCounterRing
      }

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

  // MARK: - Premium Counter Ring

  private var premiumCounterRing: some View {
    let accentColor: Color = hasKaza ? .salahAmber : .salahTeal
    let accentBright: Color = hasKaza
      ? Color(red: 0.92, green: 0.52, blue: 0.18)
      : .salahTealBright

    return ZStack {
      // 1) Dış glow halo — dark'ta belirgin, light'ta hafif
      Circle()
        .fill(accentColor.opacity(t == .dark ? 0.32 : 0.18))
        .frame(width: 56, height: 56)
        .blur(radius: t == .dark ? 10 : 6)

      // 2) Track ring (arka plan)
      Circle()
        .stroke(t.ringTrack, style: StrokeStyle(lineWidth: 4.5, lineCap: .round))
        .frame(width: 46, height: 46)

      // 3) Progress arc — gradient + glow shadow
      Circle()
        .trim(from: 0, to: progress)
        .stroke(
          hasKaza ? AngularGradient.salahKazaRing : AngularGradient.salahRing,
          style: StrokeStyle(lineWidth: 4.5, lineCap: .round)
        )
        .rotationEffect(.degrees(-90))
        .frame(width: 46, height: 46)
        .shadow(color: accentBright.opacity(0.55), radius: 4)
        .shadow(color: accentColor.opacity(t == .light ? 0.35 : 0.0), radius: 2)

      // 4) İçerik — tamamlandıysa seal, değilse sayı
      if allDone {
        ZStack {
          // İkon arkası soft glow
          Circle()
            .fill(accentColor.opacity(t == .dark ? 0.45 : 0.0))
            .frame(width: 24, height: 24)
            .blur(radius: 5)

          Image(systemName: "checkmark.seal.fill")
            .font(.system(size: 22, weight: .bold))
            .foregroundStyle(
              LinearGradient(
                colors: [accentBright, accentColor],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
              )
            )
            .shadow(color: accentColor.opacity(0.5), radius: 3)
        }
      } else {
        VStack(spacing: -2) {
          Text("\(count)")
            .font(.system(size: 19, weight: .heavy, design: .rounded))
            .foregroundStyle(
              LinearGradient(
                colors: [t.textPrimary, t.textPrimary.opacity(0.85)],
                startPoint: .top,
                endPoint: .bottom
              )
            )
          Text("/ 5")
            .font(.system(size: 8.5, weight: .black, design: .rounded))
            .foregroundColor(t.textSecondary)
            .tracking(0.3)
        }
      }
    }
    .frame(width: 56, height: 56)
  }

  // MARK: - Dynamic Subtitle

  private var subtitleText: String {
    if allDone {
      return hasKaza ? "Tamamlandı • kazalı" : "Bugün tamamlandı ✓"
    }
    let remaining = 5 - count
    if count == 0 {
      return "5 vakit bekliyor"
    }
    return "\(remaining) vakit kaldı"
  }

  private var subtitleColor: Color {
    if allDone {
      return hasKaza ? .salahAmber : .salahTeal
    }
    return t.textTertiary
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