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

// MARK: - Tip bazlı gradient/etiket

private struct InspirationStyle {
  let gradient: PrayerGradient
  let label: String
  let icon: String
}

private func styleForType(_ type: String) -> InspirationStyle {
  let lower = type.lowercased()
  if lower.contains("ayet") || lower.contains("verse") || lower.contains("quran") {
    // Ayet → emerald-gold spektrumu (premium kuran ahengi)
    return InspirationStyle(
      gradient: PrayerGradient(
        base: Color(red: 0.00, green: 0.65, blue: 0.55),
        highlight: Color(red: 0.20, green: 0.95, blue: 0.75),
        glow: Color(red: 0.10, green: 0.80, blue: 0.65)
      ),
      label: "Günün Ayeti",
      icon: "book.fill"
    )
  }
  // Default: hadis → mint-teal
  return InspirationStyle(
    gradient: PrayerGradient(
      base: Color(red: 0.00, green: 0.70, blue: 0.65),
      highlight: Color(red: 0.20, green: 0.95, blue: 0.85),
      glow: Color(red: 0.10, green: 0.85, blue: 0.78)
    ),
    label: "Günün Hadisi",
    icon: "quote.bubble.fill"
  )
}

// MARK: - Header (ortak)

private struct InspirationHeader: View {
  let theme: SalahTheme
  let style: InspirationStyle
  let iconSize: CGFloat
  let labelSize: CGFloat

  var body: some View {
    HStack(spacing: 7) {
      ZStack {
        if theme == .dark {
          Circle()
            .fill(style.gradient.glow.opacity(0.50))
            .frame(width: iconSize + 8, height: iconSize + 8).blur(radius: 6)
        }
        Circle()
          .fill(style.gradient.linear)
          .frame(width: iconSize + 4, height: iconSize + 4)
          .shadow(color: style.gradient.base.opacity(theme == .light ? 0.55 : 0.0), radius: 5, x: 0, y: 1)

        if theme == .dark {
          Circle()
            .fill(LinearGradient(colors: [Color.white.opacity(0.20), Color.white.opacity(0)], startPoint: .top, endPoint: .center))
            .frame(width: iconSize + 4, height: iconSize + 4)
        }

        Image(systemName: style.icon)
          .font(.system(size: iconSize - 4, weight: .bold))
          .foregroundColor(.white)
          .shadow(color: style.gradient.base.opacity(0.70), radius: 3, x: 0, y: 1)
      }

      Text(style.label)
        .font(.system(size: labelSize, weight: .black))
        .foregroundColor(theme.textPrimary)
        .tracking(0.3)
      Spacer()
    }
  }
}

private struct QuoteWatermark: View {
  let theme: SalahTheme
  let style: InspirationStyle
  let size: CGFloat
  let offsetX: CGFloat
  let offsetY: CGFloat

  var body: some View {
    Image(systemName: "quote.opening")
      .font(.system(size: size, weight: .black))
      .foregroundStyle(
        LinearGradient(
          colors: [
            style.gradient.glow.opacity(theme == .light ? 0.10 : 0.14),
            style.gradient.base.opacity(theme == .light ? 0.04 : 0.06)
          ],
          startPoint: .topLeading, endPoint: .bottomTrailing
        )
      )
      .offset(x: offsetX, y: offsetY)
      .allowsHitTesting(false)
  }
}

// Source chip (kaynak: "Sahih-i Buhârî" gibi)
private struct SourceChip: View {
  let source: String
  let style: InspirationStyle
  let theme: SalahTheme
  let fontSize: CGFloat

  var body: some View {
    HStack(spacing: 5) {
      Image(systemName: "book.closed.fill")
        .font(.system(size: fontSize - 2, weight: .bold))
        .foregroundColor(style.gradient.glow.opacity(theme == .light ? 0.90 : 0.85))
      Text(source)
        .font(.system(size: fontSize, weight: .bold))
        .foregroundColor(style.gradient.glow.opacity(theme == .light ? 0.95 : 0.90))
        .lineLimit(1)
    }
    .padding(.horizontal, 10)
    .padding(.vertical, 5)
    .background(Capsule().fill(style.gradient.base.opacity(theme == .light ? 0.10 : 0.18)))
    .overlay(Capsule().strokeBorder(style.gradient.glow.opacity(theme == .light ? 0.40 : 0.30), lineWidth: 0.8))
  }
}

// MARK: - Small Widget

struct InspirationSmallView: View {
  let entry: InspirationEntry
  private var t: SalahTheme { entry.theme }
  private var style: InspirationStyle { styleForType(entry.data?.type ?? "") }

