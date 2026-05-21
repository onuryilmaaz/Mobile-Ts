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
    let data = WidgetData.load()
    let cal = Calendar.current
    let now = Date()
    var entries: [PrayerTimesEntry] = [PrayerTimesEntry(date: now, data: data, theme: theme)]

    for timeStr in [data?.imsak, data?.gunes, data?.ogle, data?.ikindi, data?.aksam, data?.yatsi].compactMap({ $0 }) {
      let parts = timeStr.split(separator: ":").compactMap { Int($0) }
      guard parts.count >= 2 else { continue }
      var c = cal.dateComponents([.year, .month, .day], from: now)
      c.hour = parts[0]; c.minute = parts[1]; c.second = 1
      if let d = cal.date(from: c), d > now {
        entries.append(PrayerTimesEntry(date: d, data: data, theme: theme))
      }
    }

    let midnight = cal.startOfDay(for: cal.date(byAdding: .day, value: 1, to: now)!)
    completion(Timeline(entries: entries, policy: .after(midnight)))
  }
}

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

private func timeToMinutes(_ s: String) -> Int {
  let parts = s.split(separator: ":").compactMap { Int($0) }
  guard parts.count >= 2 else { return 0 }
  return parts[0] * 60 + parts[1]
}

// Day's prayer schedule with statuses
private struct PrayerSlot {
  let id: String         // "sabah", "ogle", etc.
  let label: String      // "Sabah", "Öğle"
  let time: String       // "06:15"
  let isActive: Bool     // şu an bu vakit
  let isPast: Bool       // geçti
}

private func buildDaySlots(widget: WidgetData?, at date: Date) -> [PrayerSlot] {
  guard let w = widget else { return [] }
  let entries: [(String, String, String)] = [
    ("sabah",  "Sabah",  w.imsak),
    ("ogle",   "Öğle",   w.ogle),
    ("ikindi", "İkindi", w.ikindi),
    ("aksam",  "Akşam",  w.aksam),
    ("yatsi",  "Yatsı",  w.yatsi),
  ]
  let nowComp = Calendar.current.dateComponents([.hour, .minute], from: date)
  let nowMin = (nowComp.hour ?? 0) * 60 + (nowComp.minute ?? 0)

  // Aktif vakit = başlama saati geçmiş en son vakit (şu an içinde olduğumuz pencere)
  var activePrayerKey: String? = nil
  for (id, _, time) in entries {
    let startMin = timeToMinutes(time)
    if startMin > 0 && nowMin >= startMin {
      activePrayerKey = id
    }
  }

  return entries.map { (id, label, time) in
    let startMin = timeToMinutes(time)
    let isActive = (id == activePrayerKey)
    let isPast = startMin > 0 && nowMin >= startMin && !isActive
    return PrayerSlot(id: id, label: label, time: time, isActive: isActive, isPast: isPast)
  }
}

// MARK: - Small Widget

struct PrayerTimesSmallView: View {
  let entry: PrayerTimesEntry
  private var t: SalahTheme { entry.theme }

  private var computed: ComputedPrayerState? { computeNextPrayer(data: entry.data, at: entry.date) }
  private var prayerKey: String { prayerKeyFromName(computed?.prayerName ?? "") }
  private var gradient: PrayerGradient { prayerGradient(for: prayerKey) }
  private var iconName: String { prayerCompletedIcon(for: prayerKey) }

