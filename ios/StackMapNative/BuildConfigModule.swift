import Foundation
import React

/**
 * Native module to expose BuildConfig constants to React Native JavaScript
 * This allows JavaScript to read build-time configuration from Info.plist
 */
@objc(BuildConfigModule)
class BuildConfigModule: NSObject {

  @objc
  func constantsToExport() -> [String: Any]! {
    var constants = [String: Any]()

    // Read BUILD_TYPE_ENV from Info.plist
    if let buildTypeEnv = Bundle.main.object(forInfoDictionaryKey: "BUILD_TYPE_ENV") as? String {
      constants["BUILD_TYPE_ENV"] = buildTypeEnv
    } else {
      // Default to prod if not set
      constants["BUILD_TYPE_ENV"] = "prod"
    }

    return constants
  }

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
}
