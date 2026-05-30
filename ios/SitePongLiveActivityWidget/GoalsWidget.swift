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

  func placeholder(in _: Context) -> GoalsEntry {
    GoalsEntry(date: Date(), data: nil, theme: theme)
  }
  func getSnapshot(in _: Context, completion: @escaping (GoalsEntry) -> Void) {
    completion(GoalsEntry(date: Date(), data: GoalsData.load(), theme: theme))
  }
  func getTimeline(in _: Context, completion: @escaping (Timeline<GoalsEntry>) -> Void) {
    let entry = GoalsEntry(date: Date(), data: GoalsData.load(), theme: theme)
    let next = Calendar.current.date(byAdding: .minute, value: 15, to: Date())!
    completion(Timeline(entries: [entry], policy: .after(next)))
  }
}

// MARK: - Color helper

private func hexColor(_ hex: String) -> Color {
  var h = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
  if h.count == 6 { h = "FF" + h }
  guard h.count == 8, let val = UInt64(h, radix: 16) else { return Color.salahTeal }
  return Color(.sRGB,
    red:   Double((val >> 16) & 0xFF) / 255,
    green: Double((val >> 8)  & 0xFF) / 255,
    blue:  Double(val         & 0xFF) / 255,
    opacity: 1
  )
}

// MARK: - Goal Button Tile

@available(iOS 17.0, *)
private struct GoalTile: View {
  let goal: GoalItem
  let theme: SalahTheme

  private var color: Color { hexColor(goal.colorHex) }
  private var done: Bool   { goal.isDone }

  var body: some View {
    Button(intent: MarkGoalIntent(activityType: goal.activity, target: goal.target)) {
      tileBody
    }
    .buttonStyle(.plain)
  }

  @ViewBuilder
  private var tileBody: some View {
    VStack(spacing: 5) {
      // Icon + checkmark
      ZStack(alignment: .topTrailing) {
        ZStack {
          Circle()
            .fill(done
              ? Color.salahTeal.opacity(theme == .dark ? 0.25 : 0.15)
              : color.opacity(theme == .dark ? 0.18 : 0.10)
            )
            .frame(width: 36, height: 36)

          Image(systemName: done ? "checkmark" : goal.sfSymbol)
            .font(.system(size: 15, weight: done ? .black : .semibold))
            .foregroundColor(done ? Color.salahTeal : color)
        }
        if done {
          Circle()
            .fill(Color.salahTeal)
            .frame(width: 10, height: 10)
            .overlay(
              Image(systemName: "checkmark")
                .font(.system(size: 5.5, weight: .black))
                .foregroundColor(.white)
            )
            .offset(x: 3, y: -3)
        }
      }
      .frame(width: 36, height: 36)

      // Label
      Text(goal.label)
        .font(.system(size: 9.5, weight: done ? .black : .semibold))
        .foregroundColor(done ? Color.salahTeal : theme.textPrimary)
        .lineLimit(1)
        .minimumScaleFactor(0.7)

      // Progress fraction
      Text("\(goal.progress)/\(goal.target)")
        .font(.system(size: 8, weight: .medium, design: .monospaced))
        .foregroundColor(done ? Color.salahTeal.opacity(0.8) : theme.textSecondary)
    }
    .frame(maxWidth: .infinity)
    .padding(.vertical, 8)
    .background(
      RoundedRectangle(cornerRadius: 12)
        .fill(done
          ? Color.salahTeal.opacity(theme == .dark ? 0.08 : 0.05)
          : color.opacity(theme == .dark ? 0.06 : 0.04)
        )
    )
    .overlay(
      RoundedRectangle(cornerRadius: 12)
        .strokeBorder(
          done ? Color.salahTeal.opacity(0.5) : color.opacity(0.18),
          lineWidth: done ? 1.2 : 0.8
        )
    )
  }
}

// Fallback tile for iOS 16 (no intent, just shows state)
private struct GoalTileFallback: View {
  let goal: GoalItem
  let theme: SalahTheme
  private var color: Color { hexColor(goal.colorHex) }