  var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      HStack(spacing: 6) {
        ZStack {
          if t == .dark {
            Circle().fill(gradient.glow.opacity(0.45)).frame(width: 26, height: 26).blur(radius: 6)
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

      Text(computed?.prayerName ?? "--")
        .font(.system(size: 26, weight: .heavy, design: .rounded))
        .foregroundStyle(gradient.linear)
        .shadow(color: gradient.base.opacity(t == .light ? 0.40 : 0.0), radius: 5, x: 0, y: 1)
        .minimumScaleFactor(0.7)
        .lineLimit(1)

      if let end = computed?.endDate {
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
      nextPrayerChip
    }
    .padding(14)
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
  }

  @ViewBuilder
  private var nextPrayerChip: some View {
    let nextKey = prayerKeyFromName(computed?.nextPrayer ?? "")
    let nextGrad = prayerGradient(for: nextKey)
    HStack(spacing: 5) {
      Image(systemName: "arrow.right")
        .font(.system(size: 9, weight: .bold))
        .foregroundColor(nextGrad.glow.opacity(t == .light ? 0.85 : 0.75))
      Text(computed?.nextPrayer ?? "--")
        .font(.system(size: 11, weight: .bold))
        .foregroundColor(nextGrad.glow.opacity(t == .light ? 0.85 : 0.80))
        .lineLimit(1)
    }
    .padding(.horizontal, 8).padding(.vertical, 4)
    .background(Capsule().fill(nextGrad.base.opacity(t == .light ? 0.10 : 0.18)))
    .overlay(Capsule().strokeBorder(nextGrad.glow.opacity(t == .light ? 0.35 : 0.30), lineWidth: 0.8))
  }
}

// MARK: - Medium Widget

struct PrayerTimesMediumView: View {
  let entry: PrayerTimesEntry
  private var t: SalahTheme { entry.theme }

  private var computed: ComputedPrayerState? { computeNextPrayer(data: entry.data, at: entry.date) }
  private var prayerKey: String { prayerKeyFromName(computed?.prayerName ?? "") }
  private var gradient: PrayerGradient { prayerGradient(for: prayerKey) }
  private var iconName: String { prayerCompletedIcon(for: prayerKey) }

  var body: some View {
    HStack(spacing: 16) {
      ZStack {
        if t == .dark {
          RoundedRectangle(cornerRadius: 18, style: .continuous)
            .fill(gradient.glow.opacity(0.55))
            .frame(width: 76, height: 76).blur(radius: 12).offset(y: 3)
        }
        RoundedRectangle(cornerRadius: 18, style: .continuous)
          .fill(gradient.linear)
          .frame(width: 76, height: 76)
          .shadow(color: gradient.base.opacity(t == .light ? 0.55 : 0.0), radius: 10, x: 0, y: 4)

        if t == .dark {
          RoundedRectangle(cornerRadius: 18, style: .continuous)
            .fill(LinearGradient(colors: [Color.white.opacity(0.22), Color.white.opacity(0)], startPoint: .top, endPoint: .center))
            .frame(width: 76, height: 76).allowsHitTesting(false)
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

      VStack(alignment: .leading, spacing: 4) {
        Text("SONRAKİ NAMAZ")
          .font(.system(size: 10, weight: .black))
          .foregroundColor(t.textSecondary).tracking(0.7)

        Text(computed?.prayerName ?? "--")
          .font(.system(size: 28, weight: .heavy, design: .rounded))
          .foregroundStyle(gradient.linear)
          .shadow(color: gradient.base.opacity(t == .light ? 0.40 : 0.0), radius: 5, x: 0, y: 1)
          .minimumScaleFactor(0.7).lineLimit(1)

        if let end = computed?.endDate {
          Text(timerInterval: Date.now...end, pauseTime: nil)
            .font(.system(size: 18, weight: .bold, design: .rounded).monospacedDigit())
            .foregroundColor(t.textPrimary).lineLimit(1).minimumScaleFactor(0.7)
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
    let nextKey = prayerKeyFromName(computed?.nextPrayer ?? "")
    let nextGrad = prayerGradient(for: nextKey)
    HStack(spacing: 5) {
      Image(systemName: "arrow.right")
        .font(.system(size: 10, weight: .bold))
        .foregroundColor(nextGrad.glow.opacity(t == .light ? 0.85 : 0.75))
      Text(computed?.nextPrayer ?? "--")
        .font(.system(size: 12, weight: .bold))
        .foregroundColor(nextGrad.glow.opacity(t == .light ? 0.90 : 0.85))
        .lineLimit(1)
    }
    .padding(.horizontal, 10).padding(.vertical, 5)
    .background(Capsule().fill(nextGrad.base.opacity(t == .light ? 0.10 : 0.18)))
    .overlay(Capsule().strokeBorder(nextGrad.glow.opacity(t == .light ? 0.40 : 0.30), lineWidth: 0.8))
  }
}

// MARK: - Large Widget — Tüm günün vakitleri + aktif vurgu

struct PrayerTimesLargeView: View {
  let entry: PrayerTimesEntry
  private var t: SalahTheme { entry.theme }

  private var computed: ComputedPrayerState? { computeNextPrayer(data: entry.data, at: entry.date) }
  private var prayerKey: String { prayerKeyFromName(computed?.prayerName ?? "") }
  private var gradient: PrayerGradient { prayerGradient(for: prayerKey) }
  private var iconName: String { prayerCompletedIcon(for: prayerKey) }

  private var slots: [PrayerSlot] {
    buildDaySlots(widget: entry.data, at: entry.date)
  }

  var body: some View {
    VStack(alignment: .leading, spacing: 10) {
      // === ÜST: Kompakt aktif vakit header ===
      HStack(spacing: 12) {
        // Küçük ikon kutusu (60 → 48)
        ZStack {
          if t == .dark {
            RoundedRectangle(cornerRadius: 13, style: .continuous)
              .fill(gradient.glow.opacity(0.55))
              .frame(width: 52, height: 52).blur(radius: 9).offset(y: 2)
          }
          RoundedRectangle(cornerRadius: 13, style: .continuous)
            .fill(gradient.linear)
            .frame(width: 48, height: 48)
            .shadow(color: gradient.base.opacity(t == .light ? 0.50 : 0.0), radius: 7, x: 0, y: 3)

          if t == .dark {
            RoundedRectangle(cornerRadius: 13, style: .continuous)
              .fill(LinearGradient(colors: [Color.white.opacity(0.22), Color.white.opacity(0)], startPoint: .top, endPoint: .center))
              .frame(width: 48, height: 48)
            RoundedRectangle(cornerRadius: 13, style: .continuous)
              .strokeBorder(Color.white.opacity(0.14), lineWidth: 0.8)
              .frame(width: 48, height: 48)
          }

          Image(systemName: iconName)
            .font(.system(size: 22, weight: .semibold))
            .foregroundColor(.white)
            .shadow(color: gradient.base.opacity(0.80), radius: 3, x: 0, y: 1)
            .shadow(color: gradient.glow.opacity(0.55), radius: 7, x: 0, y: 0)
        }
        .frame(width: 48, height: 48)

        // Sağ: vakit ismi (üstte) + sayaç (altta) — kompakt iki satır
        VStack(alignment: .leading, spacing: 2) {
          Text(computed?.prayerName ?? "--")
            .font(.system(size: 22, weight: .heavy, design: .rounded))
            .foregroundStyle(gradient.linear)
            .shadow(color: gradient.base.opacity(t == .light ? 0.40 : 0.0), radius: 5, x: 0, y: 1)
            .minimumScaleFactor(0.7).lineLimit(1)

          if let end = computed?.endDate {
            Text(timerInterval: Date.now...end, pauseTime: nil)
              .font(.system(size: 18, weight: .bold, design: .rounded).monospacedDigit())
              .foregroundColor(t.textPrimary).lineLimit(1).minimumScaleFactor(0.7)
          }
        }
        Spacer(minLength: 0)
      }

      // Divider — daha ince padding
      Rectangle()
        .fill(t.subtleBorder)
        .frame(height: 1)

      // === ALT: 5 vakit listesi — daha sıkı spacing ===
      VStack(spacing: 4) {
        ForEach(slots, id: \.id) { slot in
          PrayerSlotRow(slot: slot, theme: t)
        }
      }
      Spacer(minLength: 0)
    }
    .padding(14)
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
  }
}

// MARK: - Tek vakit satırı (large widget içinde)

private struct PrayerSlotRow: View {
  let slot: PrayerSlot
  let theme: SalahTheme

  private var grad: PrayerGradient { prayerGradient(for: slot.id) }
  private var icon: String { prayerCompletedIcon(for: slot.id) }

  var body: some View {
    HStack(spacing: 11) {
      // Sol: küçük ikon kutusu (34 → 32)
      ZStack {
        if slot.isActive {
          if theme == .dark {
            RoundedRectangle(cornerRadius: 8, style: .continuous)
              .fill(grad.glow.opacity(0.50))
              .frame(width: 36, height: 36).blur(radius: 5).offset(y: 1)
          }
          RoundedRectangle(cornerRadius: 8, style: .continuous)
            .fill(grad.linear)
            .frame(width: 32, height: 32)
            .shadow(color: grad.base.opacity(theme == .light ? 0.50 : 0.0), radius: 4, x: 0, y: 2)
          Image(systemName: icon)
            .font(.system(size: 14, weight: .semibold))
            .foregroundColor(.white)
            .shadow(color: grad.base.opacity(0.7), radius: 2, x: 0, y: 1)
        } else if slot.isPast {
          RoundedRectangle(cornerRadius: 8, style: .continuous)
            .fill(theme.subtleBg)
            .frame(width: 32, height: 32)
          Image(systemName: icon)
            .font(.system(size: 13, weight: .medium))
            .foregroundColor(theme.textTertiary)
        } else {
          RoundedRectangle(cornerRadius: 8, style: .continuous)
            .fill(grad.base.opacity(theme == .light ? 0.07 : 0.10))
            .frame(width: 32, height: 32)
          RoundedRectangle(cornerRadius: 8, style: .continuous)
            .strokeBorder(grad.glow.opacity(theme == .light ? 0.45 : 0.40), lineWidth: 1.0)
            .frame(width: 32, height: 32)
          Image(systemName: icon)
            .font(.system(size: 13, weight: .medium))
            .foregroundColor(grad.glow.opacity(theme == .light ? 0.85 : 0.75))
        }
      }
      .frame(width: 36, height: 36)

      // Orta: vakit ismi + saat
      VStack(alignment: .leading, spacing: 0) {
        Text(slot.label)
          .font(.system(size: 14, weight: slot.isActive ? .heavy : .bold))
          .foregroundColor(
            slot.isActive ? grad.glow :
            slot.isPast ? theme.textTertiary :
            theme.textPrimary
          )
        Text(slot.time)
          .font(.system(size: 11, weight: .semibold, design: .rounded).monospacedDigit())
          .foregroundColor(
            slot.isActive ? theme.textPrimary :
            slot.isPast ? theme.textTertiary :
            theme.textSecondary
          )
      }

      Spacer(minLength: 6)

      // Sağ: durum göstergesi
      if slot.isActive {
        Text("ŞİMDİ")
          .font(.system(size: 9, weight: .black))
          .foregroundColor(.white)
          .tracking(0.6)
          .padding(.horizontal, 8)
          .padding(.vertical, 4)
          .background(Capsule().fill(grad.linear))
          .shadow(color: grad.glow.opacity(0.55), radius: 5, x: 0, y: 0)
      } else if slot.isPast {
        Image(systemName: "checkmark.circle.fill")
          .font(.system(size: 14))
          .foregroundColor(theme.textTertiary.opacity(0.6))
      } else {
        Image(systemName: "clock")
          .font(.system(size: 13, weight: .medium))
          .foregroundColor(grad.glow.opacity(theme == .light ? 0.55 : 0.45))
      }
    }
    .padding(.horizontal, 9)
    .padding(.vertical, 5)
    .background(
      RoundedRectangle(cornerRadius: 10, style: .continuous)
        .fill(slot.isActive
              ? AnyShapeStyle(
                  LinearGradient(
                    colors: [grad.base.opacity(theme == .light ? 0.10 : 0.16), grad.glow.opacity(theme == .light ? 0.04 : 0.08)],
                    startPoint: .leading, endPoint: .trailing
                  )
                )
              : AnyShapeStyle(Color.clear))
        .overlay(
          RoundedRectangle(cornerRadius: 10, style: .continuous)
            .strokeBorder(slot.isActive ? grad.glow.opacity(theme == .light ? 0.35 : 0.32) : Color.clear, lineWidth: 1)
        )
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
    case .systemLarge:
      PrayerTimesLargeView(entry: entry)
    default:
      PrayerTimesMediumView(entry: entry)
    }
  }
}

// MARK: - Lock Screen: Next Prayer Countdown

struct NextPrayerLockView: View {
  let entry: PrayerTimesEntry
  @Environment(\.widgetFamily) var family

  private var computed: ComputedPrayerState? { computeNextPrayer(data: entry.data, at: entry.date) }
  private var name: String { computed?.prayerName ?? "—" }
  private var time: String { computed?.prayerTime ?? "--:--" }
  private var target: Date? { computed?.endDate }
  private var iconName: String { prayerCompletedIcon(for: prayerKeyFromName(name)) }

  var body: some View {
    switch family {
    case .accessoryCircular:
      VStack(spacing: 1) {
        Image(systemName: iconName)
          .font(.system(size: 12, weight: .bold))
          .widgetAccentable()
        Text(name)
          .font(.system(size: 10, weight: .black))
          .widgetAccentable()
          .minimumScaleFactor(0.6)
          .lineLimit(1)
        Text(time)
          .font(.system(size: 14, weight: .black, design: .rounded))
        if let t = target {
          Text(timerInterval: Date.now...t, pauseTime: nil, countsDown: true)
            .font(.system(size: 8, weight: .semibold, design: .monospaced))
            .foregroundStyle(.secondary)
        }
      }
      .multilineTextAlignment(.center)
      .withAccessoryBackground()

    case .accessoryRectangular:
      VStack(alignment: .leading, spacing: 3) {
        HStack(spacing: 5) {
          Image(systemName: iconName)
            .font(.system(size: 13, weight: .bold))
            .widgetAccentable()
          Text(name)
            .font(.system(size: 14, weight: .black))
            .widgetAccentable()
          Spacer()
          Text(time)
            .font(.system(size: 14, weight: .bold, design: .monospaced))
        }
        if let t = target {
          HStack(spacing: 4) {
            Image(systemName: "timer")
              .font(.system(size: 10))
              .foregroundStyle(.secondary)
            Text(timerInterval: Date.now...t, pauseTime: nil, countsDown: true)
              .font(.system(size: 13, weight: .semibold, design: .monospaced))
              .foregroundStyle(.secondary)
          }
        }
      }
      .padding(.horizontal, 2)

    default:
      Label {
        Text("\(name)  \(time)")
      } icon: {
        Image(systemName: iconName)
      }
      .widgetAccentable()
    }
  }
}

struct SalahNextPrayerLockWidget: Widget {
  let kind = "SalahNextPrayerLockWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: PrayerTimesProvider(theme: .dark)) { entry in
      NextPrayerLockView(entry: entry)
        .lockWidgetBackground()
        .widgetURL(URL(string: "salah://home"))
    }
    .configurationDisplayName("Sonraki Namaz")
    .description("Bir sonraki namaz vakti ve geri sayım.")
    .supportedFamilies([.accessoryCircular, .accessoryRectangular, .accessoryInline])
  }
}

// MARK: - Widget Definitions

struct PrayerTimesWidget: Widget {
  let kind = "SalahPrayerTimesWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: PrayerTimesProvider(theme: .dark)) { entry in
      PrayerTimesWidgetEntryView(entry: entry)
        .salahWidgetBackground(entry.theme)
        .widgetURL(URL(string: "salah://home"))
    }
    .configurationDisplayName("Namaz Vakitleri")
    .description("Namaz vakitleri — koyu tema.")
    .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
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
    .description("Namaz vakitleri — açık tema.")
    .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
  }
}