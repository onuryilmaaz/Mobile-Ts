import SwiftUI

// MARK: - Brand Colors

extension Color {
  static let salahTeal       = Color(red: 0.00, green: 0.85, blue: 0.75)
  static let salahTealDark   = Color(red: 0.00, green: 0.55, blue: 0.50)
  static let salahTealBright = Color(red: 0.10, green: 0.95, blue: 0.85)
  static let salahMint       = Color(red: 0.30, green: 1.00, blue: 0.85)
  static let salahSky        = Color(red: 0.00, green: 0.70, blue: 1.00)
  static let salahAmber      = Color(red: 1.00, green: 0.62, blue: 0.00)
  static let salahPurple     = Color(red: 0.65, green: 0.30, blue: 1.00)
  static let salahDarkPurple = Color(red: 0.50, green: 0.15, blue: 0.98)

  // Prayer base flat colors — neon parlak ana tonlar
  static let prayerFajr    = Color(red: 0.00, green: 0.55, blue: 1.00)   // electric blue
  static let prayerDhuhr   = Color(red: 0.00, green: 0.82, blue: 0.85)   // tropical cyan
  static let prayerAsr     = Color(red: 1.00, green: 0.10, blue: 0.55)   // hot magenta
  static let prayerMaghrib = Color(red: 1.00, green: 0.30, blue: 0.50)   // vivid coral pink
  static let prayerIsha    = Color(red: 0.55, green: 0.25, blue: 1.00)   // electric purple
}

// MARK: - Prayer Gradient

struct PrayerGradient {
  let base: Color
  let highlight: Color
  let glow: Color

  // Daha dramatik açı + canlı iki ton geçiş
  var linear: LinearGradient {
    LinearGradient(
      colors: [highlight, base],
      startPoint: UnitPoint(x: 0.1, y: 0.0),
      endPoint: UnitPoint(x: 0.95, y: 1.0)
    )
  }

  var softFill: LinearGradient {
    LinearGradient(
      colors: [highlight.opacity(0.32), base.opacity(0.20)],
      startPoint: .topLeading,
      endPoint: .bottomTrailing
    )
  }
}

func prayerGradient(for key: String) -> PrayerGradient {
  switch key.lowercased() {
  case "sabah", "fajr", "imsak":
    // Electric ocean → cyan
    return PrayerGradient(
      base: Color(red: 0.00, green: 0.40, blue: 1.00),         // saf deep electric blue
      highlight: Color(red: 0.10, green: 0.85, blue: 1.00),    // electric cyan
      glow: Color(red: 0.00, green: 0.65, blue: 1.00)
    )
  case "öğle", "ogle", "dhuhr":
    // Tropical cyan → mint
    return PrayerGradient(
      base: Color(red: 0.00, green: 0.70, blue: 0.80),         // deep cyan
      highlight: Color(red: 0.10, green: 1.00, blue: 0.85),    // bright mint cyan
      glow: Color(red: 0.00, green: 0.85, blue: 0.85)
    )
  case "ikindi", "asr":
    // Hot magenta → pink neon
    return PrayerGradient(
      base: Color(red: 0.92, green: 0.00, blue: 0.45),         // deep magenta
      highlight: Color(red: 1.00, green: 0.35, blue: 0.75),    // hot pink neon
      glow: Color(red: 1.00, green: 0.10, blue: 0.55)
    )
  case "akşam", "aksam", "maghrib":
    // Sunset coral — sıcak pembe-mercan ekseninde
    return PrayerGradient(
      base: Color(red: 1.00, green: 0.18, blue: 0.42),         // hot coral pink
      highlight: Color(red: 1.00, green: 0.55, blue: 0.55),    // bright coral
      glow: Color(red: 1.00, green: 0.30, blue: 0.50)
    )
  case "yatsı", "yatsi", "isha":
    // Galaxy purple — derin neon mor
    return PrayerGradient(
      base: Color(red: 0.30, green: 0.10, blue: 0.95),         // deep electric purple
      highlight: Color(red: 0.75, green: 0.35, blue: 1.00),    // bright magenta-purple
      glow: Color(red: 0.55, green: 0.25, blue: 1.00)
    )
  default:
    return PrayerGradient(
      base: .salahTeal,
      highlight: .salahTealBright,
      glow: .salahMint
    )
  }
}

// Kaza için ortak gradient — sıcak altın-turuncu, neon parlaklık
func kazaGradient() -> PrayerGradient {
  PrayerGradient(
    base: Color(red: 1.00, green: 0.42, blue: 0.00),         // deep neon orange
    highlight: Color(red: 1.00, green: 0.78, blue: 0.20),    // bright gold
    glow: Color(red: 1.00, green: 0.55, blue: 0.10)
  )
}

// MARK: - Premium Ring Gradient (canlı neon)

