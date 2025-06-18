import Foundation
import WebKit

class OfflineCacheManager {
    
    static let shared = OfflineCacheManager()
    
    private let cacheDirectory: URL
    
    private init() {
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
        cacheDirectory = documentsPath.appendingPathComponent("StackMapCache")
        
        // Create cache directory if it doesn't exist
        try? FileManager.default.createDirectory(at: cacheDirectory, withIntermediateDirectories: true)
    }
    
    func cacheResponse(_ data: Data, for url: URL) {
        let fileName = url.absoluteString.replacingOccurrences(of: "/", with: "_")
        let fileURL = cacheDirectory.appendingPathComponent(fileName)
        
        try? data.write(to: fileURL)
    }
    
    func getCachedResponse(for url: URL) -> Data? {
        let fileName = url.absoluteString.replacingOccurrences(of: "/", with: "_")
        let fileURL = cacheDirectory.appendingPathComponent(fileName)
        
        return try? Data(contentsOf: fileURL)
    }
    
    func clearCache() {
        try? FileManager.default.removeItem(at: cacheDirectory)
        try? FileManager.default.createDirectory(at: cacheDirectory, withIntermediateDirectories: true)
    }
    
    func setupOfflineCache(for webView: WKWebView) {
        // Enable offline application cache
        let websiteDataTypes = WKWebsiteDataStore.allWebsiteDataTypes()
        let dataStore = WKWebsiteDataStore.default()
        
        // Configure cache policy
        webView.configuration.websiteDataStore = dataStore
        webView.configuration.preferences.setValue(true, forKey: "offlineApplicationCacheIsEnabled")
        
        // Inject service worker registration script
        let script = """
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').then(function(registration) {
                console.log('Service Worker registered:', registration);
            }).catch(function(error) {
                console.log('Service Worker registration failed:', error);
            });
        }
        """
        
        let userScript = WKUserScript(source: script, injectionTime: .atDocumentEnd, forMainFrameOnly: true)
        webView.configuration.userContentController.addUserScript(userScript)
    }
    
    func preloadEssentialAssets() {
        // List of essential URLs to cache
        let essentialURLs = [
            "https://stackmap.app/",
            "https://stackmap.app/manifest.json",
            "https://stackmap.app/css/styles.css",
            "https://stackmap.app/js/app.js"
        ]
        
        for urlString in essentialURLs {
            guard let url = URL(string: urlString) else { continue }
            
            URLSession.shared.dataTask(with: url) { [weak self] data, response, error in
                if let data = data, error == nil {
                    self?.cacheResponse(data, for: url)
                }
            }.resume()
        }
    }
}