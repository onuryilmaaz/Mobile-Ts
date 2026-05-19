import SwiftUI
import WidgetKit

struct InspirationEntry: TimelineEntry {
  let date: Date
  let data: InspirationData?
  let theme: SalahTheme
}

struct InspirationProvider: TimelineProvider {
  let theme: SalahTheme

  func placeholder(in _: Context) -> InspirationEntry { InspirationEntry(date: Date(), data: nil, theme: theme) }
  func getSnapshot(in _: Context, completion: @escaping (InspirationEntry) -> Void) {
    completion(InspirationEntry(date: Date(), data: InspirationData.load(), theme: theme))
  }
  func getTimeline(in _: Context, completion: @escaping (Timeline<InspirationEntry>) -> Void) {
    let entry = InspirationEntry(date: Date(), data: InspirationData.load(), theme: theme)
    let next = Calendar.current.date(byAdding: .hour, value: 1, to: Date())!
    completion(Timeline(entries: [entry], policy: .after(next)))
  }
}

// Hadis için signature gradient (mint-teal — teal aile)
private let hadisGradient = PrayerGradient(
  base: Color(red: 0.00, green: 0.70, blue: 0.65),
  highlight: Color(red: 0.20, green: 0.95, blue: 0.85),
  glow: Color(red: 0.10, green: 0.85, blue: 0.78)
)

// MARK: - Header (her iki size'da paylaşılan)

private struct InspirationHeader: View {
  let theme: SalahTheme
  let iconSize: CGFloat
  let labelSize: CGFloat

  var body: some View {
    HStack(spacing: 7) {
      ZStack {
        if theme == .dark {
          Circle()
            .fill(hadisGradient.glow.opacity(0.50))
            .frame(width: iconSize + 8, height: iconSize + 8)
            .blur(radius: 6)
        }
        Circle()
          .fill(hadisGradient.linear)
          .frame(width: iconSize + 4, height: iconSize + 4)
          .shadow(color: hadisGradient.base.opacity(theme == .light ? 0.55 : 0.0), radius: 5, x: 0, y: 1)

        if theme == .dark {
          Circle()
            .fill(
              LinearGradient(
                colors: [Color.white.opacity(0.20), Color.white.opacity(0)],
                startPoint: .top, endPoint: .center
              )
            )
            .frame(width: iconSize + 4, height: iconSize + 4)
        }

        Image(systemName: "quote.bubble.fill")
          .font(.system(size: iconSize - 4, weight: .bold))
          .foregroundColor(.white)
          .shadow(color: hadisGradient.base.opacity(0.70), radius: 3, x: 0, y: 1)
      }

      Text("Günün Hadisi")
        .font(.system(size: labelSize, weight: .black))
        .foregroundColor(theme.textPrimary)
        .tracking(0.3)
      Spacer()
    }
  }
}

// Watermark dev tırnak (arka plan dekorasyonu)
private struct QuoteWatermark: View {
  let theme: SalahTheme
  let size: CGFloat
  let offsetX: CGFloat
  let offsetY: CGFloat

  var body: some View {
    Image(systemName: "quote.opening")
      .font(.system(size: size, weight: .black))
      .foregroundStyle(
        LinearGradient(
          colors: [
            hadisGradient.glow.opacity(theme == .light ? 0.10 : 0.14),
            hadisGradient.base.opacity(theme == .light ? 0.04 : 0.06)
          ],
          startPoint: .topLeading, endPoint: .bottomTrailing
        )
      )
      .offset(x: offsetX, y: offsetY)
      .allowsHitTesting(false)
  }
}

// MARK: - Small Widget

struct InspirationSmallView: View {
  let entry: InspirationEntry
  private var t: SalahTheme { entry.theme }

  var body: some View {
    ZStack(alignment: .topLeading) {
      // Background watermark
      QuoteWatermark(theme: t, size: 90, offsetX: 70, offsetY: -10)

      VStack(alignment: .leading, spacing: 7) {
        InspirationHeader(theme: t, iconSize: 14, labelSize: 10)

        Text(entry.data?.text ?? "Hadis yükleniyor...")
          .font(.system(size: 11, weight: .medium))
          .foregroundColor(t.textPrimary)
          .lineLimit(4)
          .minimumScaleFactor(0.85)
          .lineSpacing(1.5)
        Spacer(minLength: 0)

        if let source = entry.data?.source, !source.isEmpty {
          Text(source)
            .font(.system(size: 9, weight: .bold))
            .foregroundStyle(hadisGradient.linear)
            .lineLimit(1)
            .minimumScaleFactor(0.8)
        }
      }
      .padding(12)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
  }
}

// MARK: - Medium Widget

struct InspirationMediumView: View {
  let entry: InspirationEntry
  private var t: SalahTheme { entry.theme }

  var body: some View {
    ZStack(alignment: .topTrailing) {
      // Watermark sağ üst köşede dev tırnak
      QuoteWatermark(theme: t, size: 130, offsetX: 18, offsetY: -22)

      VStack(alignment: .leading, spacing: 10) {
        InspirationHeader(theme: t, iconSize: 16, labelSize: 11)

        Text(entry.data?.text ?? "Hadis yükleniyor...")
          .font(.system(size: 13, weight: .medium))
          .foregroundColor(t.textPrimary)
          .lineLimit(4)
          .lineSpacing(2)

        Spacer(minLength: 0)

        // Kaynak: capsule chip
        if let source = entry.data?.source, !source.isEmpty {
          HStack(spacing: 5) {
            Image(systemName: "book.closed.fill")
              .font(.system(size: 9, weight: .bold))
              .foregroundColor(hadisGradient.glow.opacity(t == .light ? 0.90 : 0.85))
            Text(source)
              .font(.system(size: 11, weight: .bold))
              .foregroundColor(hadisGradient.glow.opacity(t == .light ? 0.95 : 0.90))
              .lineLimit(1)
          }
          .padding(.horizontal, 10)
          .padding(.vertical, 5)
          .background(
            Capsule()
              .fill(hadisGradient.base.opacity(t == .light ? 0.10 : 0.18))
          )
          .overlay(
            Capsule()
              .strokeBorder(hadisGradient.glow.opacity(t == .light ? 0.40 : 0.30), lineWidth: 0.8)
          )
        }
      }
      .padding(14)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
  }
}

// MARK: - Entry View

struct InspirationWidgetEntryView: View {
  @Environment(\.widgetFamily) var family
  let entry: InspirationEntry

  var body: some View {
    switch family {
    case .systemSmall:
      InspirationSmallView(entry: entry)
    default:
      InspirationMediumView(entry: entry)
    }
  }
}

// MARK: - Widget Definitions (Light + Dark)

struct InspirationWidget: Widget {
  let kind = "SalahInspirationWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: InspirationProvider(theme: .dark)) { entry in
      InspirationWidgetEntryView(entry: entry)
        .salahWidgetBackground(entry.theme)
        .widgetURL(URL(string: "salah://home"))
    }
    .configurationDisplayName("Günün Hadisi")
    .description("Günlük hadis — koyu tema.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}

struct InspirationLightWidget: Widget {
  let kind = "SalahInspirationWidgetLight"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: InspirationProvider(theme: .light)) { entry in
      InspirationWidgetEntryView(entry: entry)
        .salahWidgetBackground(entry.theme)
        .widgetURL(URL(string: "salah://home"))
    }
    .configurationDisplayName("Günün Hadisi (Açık)")
    .description("Günlük hadis — açık tema.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}