extension AngularGradient {
  static let salahRing = AngularGradient(
    gradient: Gradient(colors: [
      Color(red: 0.00, green: 0.78, blue: 0.70),
      Color(red: 0.10, green: 0.95, blue: 0.82),
      Color(red: 0.30, green: 1.00, blue: 0.90),
      Color(red: 0.10, green: 0.95, blue: 0.82),
      Color(red: 0.00, green: 0.78, blue: 0.70),
    ]),
    center: .center,
    startAngle: .degrees(-90),
    endAngle: .degrees(270)
  )

  static let salahKazaRing = AngularGradient(
    gradient: Gradient(colors: [
      Color(red: 1.00, green: 0.42, blue: 0.00),
      Color(red: 1.00, green: 0.65, blue: 0.10),
      Color(red: 1.00, green: 0.85, blue: 0.25),
      Color(red: 1.00, green: 0.65, blue: 0.10),
      Color(red: 1.00, green: 0.42, blue: 0.00),
    ]),
    center: .center,
    startAngle: .degrees(-90),
    endAngle: .degrees(270)
  )
}

// MARK: - Prayer Icons

func prayerCompletedIcon(for key: String) -> String {
  switch key.lowercased() {
  case "sabah", "fajr", "imsak":        return "sun.haze.fill"
  case "öğle", "ogle", "dhuhr":         return "sun.max.fill"
  case "ikindi", "asr":                 return "sun.dust.fill"
  case "akşam", "aksam", "maghrib":     return "sunset.fill"
  case "yatsı", "yatsi", "isha":        return "moon.stars.fill"
  default:                              return "checkmark"
  }
}

// MARK: - Widget Theme

enum SalahTheme {
  case light
  case dark

  var isLight: Bool { self == .light }

  // Light: temiz, sade tek katman gradient — sis efekti yok
  var cardBgGradient: LinearGradient {
    switch self {
    case .light:
      return LinearGradient(
        colors: [
          Color(red: 0.975, green: 0.980, blue: 0.990),
          Color(red: 0.945, green: 0.952, blue: 0.968),
        ],
        startPoint: .top,
        endPoint: .bottom
      )
    case .dark:
      return LinearGradient(
        colors: [
          Color(red: 0.095, green: 0.118, blue: 0.180),
          Color(red: 0.055, green: 0.075, blue: 0.130),
        ],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
      )
    }
  }

  var cardWarmth: RadialGradient {
    switch self {
    case .light:
      return RadialGradient(
        colors: [Color.clear, Color.clear],
        center: .center,
        startRadius: 0,
        endRadius: 1
      )
    case .dark:
      return RadialGradient(
        colors: [
          Color(red: 0.30, green: 0.50, blue: 0.95).opacity(0.12),
          Color.clear
        ],
        center: UnitPoint(x: 0.85, y: 0.15),
        startRadius: 5,
        endRadius: 180
      )
    }
  }

  var cardBg: Color {
    switch self {
    case .light: return Color(red: 0.96, green: 0.965, blue: 0.98)
    case .dark:  return Color(red: 0.067, green: 0.094, blue: 0.157)
    }
  }

  var textPrimary: Color {
    switch self {
    case .light: return Color(red: 0.07, green: 0.09, blue: 0.15)
    case .dark:  return .white
    }
  }

  var textSecondary: Color {
    switch self {
    case .light: return Color(red: 0.38, green: 0.42, blue: 0.50)
    case .dark:  return Color(red: 0.58, green: 0.62, blue: 0.72)
    }
  }

  var textTertiary: Color {
    switch self {
    case .light: return Color(red: 0.55, green: 0.60, blue: 0.68)
    case .dark:  return Color(red: 0.42, green: 0.46, blue: 0.55)
    }
  }

  var subtleBg: Color {
    switch self {
    case .light: return Color.black.opacity(0.035)
    case .dark:  return Color.white.opacity(0.045)
    }
  }

  var subtleBorder: Color {
    switch self {
    case .light: return Color.black.opacity(0.06)
    case .dark:  return Color.white.opacity(0.08)
    }
  }

  var ringTrack: Color {
    switch self {
    case .light: return Color.black.opacity(0.08)
    case .dark:  return Color.white.opacity(0.09)
    }
  }

  var dotInactive: Color {
    switch self {
    case .light: return Color.black.opacity(0.14)
    case .dark:  return Color.white.opacity(0.16)
    }
  }

  var topHighlight: LinearGradient {
    switch self {
    case .light:
      return LinearGradient(
        colors: [Color.clear, Color.clear],
        startPoint: .top,
        endPoint: .center
      )
    case .dark:
      return LinearGradient(
        colors: [Color.white.opacity(0.07), Color.white.opacity(0)],
        startPoint: .top,
        endPoint: .center
      )
    }
  }

