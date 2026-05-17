import SwiftUI
import WidgetKit

// MARK: - Entry & Provider

struct AmelEntry: TimelineEntry {
  let date: Date
  let data: AmelData?
  let theme: SalahTheme
}

struct AmelProvider: TimelineProvider {
  let theme: SalahTheme

  func placeholder(in _: Context) -> AmelEntry { AmelEntry(date: Date(), data: nil, theme: theme) }
  func getSnapshot(in _: Context, completion: @escaping (AmelEntry) -> Void) {
    completion(AmelEntry(date: Date(), data: AmelData.load(), theme: theme))
  }
  func getTimeline(in _: Context, completion: @escaping (Timeline<AmelEntry>) -> Void) {
    let entry = AmelEntry(date: Date(), data: AmelData.load(), theme: theme)
    let next = Calendar.current.date(byAdding: .minute, value: 30, to: Date())!
    completion(Timeline(entries: [entry], policy: .after(next)))
  }
}

// MARK: - Small Widget

struct AmelSmallView: View {
  let entry: AmelEntry
  private var t: SalahTheme { entry.theme }
  private var activeTypes: [String] { entry.data?.types ?? [] }
  private var count: Int { entry.data?.totalCount ?? 0 }

  var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      HStack(spacing: 5) {
        Image(systemName: "star.fill")
          .foregroundColor(.salahPurple)
          .font(.system(size: 14, weight: .bold))
        Text("İBADET")
          .font(.system(size: 13, weight: .heavy))
          .foregroundColor(t.textPrimary)
          .tracking(0.3)
      }
      Spacer()
      HStack(alignment: .lastTextBaseline, spacing: 4) {
        Text("\(count)")
          .font(.system(size: 38, weight: .bold))
          .foregroundColor(t.textPrimary)
        Text("kayıt")
          .font(.system(size: 13, weight: .medium))
          .foregroundColor(t.textSecondary)
      }
      Spacer()
      HStack(spacing: 8) {
        ForEach(0..<5, id: \.self) { i in
          if i < activeTypes.count {
            Circle()
              .fill(amelColor(for: activeTypes[i]))
              .frame(width: 9, height: 9)
          } else {
            Circle()
              .strokeBorder(t.dotInactive, lineWidth: 1.5)
              .frame(width: 9, height: 9)
          }
        }
      }
    }
    .padding(14)
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
  }
}

// MARK: - Medium Widget

struct AmelMediumView: View {
  let entry: AmelEntry
  private var t: SalahTheme { entry.theme }
  private var activeTypes: Set<String> { Set(entry.data?.types ?? []) }

  let cols = Array(repeating: GridItem(.flexible(), spacing: 8), count: 4)

  var body: some View {
    VStack(alignment: .leading, spacing: 10) {
      HStack(alignment: .top) {
        VStack(alignment: .leading, spacing: 2) {
          Text("BUGÜNÜN İBADETLERİ")
            .font(.system(size: 10, weight: .heavy))
            .foregroundColor(t.textSecondary)
            .tracking(0.5)
          Text(activeTypes.isEmpty ? "Henüz kayıt yok" : "\(activeTypes.count) ibadet tamamlandı")
            .font(.system(size: 12, weight: .medium))
            .foregroundColor(t.textSecondary)
        }
        Spacer()
        Image(systemName: "star.fill")
          .foregroundColor(.salahPurple)
          .font(.system(size: 18))
      }
      LazyVGrid(columns: cols, spacing: 10) {
        ForEach(allAmelTypes, id: \.self) { type in
          let active = activeTypes.contains(type)
          let color = amelColor(for: type)
          Link(destination: URL(string: "salah://tracker/\(type)")!) {
            VStack(spacing: 4) {
              ZStack {
                RoundedRectangle(cornerRadius: 10)
                  .fill(active ? color.opacity(0.15) : t.subtleBg)
                Image(systemName: amelIcon(for: type))
                  .font(.system(size: 16, weight: .medium))
                  .foregroundColor(active ? color : t.dotInactive)
              }
              .frame(height: 38)
              Text(amelLabel(for: type))
                .font(.system(size: 8, weight: .bold))
                .foregroundColor(active ? t.textPrimary : t.textSecondary.opacity(0.6))
                .lineLimit(1)
                .minimumScaleFactor(0.8)
            }
          }
        }
      }
    }
    .padding(12)
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
  }
}

// MARK: - Entry View

struct AmelWidgetEntryView: View {
  @Environment(\.widgetFamily) var family
  let entry: AmelEntry

  var body: some View {
    switch family {
    case .systemSmall:
      AmelSmallView(entry: entry)
    default:
      AmelMediumView(entry: entry)
    }
  }
}

// MARK: - Widget Definitions (Light + Dark)

struct AmelWidget: Widget {
  let kind = "SalahAmelWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: AmelProvider(theme: .dark)) { entry in
      AmelWidgetEntryView(entry: entry)
        .salahWidgetBackground(entry.theme)
        .widgetURL(URL(string: "salah://home"))
    }
    .configurationDisplayName("İbadet Takibi")
    .description("Günlük ibadet kayıtları — koyu tema.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}

struct AmelLightWidget: Widget {
  let kind = "SalahAmelWidgetLight"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: AmelProvider(theme: .light)) { entry in
      AmelWidgetEntryView(entry: entry)
        .salahWidgetBackground(entry.theme)
        .widgetURL(URL(string: "salah://home"))
    }
    .configurationDisplayName("İbadet Takibi (Açık)")
    .description("Günlük ibadet kayıtları — açık tema.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}