  var body: some View {
    Link(destination: URL(string: "salah://tracker/\(goal.activity)")!) {
      VStack(spacing: 5) {
        Circle()
          .fill(goal.isDone ? Color.salahTeal.opacity(0.18) : color.opacity(0.12))
          .frame(width: 36, height: 36)
          .overlay(
            Image(systemName: goal.isDone ? "checkmark" : goal.sfSymbol)
              .font(.system(size: 15, weight: .semibold))
              .foregroundColor(goal.isDone ? Color.salahTeal : color)
          )
        Text(goal.label)
          .font(.system(size: 9.5, weight: .semibold))
          .foregroundColor(goal.isDone ? Color.salahTeal : theme.textPrimary)
          .lineLimit(1).minimumScaleFactor(0.7)
        Text("\(goal.progress)/\(goal.target)")
          .font(.system(size: 8, weight: .medium, design: .monospaced))
          .foregroundColor(theme.textSecondary)
      }
      .frame(maxWidth: .infinity)
      .padding(.vertical, 8)
      .background(RoundedRectangle(cornerRadius: 12).fill(color.opacity(0.05)))
      .overlay(RoundedRectangle(cornerRadius: 12).strokeBorder(color.opacity(0.18), lineWidth: 0.8))
    }
  }
}

// MARK: - Header

private struct GoalsHeader: View {
  let completed: Int
  let total: Int
  let theme: SalahTheme
  let compact: Bool

  private var allDone: Bool { completed > 0 && completed == total }

  var body: some View {
    HStack(spacing: 5) {
      Image(systemName: allDone ? "flag.fill" : "flag")
        .font(.system(size: compact ? 10 : 12, weight: .black))
        .foregroundColor(Color.salahTeal)
      Text("HEDEFLER")
        .font(.system(size: compact ? 10 : 11, weight: .black))
        .foregroundColor(theme.textPrimary)
        .tracking(0.5)
      Spacer()
      HStack(alignment: .firstTextBaseline, spacing: 1) {
        Text("\(completed)")
          .font(.system(size: compact ? 13 : 15, weight: .heavy, design: .rounded))
          .foregroundColor(allDone ? Color.salahTeal : theme.textPrimary)
        Text("/\(total)")
          .font(.system(size: compact ? 10 : 12, weight: .bold))
          .foregroundColor(theme.textSecondary)
      }
    }
  }
}

// MARK: - Small View (2×3 grid)

struct GoalsSmallView: View {
  let entry: GoalsEntry
  private var t: SalahTheme { entry.theme }
  private var goals: [GoalItem] { entry.data?.goals ?? [] }
  private var completed: Int { entry.data?.completedCount ?? 0 }
  private var total: Int { entry.data?.totalCount ?? 0 }

  private let cols = Array(repeating: GridItem(.flexible(), spacing: 6), count: 3)

  var body: some View {
    VStack(spacing: 8) {
      GoalsHeader(completed: completed, total: total, theme: t, compact: true)

      LazyVGrid(columns: cols, spacing: 6) {
        ForEach(Array(goals.prefix(6)), id: \.activity) { g in
          if #available(iOS 17.0, *) {
            GoalTile(goal: g, theme: t)
          } else {
            GoalTileFallback(goal: g, theme: t)
          }
        }
      }
    }
    .padding(12)
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
  }
}

// MARK: - Medium View (3×2 grid)

struct GoalsMediumView: View {
  let entry: GoalsEntry
  private var t: SalahTheme { entry.theme }
  private var goals: [GoalItem] { entry.data?.goals ?? [] }
  private var completed: Int { entry.data?.completedCount ?? 0 }
  private var total: Int { entry.data?.totalCount ?? 0 }

  private let cols = Array(repeating: GridItem(.flexible(), spacing: 8), count: 3)

  var body: some View {
    VStack(spacing: 10) {
      GoalsHeader(completed: completed, total: total, theme: t, compact: false)

      Rectangle()
        .fill(t.textSecondary.opacity(0.08))
        .frame(height: 1)

      LazyVGrid(columns: cols, spacing: 8) {
        ForEach(Array(goals.prefix(6)), id: \.activity) { g in
          if #available(iOS 17.0, *) {
            GoalTile(goal: g, theme: t)
          } else {
            GoalTileFallback(goal: g, theme: t)
          }
        }
      }
    }
    .padding(.horizontal, 14)
    .padding(.top, 12)
    .padding(.bottom, 10)
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
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
    .description("İbadet hedeflerine dokun, tamamlandı olarak işaretle.")
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
    .description("İbadet hedeflerine dokun, tamamlandı olarak işaretle.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}
