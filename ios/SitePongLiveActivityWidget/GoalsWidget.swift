import SwiftUI
import WidgetKit

// MARK: - Entry & Provider

struct GoalsEntry: TimelineEntry {
  let date: Date
  let data: GoalsData?
  let theme: SalahTheme
}

struct GoalsProvider: TimelineProvider {
  let theme: SalahTheme
  func placeholder(in _: Context) -> GoalsEntry { GoalsEntry(date: Date(), data: nil, theme: theme) }
  func getSnapshot(in _: Context, completion: @escaping (GoalsEntry) -> Void) {
    completion(GoalsEntry(date: Date(), data: GoalsData.load(), theme: theme))
  }
  func getTimeline(in _: Context, completion: @escaping (Timeline<GoalsEntry>) -> Void) {
    let entry = GoalsEntry(date: Date(), data: GoalsData.load(), theme: theme)
    let next = Calendar.current.date(byAdding: .minute, value: 15, to: Date())!
    completion(Timeline(entries: [entry], policy: .after(next)))
  }
}

// MARK: - Hex color helper

private func goalColor(_ hex: String) -> Color {
  var h = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
  if h.count == 6 { h = "FF" + h }
  guard h.count == 8, let v = UInt64(h, radix: 16) else { return Color.salahTeal }
  return Color(.sRGB,
    red:   Double((v >> 16) & 0xFF) / 255,
    green: Double((v >> 8)  & 0xFF) / 255,
    blue:  Double(v         & 0xFF) / 255,
    opacity: 1)
}

// MARK: - Circle Tile (AmelCircleTile pattern)

private struct GoalCircleTileContent: View {
  let goal: GoalItem
  let theme: SalahTheme

  var body: some View {
    let color = goal.isDone ? Color.salahTeal : goalColor(goal.colorHex)
    let gradient = LinearGradient(
      colors: goal.isDone
        ? [Color.salahTealBright, Color.salahTeal]
        : [goalColor(goal.colorHex).opacity(0.95), goalColor(goal.colorHex)],
      startPoint: .topLeading, endPoint: .bottomTrailing
    )

    VStack(spacing: 4) {
      ZStack {
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
        Image(systemName: goal.isDone ? "checkmark" : goal.sfSymbol)
          .font(.system(size: 13, weight: goal.isDone ? .black : .semibold))
          .foregroundColor(.white)
          .shadow(color: color.opacity(0.45), radius: 2)
      }
      .frame(width: 38, height: 38)

      Text(goal.label)
        .font(.system(size: 8, weight: goal.isDone ? .bold : .regular))
        .foregroundColor(goal.isDone
          ? color.opacity(theme == .light ? 0.95 : 1.0)
          : (theme == .light ? Color(red: 0.30, green: 0.34, blue: 0.42) : Color(red: 0.78, green: 0.82, blue: 0.92))
        )
        .lineLimit(1)
        .minimumScaleFactor(0.65)
    }
    .frame(maxWidth: .infinity)
  }
}

// Small widget: tap opens app (no buttons in small per user request)
private struct GoalCircleTileLink: View {
  let goal: GoalItem
  let theme: SalahTheme
  var body: some View {
    Link(destination: URL(string: "salah://tracker")!) {
      GoalCircleTileContent(goal: goal, theme: theme)
    }
  }
}

// Medium widget: interactive on iOS 17+
@available(iOS 17.0, *)
private struct GoalCircleTileButton: View {
  let goal: GoalItem
  let theme: SalahTheme
  var body: some View {
    Button(intent: MarkGoalIntent(activityType: goal.activity, target: goal.target)) {
      GoalCircleTileContent(goal: goal, theme: theme)
    }
    .buttonStyle(.plain)
    .disabled(goal.isDone)
  }
}

// MARK: - Small Widget (AmelSmall pattern: hero count + dots)

struct GoalsSmallView: View {
  let entry: GoalsEntry
  private var t: SalahTheme { entry.theme }
  private var goals: [GoalItem] { entry.data?.goals ?? [] }
  private var completed: Int { entry.data?.completedCount ?? 0 }
  private var total: Int { entry.data?.totalCount ?? 0 }
  private var allDone: Bool { completed > 0 && completed == total }

  private var accentGrad: LinearGradient {
    LinearGradient(
      colors: [Color.salahTealBright, Color.salahTeal],
      startPoint: .topLeading, endPoint: .bottomTrailing
    )
  }

  var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      // Header
      HStack(spacing: 4) {
        Image(systemName: allDone ? "flag.fill" : "flag")
          .font(.system(size: 12, weight: .semibold))
          .foregroundStyle(accentGrad)
          .shadow(color: Color.salahTeal.opacity(t == .light ? 0.38 : 0.0), radius: 3)
        Text("HEDEFLER")
          .font(.system(size: 10, weight: .black))
          .foregroundColor(t.textPrimary)
          .tracking(0.4)
        Spacer()
      }

      Spacer()

