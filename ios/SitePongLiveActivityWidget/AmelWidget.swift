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
      HStack(spacing: 6) {
        Image(systemName: "star.fill")
          .foregroundStyle(
            LinearGradient(
              colors: [Color(red: 0.72, green: 0.55, blue: 1.00), Color.salahPurple],
              startPoint: .topLeading,
              endPoint: .bottomTrailing
            )
          )
          .font(.system(size: 14, weight: .bold))
        Text("İBADET")
          .font(.system(size: 12, weight: .black))
          .foregroundColor(t.textPrimary)
          .tracking(0.6)
        Spacer()
      }
      Spacer()
      HStack(alignment: .lastTextBaseline, spacing: 5) {
        Text("\(count)")
          .font(.system(size: 40, weight: .heavy, design: .rounded))
          .foregroundColor(t.textPrimary)
        Text("kayıt")
          .font(.system(size: 13, weight: .bold))
          .foregroundColor(t.textSecondary)
      }
      Spacer()
      HStack(spacing: 9) {
        ForEach(0..<5, id: \.self) { i in
          if i < activeTypes.count {
            Circle()
              .fill(amelGradient(for: activeTypes[i]))
              .frame(width: 9, height: 9)
          } else {
            Circle()
              .strokeBorder(t.dotInactive, lineWidth: 1.5)
              .frame(width: 9, height: 9)
          }
        }
      }
    }
    .padding(16)
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
  }
}

// MARK: - Amel Tile

struct AmelTile: View {
  let type: String
  let isActive: Bool
  let theme: SalahTheme

  var body: some View {
    Link(destination: URL(string: "salah://tracker/\(type)")!) {
      content
    }
  }

  @ViewBuilder
  private var content: some View {
    let color = amelColor(for: type)
    let gradient = amelGradient(for: type)

    VStack(spacing: 5) {
      ZStack {
        if isActive {
          if theme == .dark {
            RoundedRectangle(cornerRadius: 12, style: .continuous)
              .fill(color.opacity(0.40))
              .blur(radius: 6)
              .frame(height: 32)
          }

          Image(systemName: amelIcon(for: type))
            .font(.system(size: 17, weight: .semibold))
            .foregroundStyle(gradient)
            .shadow(
              color: theme == .light ? color.opacity(0.35) : .clear,
              radius: 3, x: 0, y: 1
            )
        } else {
          Image(systemName: amelIcon(for: type))
            .font(.system(size: 16, weight: .medium))
            .foregroundColor(theme.dotInactive)
        }
      }
      .frame(height: 22)

      Text(amelLabel(for: type))
        .font(.system(size: 9, weight: .bold))
        .foregroundColor(isActive ? color : theme.textSecondary)
        .lineLimit(1)
        .minimumScaleFactor(0.8)
    }
    .frame(height: 50)
    .frame(maxWidth: .infinity)
    .background(
      ZStack {
        RoundedRectangle(cornerRadius: 13, style: .continuous)
          .fill(isActive ? AnyShapeStyle(
            LinearGradient(
              colors: [color.opacity(theme == .light ? 0.18 : 0.22), color.opacity(theme == .light ? 0.08 : 0.10)],
              startPoint: .topLeading,
              endPoint: .bottomTrailing
            )
          ) : AnyShapeStyle(theme.subtleBg))

        if isActive {
          RoundedRectangle(cornerRadius: 13, style: .continuous)
            .strokeBorder(color.opacity(theme == .light ? 0.40 : 0.30), lineWidth: 0.8)
        } else {
          RoundedRectangle(cornerRadius: 13, style: .continuous)
            .strokeBorder(theme.subtleBorder, lineWidth: 0.6)
        }
      }
    )
  }
}

// MARK: - Medium Widget

struct AmelMediumView: View {
  let entry: AmelEntry
  private var t: SalahTheme { entry.theme }
  private var activeTypes: Set<String> { Set(entry.data?.types ?? []) }

  let cols = Array(repeating: GridItem(.flexible(), spacing: 9), count: 4)

  var body: some View {
    VStack(alignment: .leading, spacing: 12) {
      HStack(alignment: .top) {
        VStack(alignment: .leading, spacing: 3) {
          Text("BUGÜNÜN İBADETLERİ")
            .font(.system(size: 10, weight: .black))
            .foregroundColor(t.textSecondary)
            .tracking(0.7)
          Text(activeTypes.isEmpty ? "Henüz kayıt yok" : "\(activeTypes.count) ibadet tamamlandı")
            .font(.system(size: 13, weight: .bold))
            .foregroundColor(t.textPrimary)
        }
        Spacer()
        ZStack {
          if t == .dark {
            RoundedRectangle(cornerRadius: 10, style: .continuous)
              .fill(Color.salahPurple.opacity(0.25))
              .blur(radius: 5)
              .frame(width: 30, height: 30)
          }
          Image(systemName: "star.fill")
            .foregroundStyle(
              LinearGradient(
                colors: [Color(red: 0.78, green: 0.60, blue: 1.00), Color.salahPurple],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
              )
            )
            .font(.system(size: 19, weight: .semibold))
            .shadow(
              color: t == .light ? Color.salahPurple.opacity(0.35) : .clear,
              radius: 3, x: 0, y: 1
            )
        }
      }

      LazyVGrid(columns: cols, spacing: 9) {
        ForEach(allAmelTypes, id: \.self) { type in
          AmelTile(
            type: type,
            isActive: activeTypes.contains(type),
            theme: t
          )
        }
      }
    }
    .padding(16)
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

// MARK: - Widget Definitions

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