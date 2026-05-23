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

// MARK: - Circle Tile

private struct AmelCircleTile: View {
  let type: String
  let isActive: Bool
  let theme: SalahTheme

  var body: some View {
    Link(destination: URL(string: "salah://tracker/\(type)")!) {
      tileContent
    }
  }

  @ViewBuilder
  private var tileContent: some View {
    let color = amelColor(for: type)
    let gradient = amelGradient(for: type)
    let icon = amelIcon(for: type)

    VStack(spacing: 4) {
      ZStack {
        if isActive {
          // Glow halo (dark mode only)
          if theme == .dark {
            Circle()
              .fill(color.opacity(0.42))
              .frame(width: 38, height: 38)
              .blur(radius: 8)
          }
          // Main circle
          Circle()
            .fill(gradient)
            .frame(width: 32, height: 32)
            .shadow(
              color: color.opacity(theme == .light ? 0.38 : 0.0),
              radius: 8, x: 0, y: 3
            )
          // Top shine
          Circle()
            .fill(LinearGradient(
              colors: [Color.white.opacity(0.28), Color.white.opacity(0)],
              startPoint: .top,
              endPoint: .center
            ))
            .frame(width: 32, height: 32)
            .allowsHitTesting(false)
          Image(systemName: icon)
            .font(.system(size: 13, weight: .semibold))
            .foregroundColor(.white)
            .shadow(color: color.opacity(0.45), radius: 2)

        } else {
          // Pasif: renk kimliği korunur, sadece soluk
          Circle()
            .fill(color.opacity(theme == .light ? 0.07 : 0.11))
            .frame(width: 32, height: 32)
          Circle()
            .strokeBorder(
              color.opacity(theme == .light ? 0.20 : 0.25),
              lineWidth: 1.2
            )
            .frame(width: 32, height: 32)
          Image(systemName: icon)
            .font(.system(size: 13, weight: .medium))
            .foregroundColor(color.opacity(theme == .light ? 0.38 : 0.48))
        }
      }
      .frame(width: 38, height: 38)

      Text(amelLabel(for: type))
        .font(.system(size: 8, weight: isActive ? .bold : .regular))
        .foregroundColor(isActive
          ? color.opacity(theme == .light ? 0.90 : 1.0)
          : (theme == .light ? Color(red: 0.50, green: 0.54, blue: 0.62) : Color(red: 0.48, green: 0.52, blue: 0.62))
        )
        .lineLimit(1)
        .minimumScaleFactor(0.65)
    }
    .frame(maxWidth: .infinity)
  }
}

// MARK: - Small Widget

struct AmelSmallView: View {
  let entry: AmelEntry
  private var t: SalahTheme { entry.theme }
  private var activeTypes: [String] { entry.data?.types ?? [] }
  private var totalCount: Int { entry.data?.totalCount ?? 0 }
  private var doneTypes: Int { activeTypes.count }

  private var accentGrad: LinearGradient {
    LinearGradient(
      colors: [Color.salahPurple, Color.salahDarkPurple],
      startPoint: .topLeading, endPoint: .bottomTrailing
    )
  }

  var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      // Header
      HStack(spacing: 4) {
        Image(systemName: "moon.stars.fill")
          .font(.system(size: 12, weight: .semibold))
          .foregroundStyle(accentGrad)
          .shadow(color: Color.salahPurple.opacity(t == .light ? 0.38 : 0.0), radius: 3)
        Text("İBADET")
          .font(.system(size: 10, weight: .black))
          .foregroundColor(t.textPrimary)
          .tracking(0.4)
        Spacer()
      }

      Spacer()

      // Hero count
      VStack(alignment: .leading, spacing: 0) {
        HStack(alignment: .firstTextBaseline, spacing: 4) {
          Text("\(totalCount)")
            .font(.system(size: 44, weight: .heavy, design: .rounded))
            .foregroundColor(t.textPrimary)
            .lineLimit(1)
          Text("kayıt")
            .font(.system(size: 13, weight: .semibold))
            .foregroundColor(t.textSecondary)
            .padding(.bottom, 4)
        }
        if doneTypes > 0 {
          Text("\(doneTypes) farklı ibadet")
            .font(.system(size: 10, weight: .medium))
            .foregroundColor(t.textSecondary)
        }
      }

      Spacer()

      // Renk kimlikli göstergeler — dairesel
      HStack(spacing: 5) {
        ForEach(allAmelTypes, id: \.self) { type in
          let isActive = activeTypes.contains(type)
          let color = amelColor(for: type)
          Circle()
            .fill(isActive
              ? AnyShapeStyle(amelGradient(for: type))
              : AnyShapeStyle(color.opacity(t == .light ? 0.12 : 0.18))
            )
            .frame(width: 10, height: 10)
            .shadow(
              color: isActive ? color.opacity(t == .light ? 0.45 : 0.0) : .clear,
              radius: 2
            )
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
  private var doneCount: Int { activeTypes.count }

  private var accentGrad: LinearGradient {
    LinearGradient(
      colors: [Color.salahPurple, Color.salahDarkPurple],
      startPoint: .topLeading, endPoint: .bottomTrailing
    )
  }

  let cols = Array(repeating: GridItem(.flexible(), spacing: 6), count: 4)

  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      // Header
      HStack(alignment: .center, spacing: 6) {
        ZStack {
          if t == .dark {
            Circle()
              .fill(Color.salahPurple.opacity(0.28))
              .frame(width: 24, height: 24)
              .blur(radius: 6)
          }
          Image(systemName: "moon.stars.fill")
            .font(.system(size: 12, weight: .semibold))
            .foregroundStyle(accentGrad)
            .shadow(color: Color.salahPurple.opacity(t == .light ? 0.38 : 0.0), radius: 3)
        }
        .frame(width: 16, height: 16)

        Text("BUGÜNÜN İBADETLERİ")
          .font(.system(size: 10, weight: .black))
          .foregroundColor(t.textSecondary)
          .tracking(0.5)

        Spacer()

        HStack(alignment: .firstTextBaseline, spacing: 2) {
          Text("\(doneCount)")
            .font(.system(size: 18, weight: .heavy, design: .rounded))
            .foregroundStyle(doneCount > 0 ? AnyShapeStyle(accentGrad) : AnyShapeStyle(t.textSecondary))
          Text("/7")
            .font(.system(size: 18, weight: .heavy, design: .rounded))
            .foregroundColor(t.textSecondary)
        }
      }

      // Dairesel ibadet tile grid
      LazyVGrid(columns: cols, spacing: 7) {
        ForEach(allAmelTypes, id: \.self) { type in
          AmelCircleTile(
            type: type,
            isActive: activeTypes.contains(type),
            theme: t
          )
        }
      }
    }
    .padding(.horizontal, 14)
    .padding(.top, 12)
    .padding(.bottom, 10)
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