  // Renkli gölge — neon parlaklık için artırıldı
  var tileShadowOpacity: Double {
    switch self {
    case .light: return 0.60
    case .dark:  return 0.0
    }
  }

  var tileShadowRadius: CGFloat {
    switch self {
    case .light: return 10
    case .dark:  return 0
    }
  }

  // İç beyaz çerçeve — rengi yıkamasın diye düşürüldü
  var tileInnerBorderOpacity: Double {
    switch self {
    case .light: return 0.22
    case .dark:  return 0.14
    }
  }
}

// MARK: - Prayer Colors (flat)

func prayerColor(for key: String) -> Color {
  switch key.lowercased() {
  case "sabah", "fajr", "imsak":        return .prayerFajr
  case "öğle", "ogle", "dhuhr":         return .prayerDhuhr
  case "ikindi", "asr":                 return .prayerAsr
  case "akşam", "aksam", "maghrib":     return .prayerMaghrib
  case "yatsı", "yatsi", "isha":        return .prayerIsha
  default:                              return .salahTeal
  }
}

// MARK: - Amel Helpers — neon canlı tonlar

func amelColor(for type: String) -> Color {
  switch type {
  case "quran":        return Color(red: 0.00, green: 0.72, blue: 0.62)   // emerald teal
  case "dhikr":        return Color(red: 0.00, green: 0.65, blue: 1.00)   // electric blue
  case "nafile":       return Color(red: 1.00, green: 0.72, blue: 0.00)   // vivid gold
  case "fasting":      return Color(red: 0.60, green: 0.32, blue: 1.00)   // electric purple
  case "sadaka":       return Color(red: 0.10, green: 0.90, blue: 0.45)   // neon green
  case "dua":          return Color(red: 0.95, green: 0.20, blue: 0.75)   // hot pink-purple
  case "memorization": return Color(red: 1.00, green: 0.35, blue: 0.10)   // neon orange-red
  default:             return .salahTeal
  }
}

func amelGradient(for type: String) -> LinearGradient {
  let base = amelColor(for: type)
  let highlight: Color
  switch type {
  case "quran":        highlight = Color(red: 0.20, green: 0.95, blue: 0.85)
  case "dhikr":        highlight = Color(red: 0.30, green: 0.90, blue: 1.00)
  case "nafile":       highlight = Color(red: 1.00, green: 0.92, blue: 0.30)
  case "fasting":      highlight = Color(red: 0.85, green: 0.55, blue: 1.00)
  case "sadaka":       highlight = Color(red: 0.35, green: 1.00, blue: 0.65)
  case "dua":          highlight = Color(red: 1.00, green: 0.50, blue: 0.95)
  case "memorization": highlight = Color(red: 1.00, green: 0.65, blue: 0.25)
  default:             highlight = .salahTealBright
  }
  return LinearGradient(
    colors: [highlight, base],
    startPoint: UnitPoint(x: 0.1, y: 0.0),
    endPoint: UnitPoint(x: 0.95, y: 1.0)
  )
}

func amelIcon(for type: String) -> String {
  switch type {
  case "quran":        return "book.fill"
  case "dhikr":        return "circle.grid.3x3.fill"
  case "nafile":       return "moon.stars.fill"
  case "fasting":      return "drop.fill"
  case "sadaka":       return "heart.fill"
  case "dua":          return "hands.sparkles.fill"
  case "memorization": return "brain.head.profile"
  default:             return "star.fill"
  }
}

func amelLabel(for type: String) -> String {
  switch type {
  case "quran":        return "Kur'an"
  case "dhikr":        return "Zikir"
  case "nafile":       return "Nafile"
  case "fasting":      return "Oruç"
  case "sadaka":       return "Sadaka"
  case "dua":          return "Dua"
  case "memorization": return "Ezberleme"
  default:             return type
  }
}

let allAmelTypes = ["quran", "dhikr", "nafile", "fasting", "sadaka", "dua", "memorization"]

// MARK: - Widget Background

extension View {
  @ViewBuilder
  func salahWidgetBackground(_ theme: SalahTheme) -> some View {
    if #available(iOS 17.0, *) {
      containerBackground(for: .widget) {
        if theme == .light {
          theme.cardBgGradient
        } else {
          ZStack {
            theme.cardBgGradient
            theme.cardWarmth
              .allowsHitTesting(false)
            theme.topHighlight
              .allowsHitTesting(false)
          }
        }
      }
    } else {
      Group {
        if theme == .light {
          background(theme.cardBgGradient)
        } else {
          background(
            ZStack {
              theme.cardBgGradient
              theme.cardWarmth
                .allowsHitTesting(false)
              theme.topHighlight
                .allowsHitTesting(false)
            }
          )
        }
      }
    }
  }
}