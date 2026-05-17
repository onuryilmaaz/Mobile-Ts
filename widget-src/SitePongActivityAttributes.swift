import ActivityKit
import Foundation

public struct SitePongActivityAttributes: ActivityAttributes {
  public struct ContentState: Codable, Hashable {
    public var prayerName: String
    public var nextPrayer: String
    public var endTimeMs: Double

    public init(prayerName: String, nextPrayer: String, endTimeMs: Double) {
      self.prayerName = prayerName
      self.nextPrayer = nextPrayer
      self.endTimeMs = endTimeMs
    }
  }

  public init() {}
}
