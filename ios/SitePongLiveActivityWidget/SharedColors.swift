import SwiftUI

// MARK: - Brand Colors

extension Color {
  static let salahTeal       = Color(red: 0.078, green: 0.722, blue: 0.651)  // #14b8a6
  static let salahTealDark   = Color(red: 0.059, green: 0.463, blue: 0.431)  // #0f766e
  static let salahSky        = Color(red: 0.024, green: 0.647, blue: 0.914)  // #06a5e9
  static let salahAmber      = Color(red: 0.961, green: 0.620, blue: 0.043)  // #f59e0b
  static let salahPurple     = Color(red: 0.545, green: 0.361, blue: 0.965)  // #8b5cf6
  static let salahDarkPurple = Color(red: 0.486, green: 0.227, blue: 0.929)  // #7c3aed
}

// MARK: - Widget Theme

enum SalahTheme {
  case light
  case dark

  var cardBg: Color {
    switch self {
    case .light: return Color(red: 0.96, green: 0.965, blue: 0.98)   // #f5f7fa soft warm white
    case .dark:  return Color(red: 0.067, green: 0.094, blue: 0.157) // #111828 deep slate
    }
  }

  var textPrimary: Color {
    switch self {
    case .light: return Color(red: 0.09, green: 0.11, blue: 0.17)
    case .dark:  return .white
    }
  }

  var textSecondary: Color {
    switch self {
    case .light: return Color(red: 0.42, green: 0.45, blue: 0.53)
    case .dark:  return Color(red: 0.55, green: 0.58, blue: 0.67)
    }
  }

  var subtleBg: Color {
    switch self {
    case .light: return Color.black.opacity(0.04)
    case .dark:  return Color.white.opacity(0.07)
    }
  }

  var ringTrack: Color {
    switch self {
    case .light: return Color.black.opacity(0.06)
    case .dark:  return Color.white.opacity(0.10)
    }
  }

  var dotInactive: Color {
    switch self {
    case .light: return Color.black.opacity(0.12)
    case .dark:  return Color.white.opacity(0.15)
    }
  }
}

// MARK: - Prayer Colors

func prayerColor(for key: String) -> Color {
  switch key.lowercased() {
  case "sabah", "fajr", "imsak":        return .salahSky
  case "öğle", "ogle", "dhuhr":         return .salahSky
  case "ikindi", "asr":                 return .salahAmber
  case "akşam", "aksam", "maghrib":     return .salahPurple
  case "yatsı", "yatsi", "isha":        return .salahDarkPurple
  default:                              return .salahTeal
  }
}

// MARK: - Amel Helpers

func amelColor(for type: String) -> Color {
  switch type {
  case "quran":        return .salahTealDark
  case "dhikr":        return .salahSky
  case "nafile":       return .salahAmber
  case "fasting":      return .salahPurple
  case "sadaka":       return Color(red: 0.239, green: 0.741, blue: 0.443)
  case "dua":          return .salahDarkPurple
  case "memorization": return Color(red: 0.918, green: 0.376, blue: 0.149)
  default:             return .salahTeal
  }
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
      containerBackground(theme.cardBg, for: .widget)
    } else {
      background(theme.cardBg)
    }
  }
}
