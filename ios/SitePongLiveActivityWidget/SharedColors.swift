import SwiftUI

// MARK: - Brand Colors

extension Color {
  static let salahTeal       = Color(red: 0.078, green: 0.722, blue: 0.651)  // #14b8a6
  static let salahTealDark   = Color(red: 0.059, green: 0.463, blue: 0.431)
  static let salahTealBright = Color(red: 0.20, green: 0.85, blue: 0.75)
  static let salahMint       = Color(red: 0.40, green: 0.92, blue: 0.80)
  static let salahSky        = Color(red: 0.024, green: 0.647, blue: 0.914)
  static let salahAmber      = Color(red: 0.961, green: 0.620, blue: 0.043)
  static let salahPurple     = Color(red: 0.545, green: 0.361, blue: 0.965)
  static let salahDarkPurple = Color(red: 0.486, green: 0.227, blue: 0.929)

  // Prayer base flat colors — günün ışık yolculuğu sırasıyla
  static let prayerFajr    = Color(red: 0.25, green: 0.62, blue: 1.00)   // şafak mavisi
  static let prayerDhuhr   = Color(red: 0.15, green: 0.80, blue: 0.85)   // öğle turkuazı
  static let prayerAsr     = Color(red: 0.94, green: 0.22, blue: 0.49)   // fuşya
  static let prayerMaghrib = Color(red: 0.95, green: 0.42, blue: 0.55)   // gün batımı pembesi
  static let prayerIsha    = Color(red: 0.45, green: 0.32, blue: 0.92)   // gece moru
}

// MARK: - Prayer Gradient

struct PrayerGradient {
  let base: Color
  let highlight: Color
  let glow: Color

  var linear: LinearGradient {
    LinearGradient(
      colors: [highlight, base],
      startPoint: .topLeading,
      endPoint: .bottomTrailing
    )
  }

  var softFill: LinearGradient {
    LinearGradient(
      colors: [highlight.opacity(0.22), base.opacity(0.14)],
      startPoint: .topLeading,
      endPoint: .bottomTrailing
    )
  }

  // İkonun beyazıyla karışacak parlak versiyon (sırf ikon için)
  var iconGradient: LinearGradient {
    LinearGradient(
      colors: [Color.white, highlight.opacity(0.85)],
      startPoint: .top,
      endPoint: .bottom
    )
  }
}

func prayerGradient(for key: String) -> PrayerGradient {
  switch key.lowercased() {
  case "sabah", "fajr", "imsak":
    // Şafak: derin mavi → cyan
    return PrayerGradient(
      base: Color(red: 0.10, green: 0.45, blue: 0.95),
      highlight: Color(red: 0.45, green: 0.78, blue: 1.00),
      glow: Color(red: 0.25, green: 0.62, blue: 1.00)
    )
  case "öğle", "ogle", "dhuhr":
    // Öğle: cyan → turkuaz
    return PrayerGradient(
      base: Color(red: 0.05, green: 0.65, blue: 0.78),
      highlight: Color(red: 0.30, green: 0.92, blue: 0.95),
      glow: Color(red: 0.15, green: 0.80, blue: 0.85)
    )
  case "ikindi", "asr":
    // İkindi: fuşya → magenta
    return PrayerGradient(
      base: Color(red: 0.85, green: 0.10, blue: 0.42),
      highlight: Color(red: 1.00, green: 0.42, blue: 0.65),
      glow: Color(red: 0.94, green: 0.22, blue: 0.49)
    )
  case "akşam", "aksam", "maghrib":
    // Akşam: gün batımı pembesi → mercan
    return PrayerGradient(
      base: Color(red: 0.90, green: 0.30, blue: 0.45),
      highlight: Color(red: 1.00, green: 0.62, blue: 0.65),
      glow: Color(red: 0.95, green: 0.42, blue: 0.55)
    )
  case "yatsı", "yatsi", "isha":
    // Yatsı: derin gece moru → indigo
    return PrayerGradient(
      base: Color(red: 0.30, green: 0.18, blue: 0.88),
      highlight: Color(red: 0.65, green: 0.52, blue: 1.00),
      glow: Color(red: 0.45, green: 0.32, blue: 0.92)
    )
  default:
    return PrayerGradient(
      base: .salahTeal,
      highlight: .salahTealBright,
      glow: .salahMint
    )
  }
}

// Kaza için ortak gradient — sadece kaza vakitlerinde
func kazaGradient() -> PrayerGradient {
  PrayerGradient(
    base: Color(red: 0.95, green: 0.50, blue: 0.08),
    highlight: Color(red: 1.00, green: 0.75, blue: 0.25),
    glow: Color.orange
  )
}

// MARK: - Prayer Icons

// Tamamlanmış vakit için: o vaktin sembolü
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

// MARK: - Premium Ring Gradient

