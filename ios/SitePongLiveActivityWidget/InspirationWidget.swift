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

// MARK: - Small Widget

struct InspirationSmallView: View {
  let entry: InspirationEntry
  private var t: SalahTheme { entry.theme }

  var body: some View {
    VStack(alignment: .leading, spacing: 6) {
      HStack(spacing: 4) {
        ZStack {
          Circle()
            .fill(Color.salahTeal.opacity(0.12))
            .frame(width: 22, height: 22)
          Image(systemName: "quote.bubble.fill")
            .font(.system(size: 10))
            .foregroundColor(.salahTeal)
        }
        Text("Günün Hadisi")
          .font(.system(size: 10, weight: .heavy))
          .foregroundColor(t.textSecondary)
          .tracking(0.3)
      }
      Text(entry.data?.text ?? "Hadis yükleniyor...")
        .font(.system(size: 11))
        .foregroundColor(t.textPrimary)
        .lineLimit(4)
        .minimumScaleFactor(0.8)
      Spacer()
    }
    .padding(12)
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
  }
}

// MARK: - Medium Widget

struct InspirationMediumView: View {
  let entry: InspirationEntry
  private var t: SalahTheme { entry.theme }

  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      HStack(spacing: 6) {
        ZStack {
          Circle()
            .fill(Color.salahTeal.opacity(0.12))
            .frame(width: 26, height: 26)
          Image(systemName: "quote.bubble.fill")
            .font(.system(size: 12))
            .foregroundColor(.salahTeal)
        }
        Text("Günün Hadisi")
          .font(.system(size: 11, weight: .heavy))
          .foregroundColor(t.textSecondary)
          .tracking(0.3)
        Spacer()
      }
      Text(entry.data?.text ?? "Hadis yükleniyor...")
        .font(.system(size: 13))
        .foregroundColor(t.textPrimary)
        .lineLimit(5)
      Spacer()
      if let source = entry.data?.source, !source.isEmpty {
        HStack(spacing: 4) {
          Text("—")
            .foregroundColor(.salahTeal)
          Text(source)
            .font(.system(size: 10, weight: .semibold))
            .foregroundColor(.salahTeal)
        }
      }
    }
    .padding(14)
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
