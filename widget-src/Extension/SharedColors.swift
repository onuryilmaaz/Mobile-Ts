import SwiftUI
import WidgetKit

// MARK: - Brand Colors

extension Color {
  static let salahTeal       = Color(red: 0.00, green: 0.60, blue: 0.55)
  static let salahTealDark   = Color(red: 0.00, green: 0.42, blue: 0.38)
  static let salahTealBright = Color(red: 0.10, green: 0.78, blue: 0.72)
  static let salahMint       = Color(red: 0.20, green: 0.85, blue: 0.75)
  static let salahSky        = Color(red: 0.10, green: 0.48, blue: 0.82)
  static let salahAmber      = Color(red: 0.85, green: 0.52, blue: 0.00)
  static let salahPurple     = Color(red: 0.45, green: 0.22, blue: 0.82)
  static let salahDarkPurple = Color(red: 0.32, green: 0.10, blue: 0.70)

  // Prayer base flat colors — doğal, mücevher tonlar
  static let prayerFajr    = Color(red: 0.15, green: 0.32, blue: 0.82)   // cobalt blue
  static let prayerDhuhr   = Color(red: 0.00, green: 0.52, blue: 0.80)   // sapphire
  static let prayerAsr     = Color(red: 0.82, green: 0.50, blue: 0.05)   // amber gold
  static let prayerMaghrib = Color(red: 0.80, green: 0.22, blue: 0.20)   // garnet
  static let prayerIsha    = Color(red: 0.35, green: 0.18, blue: 0.72)   // amethyst
}

// MARK: - Prayer Gradient

struct PrayerGradient {
  let base: Color
  let highlight: Color
  let glow: Color

  var linear: LinearGradient {
    LinearGradient(
      colors: [highlight, base],
      startPoint: UnitPoint(x: 0.1, y: 0.0),
      endPoint: UnitPoint(x: 0.95, y: 1.0)
    )
  }

  var softFill: LinearGradient {
    LinearGradient(
      colors: [highlight.opacity(0.28), base.opacity(0.16)],
      startPoint: .topLeading,
      endPoint: .bottomTrailing
    )
  }
}

func prayerGradient(for key: String) -> PrayerGradient {
  switch key.lowercased() {
  case "sabah", "fajr", "imsak":
    // Gece mavisi → şafak cobalt — tan yeri öncesi derin gökyüzü
    return PrayerGradient(
      base: Color(red: 0.08, green: 0.12, blue: 0.55),
      highlight: Color(red: 0.42, green: 0.55, blue: 0.98),
      glow: Color(red: 0.25, green: 0.38, blue: 0.88)
    )
  case "öğle", "ogle", "dhuhr":
    // Safir → gökyüzü mavisi — açık öğle seması
    return PrayerGradient(
      base: Color(red: 0.00, green: 0.48, blue: 0.78),
      highlight: Color(red: 0.15, green: 0.75, blue: 0.98),
      glow: Color(red: 0.00, green: 0.60, blue: 0.90)
    )
  case "ikindi", "asr":
    // Kehribar → altın bal — altın saat ışığı
    return PrayerGradient(
      base: Color(red: 0.72, green: 0.35, blue: 0.00),
      highlight: Color(red: 0.98, green: 0.70, blue: 0.15),
      glow: Color(red: 0.88, green: 0.52, blue: 0.05)
    )
  case "akşam", "aksam", "maghrib":
    // Garnet → mercan turuncu — gün batımı kızıllığı
    return PrayerGradient(
      base: Color(red: 0.72, green: 0.12, blue: 0.18),
      highlight: Color(red: 0.98, green: 0.45, blue: 0.25),
      glow: Color(red: 0.85, green: 0.28, blue: 0.22)
    )
  case "yatsı", "yatsi", "isha":
    // Ametist → zengin mor — gece seması
    return PrayerGradient(
      base: Color(red: 0.15, green: 0.08, blue: 0.50),
      highlight: Color(red: 0.50, green: 0.28, blue: 0.92),
      glow: Color(red: 0.30, green: 0.16, blue: 0.75)
    )
  default:
    return PrayerGradient(
      base: .salahTeal,
      highlight: .salahTealBright,
      glow: .salahMint
    )
  }
}

// Kaza için ortak gradient — derin kehribar altın
func kazaGradient() -> PrayerGradient {
  PrayerGradient(
    base: Color(red: 0.75, green: 0.38, blue: 0.00),
    highlight: Color(red: 1.00, green: 0.72, blue: 0.15),
    glow: Color(red: 0.90, green: 0.52, blue: 0.05)
  )
}