  var body: some View {
    ZStack(alignment: .topLeading) {
      QuoteWatermark(theme: t, style: style, size: 90, offsetX: 70, offsetY: -10)

      VStack(alignment: .leading, spacing: 7) {
        InspirationHeader(theme: t, style: style, iconSize: 14, labelSize: 10)

        Text(entry.data?.text ?? "Yükleniyor...")
          .font(.system(size: 11, weight: .medium))
          .foregroundColor(t.textPrimary)
          .lineLimit(4).minimumScaleFactor(0.85).lineSpacing(1.5)
        Spacer(minLength: 0)

        if let source = entry.data?.source, !source.isEmpty {
          Text(source)
            .font(.system(size: 9, weight: .bold))
            .foregroundStyle(style.gradient.linear)
            .lineLimit(1).minimumScaleFactor(0.8)
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
  private var style: InspirationStyle { styleForType(entry.data?.type ?? "") }

  var body: some View {
    ZStack(alignment: .topTrailing) {
      QuoteWatermark(theme: t, style: style, size: 130, offsetX: 18, offsetY: -22)

      VStack(alignment: .leading, spacing: 10) {
        InspirationHeader(theme: t, style: style, iconSize: 16, labelSize: 11)

        Text(entry.data?.text ?? "Yükleniyor...")
          .font(.system(size: 13, weight: .medium))
          .foregroundColor(t.textPrimary)
          .lineLimit(4).lineSpacing(2)

        Spacer(minLength: 0)

        if let source = entry.data?.source, !source.isEmpty {
          SourceChip(source: source, style: style, theme: t, fontSize: 11)
        }
      }
      .padding(14)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
  }
}

// MARK: - Large Widget — Geniş okuma alanı, arapça orijinal, tip badge

struct InspirationLargeView: View {
  let entry: InspirationEntry
  private var t: SalahTheme { entry.theme }
  private var style: InspirationStyle { styleForType(entry.data?.type ?? "") }
  private var hasArabic: Bool {
    !(entry.data?.arabic ?? "").trimmingCharacters(in: .whitespaces).isEmpty
  }

  var body: some View {
    ZStack(alignment: .topTrailing) {
      // Dev watermark
      QuoteWatermark(theme: t, style: style, size: 180, offsetX: 30, offsetY: -40)
      // Sol alt da ikinci watermark (decoration)
      Image(systemName: "quote.closing")
        .font(.system(size: 120, weight: .black))
        .foregroundStyle(
          LinearGradient(
            colors: [
              style.gradient.base.opacity(t == .light ? 0.05 : 0.08),
              style.gradient.glow.opacity(t == .light ? 0.03 : 0.04)
            ],
            startPoint: .topLeading, endPoint: .bottomTrailing
          )
        )
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottomLeading)
        .offset(x: -10, y: 30)
        .allowsHitTesting(false)

      VStack(alignment: .leading, spacing: 14) {
        // Header
        HStack {
          InspirationHeader(theme: t, style: style, iconSize: 18, labelSize: 12)
        }

        // Divider
        Rectangle()
          .fill(t.subtleBorder)
          .frame(height: 1)
          .padding(.top, -4)

        // Arapça orijinal (varsa)
        if hasArabic {
          Text(entry.data?.arabic ?? "")
            .font(.system(size: 17, weight: .medium))
            .foregroundStyle(style.gradient.linear)
            .multilineTextAlignment(.trailing)
            .lineLimit(3)
            .lineSpacing(4)
            .frame(maxWidth: .infinity, alignment: .trailing)
        }

        // Ana metin
        Text(entry.data?.text ?? "Yükleniyor...")
          .font(.system(size: 14, weight: .medium))
          .foregroundColor(t.textPrimary)
          .lineSpacing(3)
          .lineLimit(hasArabic ? 6 : 9)
          .minimumScaleFactor(0.95)

        Spacer(minLength: 0)

        // Alt: kaynak chip + tip badge
        HStack(spacing: 8) {
          if let source = entry.data?.source, !source.isEmpty {
            SourceChip(source: source, style: style, theme: t, fontSize: 12)
          }
          Spacer()
        }
      }
      .padding(18)
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
    case .systemLarge:
      InspirationLargeView(entry: entry)
    default:
      InspirationMediumView(entry: entry)
    }
  }
}

// MARK: - Widget Definitions

struct InspirationWidget: Widget {
  let kind = "SalahInspirationWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: InspirationProvider(theme: .dark)) { entry in
      InspirationWidgetEntryView(entry: entry)
        .salahWidgetBackground(entry.theme)
        .widgetURL(URL(string: "salah://home"))
    }
    .configurationDisplayName("Günün Hadisi / Ayeti")
    .description("Günlük ilham — koyu tema.")
    .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
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
    .configurationDisplayName("Günün Hadisi / Ayeti (Açık)")
    .description("Günlük ilham — açık tema.")
    .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
  }
}