extension AngularGradient {
  static let salahRing = AngularGradient(
    gradient: Gradient(colors: [
      Color(red: 0.06, green: 0.65, blue: 0.58),
      Color(red: 0.15, green: 0.80, blue: 0.70),
      Color(red: 0.35, green: 0.90, blue: 0.78),
      Color(red: 0.15, green: 0.80, blue: 0.70),
      Color(red: 0.06, green: 0.65, blue: 0.58),
    ]),
    center: .center,
    startAngle: .degrees(-90),
    endAngle: .degrees(270)
  )

  static let salahKazaRing = AngularGradient(
    gradient: Gradient(colors: [
      Color(red: 0.92, green: 0.45, blue: 0.05),
      Color(red: 1.00, green: 0.65, blue: 0.20),
      Color(red: 1.00, green: 0.80, blue: 0.35),
      Color(red: 1.00, green: 0.65, blue: 0.20),
      Color(red: 0.92, green: 0.45, blue: 0.05),
    ]),
    center: .center,
    startAngle: .degrees(-90),
    endAngle: .degrees(270)
  )
}

// MARK: - Widget Theme

enum SalahTheme {
  case light
  case dark

  var isLight: Bool { self == .light }

  // Light tema artık çok daha zengin — ince mavi-mor tonlamayla
  var cardBgGradient: LinearGradient {
    switch self {
    case .light:
      return LinearGradient(
        colors: [
          Color(red: 0.985, green: 0.990, blue: 1.000),  // saf üst beyaz
          Color(red: 0.920, green: 0.935, blue: 0.965),  // alt soğuk gri-mavi
        ],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
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

  // Light için çok ince renkli sıcaklık katmanı (radial)
  var cardWarmth: RadialGradient {
    switch self {
    case .light:
      return RadialGradient(
        colors: [
          Color(red: 1.00, green: 0.95, blue: 0.90).opacity(0.30),
          Color.clear
        ],
        center: UnitPoint(x: 0.85, y: 0.15),
        startRadius: 5,
        endRadius: 180
      )
    case .dark:
      return RadialGradient(
        colors: [
          Color(red: 0.30, green: 0.50, blue: 0.95).opacity(0.10),
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
        colors: [Color.white.opacity(0.30), Color.white.opacity(0)],
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

  // Tile renkli gölgesi — light'ta yoğun, dark'ta zaten glow var
  var tileShadowOpacity: Double {
    switch self {
    case .light: return 0.40
    case .dark:  return 0.0
    }
  }

  var tileShadowRadius: CGFloat {
    switch self {
    case .light: return 8
    case .dark:  return 0
    }
  }

  var tileInnerBorderOpacity: Double {
    switch self {
    case .light: return 0.35
    case .dark:  return 0.20
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

// MARK: - Amel Helpers

func amelColor(for type: String) -> Color {
  switch type {
  case "quran":        return Color(red: 0.08, green: 0.58, blue: 0.52)
  case "dhikr":        return Color(red: 0.10, green: 0.62, blue: 0.92)
  case "nafile":       return Color(red: 0.96, green: 0.62, blue: 0.10)
  case "fasting":      return Color(red: 0.54, green: 0.38, blue: 0.96)
  case "sadaka":       return Color(red: 0.24, green: 0.74, blue: 0.44)
  case "dua":          return Color(red: 0.49, green: 0.23, blue: 0.93)
  case "memorization": return Color(red: 0.92, green: 0.38, blue: 0.15)
  default:             return .salahTeal
  }
}

func amelGradient(for type: String) -> LinearGradient {
  let base = amelColor(for: type)
  let highlight: Color
  switch type {
  case "quran":        highlight = Color(red: 0.25, green: 0.78, blue: 0.72)
  case "dhikr":        highlight = Color(red: 0.30, green: 0.78, blue: 1.00)
  case "nafile":       highlight = Color(red: 1.00, green: 0.80, blue: 0.30)
  case "fasting":      highlight = Color(red: 0.72, green: 0.58, blue: 1.00)
  case "sadaka":       highlight = Color(red: 0.45, green: 0.90, blue: 0.60)
  case "dua":          highlight = Color(red: 0.70, green: 0.45, blue: 1.00)
  case "memorization": highlight = Color(red: 1.00, green: 0.58, blue: 0.30)
  default:             highlight = .salahTealBright
  }
  return LinearGradient(
    colors: [highlight, base],
    startPoint: .topLeading,
    endPoint: .bottomTrailing
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

// MARK: - Widget Background — light için layered, dark için temiz

extension View {
  @ViewBuilder
  func salahWidgetBackground(_ theme: SalahTheme) -> some View {
    if #available(iOS 17.0, *) {
      containerBackground(for: .widget) {
        ZStack {
          theme.cardBgGradient
          theme.cardWarmth                 // ince renkli sıcaklık katmanı
            .blendMode(.plusLighter)
            .allowsHitTesting(false)
          theme.topHighlight
            .blendMode(.plusLighter)
            .allowsHitTesting(false)
        }
      }
    } else {
      background(
        ZStack {
          theme.cardBgGradient
          theme.cardWarmth
            .blendMode(.plusLighter)
            .allowsHitTesting(false)
          theme.topHighlight
            .blendMode(.plusLighter)
            .allowsHitTesting(false)
        }
      )
    }
  }
}