// MARK: - Premium Ring Gradient

extension AngularGradient {
  static let salahRing = AngularGradient(
    gradient: Gradient(colors: [
      Color(red: 0.00, green: 0.55, blue: 0.50),
      Color(red: 0.08, green: 0.72, blue: 0.65),
      Color(red: 0.20, green: 0.85, blue: 0.75),
      Color(red: 0.08, green: 0.72, blue: 0.65),
      Color(red: 0.00, green: 0.55, blue: 0.50),
    ]),
    center: .center,
    startAngle: .degrees(-90),
    endAngle: .degrees(270)
  )

  static let salahKazaRing = AngularGradient(
    gradient: Gradient(colors: [
      Color(red: 0.75, green: 0.38, blue: 0.00),
      Color(red: 0.92, green: 0.58, blue: 0.05),
      Color(red: 1.00, green: 0.75, blue: 0.18),
      Color(red: 0.92, green: 0.58, blue: 0.05),
      Color(red: 0.75, green: 0.38, blue: 0.00),
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
          Color(red: 0.085, green: 0.105, blue: 0.175),
          Color(red: 0.050, green: 0.068, blue: 0.125),
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
          Color(red: 0.20, green: 0.38, blue: 0.80).opacity(0.10),
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
    case .light: return Color(red: 0.960, green: 0.965, blue: 0.980)
    case .dark:  return Color(red: 0.065, green: 0.088, blue: 0.150)
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
        colors: [Color.white.opacity(0.06), Color.white.opacity(0)],
        startPoint: .top,
        endPoint: .center
      )
    }
  }

  var tileShadowOpacity: Double {
    switch self {
    case .light: return 0.45
    case .dark:  return 0.0
    }
  }

  var tileShadowRadius: CGFloat {
    switch self {
    case .light: return 10
    case .dark:  return 0
    }
  }

  var tileInnerBorderOpacity: Double {
    switch self {
    case .light: return 0.20
    case .dark:  return 0.12
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

// MARK: - Amel Helpers — doğal mücevher tonlar

func amelColor(for type: String) -> Color {
  switch type {
  case "quran":        return Color(red: 0.08, green: 0.55, blue: 0.42)   // zümrüt yeşil
  case "dhikr":        return Color(red: 0.10, green: 0.42, blue: 0.78)   // safir mavi
  case "nafile":       return Color(red: 0.72, green: 0.50, blue: 0.00)   // derin altın
  case "fasting":      return Color(red: 0.42, green: 0.22, blue: 0.72)   // ametist mor
  case "sadaka":       return Color(red: 0.12, green: 0.55, blue: 0.38)   // orman yeşili
  case "dua":          return Color(red: 0.72, green: 0.18, blue: 0.45)   // gül kuvars kırmızısı
  case "memorization": return Color(red: 0.75, green: 0.30, blue: 0.08)   // kehribar kiremit
  default:             return .salahTeal
  }
}

func amelGradient(for type: String) -> LinearGradient {
  let base = amelColor(for: type)
  let highlight: Color
  switch type {
  case "quran":        highlight = Color(red: 0.22, green: 0.82, blue: 0.65)
  case "dhikr":        highlight = Color(red: 0.32, green: 0.68, blue: 0.98)
  case "nafile":       highlight = Color(red: 0.98, green: 0.80, blue: 0.22)
  case "fasting":      highlight = Color(red: 0.72, green: 0.48, blue: 0.95)
  case "sadaka":       highlight = Color(red: 0.28, green: 0.82, blue: 0.58)
  case "dua":          highlight = Color(red: 0.95, green: 0.45, blue: 0.68)
  case "memorization": highlight = Color(red: 0.98, green: 0.60, blue: 0.25)
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

  // iOS 16: wraps view in ZStack with AccessoryWidgetBackground
  // iOS 17+: no-op (containerBackground handles it at the widget level)
  @ViewBuilder
  func withAccessoryBackground() -> some View {
    if #available(iOS 17.0, *) {
      self
    } else {
      ZStack {
        AccessoryWidgetBackground()
        self
      }
    }
  }

  // Apply on the widget's entry view inside StaticConfiguration
  @ViewBuilder
  func lockWidgetBackground() -> some View {
    if #available(iOS 17.0, *) {
      containerBackground(for: .widget) { AccessoryWidgetBackground() }
    } else {
      self
    }
  }
}