      // Hero count
      VStack(alignment: .leading, spacing: 0) {
        HStack(alignment: .firstTextBaseline, spacing: 4) {
          Text("\(completed)")
            .font(.system(size: 44, weight: .heavy, design: .rounded))
            .foregroundColor(allDone ? Color.salahTeal : t.textPrimary)
            .lineLimit(1)
          Text("/\(total)")
            .font(.system(size: 16, weight: .semibold))
            .foregroundColor(t.textSecondary)
            .padding(.bottom, 4)
        }
        Text(allDone ? "tüm hedefler tamam 🎉" : "günlük hedef tamamlandı")
          .font(.system(size: 10, weight: .medium))
          .foregroundColor(t.textSecondary)
          .lineLimit(1)
      }

      Spacer()

      // Goal indicator dots (like Amel)
      HStack(spacing: 5) {
        ForEach(goals, id: \.activity) { g in
          let color = goalColor(g.colorHex)
          Circle()
            .fill(g.isDone
              ? AnyShapeStyle(LinearGradient(
                  colors: [Color.salahTealBright, Color.salahTeal],
                  startPoint: .topLeading, endPoint: .bottomTrailing))
              : AnyShapeStyle(color.opacity(t == .light ? 0.12 : 0.18))
            )
            .frame(width: 10, height: 10)
            .shadow(
              color: g.isDone ? Color.salahTeal.opacity(t == .light ? 0.45 : 0.0) : .clear,
              radius: 2
            )
        }
      }
    }
    .padding(14)
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
  }
}

// MARK: - Medium Widget (AmelMedium pattern: tile grid)

struct GoalsMediumView: View {
  let entry: GoalsEntry
  private var t: SalahTheme { entry.theme }
  private var goals: [GoalItem] { entry.data?.goals ?? [] }
  private var completed: Int { entry.data?.completedCount ?? 0 }
  private var total: Int { entry.data?.totalCount ?? 0 }
  private var allDone: Bool { completed > 0 && completed == total }

  private var accentGrad: LinearGradient {
    LinearGradient(
      colors: [Color.salahTealBright, Color.salahTeal],
      startPoint: .topLeading, endPoint: .bottomTrailing
    )
  }

  // Goals are typically 6; use 4-column grid as AmelMedium
  private var columnCount: Int {
    let count = goals.count
    if count <= 4 { return max(count, 2) }
    if count <= 6 { return 3 }
    return 4
  }

  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      // Header
      HStack(alignment: .center, spacing: 6) {
        ZStack {
          if t == .dark {
            Circle()
              .fill(Color.salahTeal.opacity(0.28))
              .frame(width: 24, height: 24)
              .blur(radius: 6)
          }
          Image(systemName: allDone ? "flag.fill" : "flag")
            .font(.system(size: 12, weight: .semibold))
            .foregroundStyle(accentGrad)
            .shadow(color: Color.salahTeal.opacity(t == .light ? 0.38 : 0.0), radius: 3)
        }
        .frame(width: 16, height: 16)

        Text("GÜNLÜK HEDEFLER")
          .font(.system(size: 10, weight: .black))
          .foregroundColor(t.textSecondary)
          .tracking(0.5)

        Spacer()

        HStack(alignment: .firstTextBaseline, spacing: 2) {
          Text("\(completed)")
            .font(.system(size: 18, weight: .heavy, design: .rounded))
            .foregroundStyle(allDone ? AnyShapeStyle(accentGrad) : AnyShapeStyle(t.textPrimary))
          Text("/\(total)")
            .font(.system(size: 18, weight: .heavy, design: .rounded))
            .foregroundColor(t.textSecondary)
        }
      }

      // Tile grid — buttons on iOS 17+
      let cols = Array(repeating: GridItem(.flexible(), spacing: 6), count: columnCount)
      LazyVGrid(columns: cols, spacing: 7) {
        ForEach(goals, id: \.activity) { g in
          if #available(iOS 17.0, *) {
            GoalCircleTileButton(goal: g, theme: t)
          } else {
            GoalCircleTileLink(goal: g, theme: t)
          }
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

struct GoalsWidgetEntryView: View {
  @Environment(\.widgetFamily) var family
  let entry: GoalsEntry
  var body: some View {
    switch family {
    case .systemSmall: GoalsSmallView(entry: entry)
    default:           GoalsMediumView(entry: entry)
    }
  }
}

// MARK: - Widget Definitions

struct GoalsWidget: Widget {
  let kind = "SalahGoalsWidget"
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: GoalsProvider(theme: .dark)) { entry in
      GoalsWidgetEntryView(entry: entry)
        .salahWidgetBackground(entry.theme)
        .widgetURL(URL(string: "salah://home"))
    }
    .configurationDisplayName("Günlük Hedefler")
    .description("İbadet hedeflerinin günlük ilerlemesi — koyu tema.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}

struct GoalsLightWidget: Widget {
  let kind = "SalahGoalsWidgetLight"
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: GoalsProvider(theme: .light)) { entry in
      GoalsWidgetEntryView(entry: entry)
        .salahWidgetBackground(entry.theme)
        .widgetURL(URL(string: "salah://home"))
    }
    .configurationDisplayName("Günlük Hedefler (Açık)")
    .description("İbadet hedeflerinin günlük ilerlemesi — açık tema.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}
