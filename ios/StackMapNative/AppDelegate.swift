import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import CoreText

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    // Manually register vector icon fonts
    let fonts = [
      "MaterialIcons",
      "MaterialCommunityIcons",
      "Ionicons",
      "FontAwesome",
      "AntDesign",
      "Entypo",
      "EvilIcons",
      "Feather",
      "Foundation",
      "Octicons",
      "SimpleLineIcons",
      "Zocial",
      "Fontisto"
    ]
    
    for fontName in fonts {
      if let fontPath = Bundle.main.path(forResource: fontName, ofType: "ttf"),
         let fontData = NSData(contentsOfFile: fontPath),
         let dataProvider = CGDataProvider(data: fontData),
         let font = CGFont(dataProvider) {
        var error: Unmanaged<CFError>?
        if !CTFontManagerRegisterGraphicsFont(font, &error) {
          if let error = error?.takeRetainedValue() {
            let errorDescription = CFErrorCopyDescription(error)
            print("Failed to register font \(fontName): \(String(describing: errorDescription))")
          }
        }
      }
    }
    
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "StackMap",
      in: window,
      launchOptions: launchOptions
    )

    return true
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
