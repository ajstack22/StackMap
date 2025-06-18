import UIKit
import WebKit

class WebViewController: UIViewController {
    
    // MARK: - Properties
    
    private var webView: WKWebView!
    private var progressView: UIProgressView!
    private var refreshControl: UIRefreshControl!
    private var offlineView: UIView!
    private var activityIndicator: UIActivityIndicatorView!
    
    private let stackMapURL = "https://stackmap.app"
    private let offlineHTMLPath = "offline.html"
    
    // MARK: - Lifecycle
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        setupWebView()
        setupUI()
        setupNotifications()
        loadStackMap()
    }
    
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        navigationController?.setNavigationBarHidden(true, animated: animated)
    }
    
    override var prefersStatusBarHidden: Bool {
        return false
    }
    
    override var preferredStatusBarStyle: UIStatusBarStyle {
        return .lightContent
    }
    
    // MARK: - Setup
    
    private func setupWebView() {
        let configuration = WKWebViewConfiguration()
        
        // Enable JavaScript
        configuration.preferences.javaScriptEnabled = true
        
        // Enable local storage
        configuration.websiteDataStore = WKWebsiteDataStore.default()
        
        // Allow inline media playback
        configuration.allowsInlineMediaPlayback = true
        configuration.mediaTypesRequiringUserActionForPlayback = []
        
        // Create user content controller for JavaScript injection
        let userContentController = WKUserContentController()
        
        // Add JavaScript message handlers
        userContentController.add(self, name: "stackMapiOS")
        
        // Inject JavaScript to handle iOS-specific features
        let jsSource = """
        window.isStackMapiOS = true;
        
        // Override window.open to handle in-app
        window.open = function(url, target) {
            window.webkit.messageHandlers.stackMapiOS.postMessage({
                action: 'openURL',
                url: url
            });
            return null;
        };
        
        // Add iOS-specific class to body
        document.addEventListener('DOMContentLoaded', function() {
            document.body.classList.add('ios-app');
        });
        
        // Handle safe area insets
        function updateSafeArea() {
            const safeAreaInsets = {
                top: window.safeAreaInsets?.top || 0,
                bottom: window.safeAreaInsets?.bottom || 0,
                left: window.safeAreaInsets?.left || 0,
                right: window.safeAreaInsets?.right || 0
            };
            
            document.documentElement.style.setProperty('--safe-area-inset-top', safeAreaInsets.top + 'px');
            document.documentElement.style.setProperty('--safe-area-inset-bottom', safeAreaInsets.bottom + 'px');
            document.documentElement.style.setProperty('--safe-area-inset-left', safeAreaInsets.left + 'px');
            document.documentElement.style.setProperty('--safe-area-inset-right', safeAreaInsets.right + 'px');
        }
        updateSafeArea();
        """
        
        let userScript = WKUserScript(source: jsSource, injectionTime: .atDocumentStart, forMainFrameOnly: true)
        userContentController.addUserScript(userScript)
        
        configuration.userContentController = userContentController
        
        // Create web view
        webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.allowsBackForwardNavigationGestures = true
        webView.scrollView.bounces = true
        
        // Add observers
        webView.addObserver(self, forKeyPath: #keyPath(WKWebView.estimatedProgress), options: .new, context: nil)
        webView.addObserver(self, forKeyPath: #keyPath(WKWebView.canGoBack), options: .new, context: nil)
        webView.addObserver(self, forKeyPath: #keyPath(WKWebView.canGoForward), options: .new, context: nil)
    }
    
    private func setupUI() {
        view.backgroundColor = UIColor(red: 102/255, green: 126/255, blue: 234/255, alpha: 1.0)
        
        // Add web view
        view.addSubview(webView)
        webView.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            webView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            webView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
        
        // Setup progress view
        progressView = UIProgressView(progressViewStyle: .bar)
        progressView.progressTintColor = UIColor(red: 102/255, green: 126/255, blue: 234/255, alpha: 1.0)
        progressView.trackTintColor = UIColor.clear
        progressView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(progressView)
        
        NSLayoutConstraint.activate([
            progressView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            progressView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            progressView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            progressView.heightAnchor.constraint(equalToConstant: 2)
        ])
        
        // Setup refresh control
        refreshControl = UIRefreshControl()
        refreshControl.tintColor = UIColor(red: 102/255, green: 126/255, blue: 234/255, alpha: 1.0)
        refreshControl.addTarget(self, action: #selector(refreshWebView), for: .valueChanged)
        webView.scrollView.addSubview(refreshControl)
        
        // Setup offline view
        setupOfflineView()
        
        // Setup activity indicator
        activityIndicator = UIActivityIndicatorView(style: .large)
        activityIndicator.color = .white
        activityIndicator.hidesWhenStopped = true
        activityIndicator.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(activityIndicator)
        
        NSLayoutConstraint.activate([
            activityIndicator.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            activityIndicator.centerYAnchor.constraint(equalTo: view.centerYAnchor)
        ])
    }
    
    private func setupOfflineView() {
        offlineView = UIView()
        offlineView.backgroundColor = UIColor(red: 247/255, green: 250/255, blue: 252/255, alpha: 1.0)
        offlineView.isHidden = true
        offlineView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(offlineView)
        
        NSLayoutConstraint.activate([
            offlineView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            offlineView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            offlineView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            offlineView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
        
        // Offline content
        let stackView = UIStackView()
        stackView.axis = .vertical
        stackView.alignment = .center
        stackView.spacing = 16
        stackView.translatesAutoresizingMaskIntoConstraints = false
        offlineView.addSubview(stackView)
        
        NSLayoutConstraint.activate([
            stackView.centerXAnchor.constraint(equalTo: offlineView.centerXAnchor),
            stackView.centerYAnchor.constraint(equalTo: offlineView.centerYAnchor),
            stackView.leadingAnchor.constraint(greaterThanOrEqualTo: offlineView.leadingAnchor, constant: 40),
            stackView.trailingAnchor.constraint(lessThanOrEqualTo: offlineView.trailingAnchor, constant: -40)
        ])
        
        // Offline icon
        let offlineIcon = UILabel()
        offlineIcon.text = "📡"
        offlineIcon.font = UIFont.systemFont(ofSize: 60)
        stackView.addArrangedSubview(offlineIcon)
        
        // Offline title
        let offlineTitle = UILabel()
        offlineTitle.text = "No Internet Connection"
        offlineTitle.font = UIFont.systemFont(ofSize: 24, weight: .semibold)
        offlineTitle.textColor = UIColor(red: 45/255, green: 55/255, blue: 72/255, alpha: 1.0)
        stackView.addArrangedSubview(offlineTitle)
        
        // Offline message
        let offlineMessage = UILabel()
        offlineMessage.text = "StackMap works offline! Your data is saved locally."
        offlineMessage.font = UIFont.systemFont(ofSize: 16)
        offlineMessage.textColor = UIColor(red: 113/255, green: 128/255, blue: 150/255, alpha: 1.0)
        offlineMessage.numberOfLines = 0
        offlineMessage.textAlignment = .center
        stackView.addArrangedSubview(offlineMessage)
        
        // Retry button
        let retryButton = UIButton(type: .system)
        retryButton.setTitle("Try Again", for: .normal)
        retryButton.titleLabel?.font = UIFont.systemFont(ofSize: 16, weight: .medium)
        retryButton.backgroundColor = UIColor(red: 102/255, green: 126/255, blue: 234/255, alpha: 1.0)
        retryButton.setTitleColor(.white, for: .normal)
        retryButton.layer.cornerRadius = 8
        retryButton.contentEdgeInsets = UIEdgeInsets(top: 12, left: 24, bottom: 12, right: 24)
        retryButton.addTarget(self, action: #selector(retryConnection), for: .touchUpInside)
        stackView.addArrangedSubview(retryButton)
    }
    
    private func setupNotifications() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleUniversalLink(_:)),
            name: .handleUniversalLink,
            object: nil
        )
    }
    
    // MARK: - Loading
    
    private func loadStackMap() {
        guard let url = URL(string: stackMapURL) else { return }
        
        activityIndicator.startAnimating()
        
        let request = URLRequest(url: url)
        webView.load(request)
    }
    
    // MARK: - Actions
    
    @objc private func refreshWebView() {
        webView.reload()
    }
    
    @objc private func retryConnection() {
        offlineView.isHidden = true
        loadStackMap()
    }
    
    @objc private func handleUniversalLink(_ notification: Notification) {
        guard let url = notification.object as? URL else { return }
        
        // Convert universal link to web URL if needed
        var webURL = url
        if url.scheme == "stackmap" {
            // Convert custom scheme to web URL
            var components = URLComponents(url: url, resolvingAgainstBaseURL: false)
            components?.scheme = "https"
            components?.host = "stackmap.app"
            if let newURL = components?.url {
                webURL = newURL
            }
        }
        
        let request = URLRequest(url: webURL)
        webView.load(request)
    }
    
    // MARK: - KVO
    
    override func observeValue(forKeyPath keyPath: String?, of object: Any?, change: [NSKeyValueChangeKey : Any]?, context: UnsafeMutableRawPointer?) {
        if keyPath == #keyPath(WKWebView.estimatedProgress) {
            progressView.progress = Float(webView.estimatedProgress)
            progressView.isHidden = webView.estimatedProgress >= 1.0
        }
    }
    
    // MARK: - Deinitialization
    
    deinit {
        webView.removeObserver(self, forKeyPath: #keyPath(WKWebView.estimatedProgress))
        webView.removeObserver(self, forKeyPath: #keyPath(WKWebView.canGoBack))
        webView.removeObserver(self, forKeyPath: #keyPath(WKWebView.canGoForward))
        NotificationCenter.default.removeObserver(self)
    }
}

// MARK: - WKNavigationDelegate

extension WebViewController: WKNavigationDelegate {
    
    func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
        progressView.isHidden = false
        activityIndicator.startAnimating()
    }
    
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        progressView.isHidden = true
        refreshControl.endRefreshing()
        activityIndicator.stopAnimating()
        
        // Inject safe area insets
        let safeAreaInsets = view.safeAreaInsets
        let js = """
        window.safeAreaInsets = {
            top: \(safeAreaInsets.top),
            bottom: \(safeAreaInsets.bottom),
            left: \(safeAreaInsets.left),
            right: \(safeAreaInsets.right)
        };
        if (window.updateSafeArea) {
            window.updateSafeArea();
        }
        """
        webView.evaluateJavaScript(js, completionHandler: nil)
    }
    
    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        progressView.isHidden = true
        refreshControl.endRefreshing()
        activityIndicator.stopAnimating()
        handleError(error)
    }
    
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        progressView.isHidden = true
        refreshControl.endRefreshing()
        activityIndicator.stopAnimating()
        handleError(error)
    }
    
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = navigationAction.request.url else {
            decisionHandler(.allow)
            return
        }
        
        // Handle external links
        if url.host != "stackmap.app" && url.host != "localhost" {
            if navigationAction.targetFrame == nil || navigationAction.navigationType == .linkActivated {
                UIApplication.shared.open(url)
                decisionHandler(.cancel)
                return
            }
        }
        
        decisionHandler(.allow)
    }
    
    private func handleError(_ error: Error) {
        let nsError = error as NSError
        
        // Check if it's a network error
        if nsError.domain == NSURLErrorDomain && nsError.code == NSURLErrorNotConnectedToInternet {
            offlineView.isHidden = false
        } else {
            // Show alert for other errors
            let alert = UIAlertController(
                title: "Error",
                message: error.localizedDescription,
                preferredStyle: .alert
            )
            alert.addAction(UIAlertAction(title: "OK", style: .default))
            alert.addAction(UIAlertAction(title: "Retry", style: .default) { _ in
                self.loadStackMap()
            })
            present(alert, animated: true)
        }
    }
}

// MARK: - WKUIDelegate

extension WebViewController: WKUIDelegate {
    
    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        if navigationAction.targetFrame == nil {
            webView.load(navigationAction.request)
        }
        return nil
    }
    
    func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
        let alert = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in
            completionHandler()
        })
        present(alert, animated: true)
    }
    
    func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
        let alert = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "Cancel", style: .cancel) { _ in
            completionHandler(false)
        })
        alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in
            completionHandler(true)
        })
        present(alert, animated: true)
    }
}

// MARK: - WKScriptMessageHandler

extension WebViewController: WKScriptMessageHandler {
    
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == "stackMapiOS",
              let body = message.body as? [String: Any],
              let action = body["action"] as? String else {
            return
        }
        
        switch action {
        case "openURL":
            if let urlString = body["url"] as? String,
               let url = URL(string: urlString) {
                UIApplication.shared.open(url)
            }
            
        case "share":
            if let text = body["text"] as? String {
                let activityVC = UIActivityViewController(activityItems: [text], applicationActivities: nil)
                if let popover = activityVC.popoverPresentationController {
                    popover.sourceView = view
                    popover.sourceRect = CGRect(x: view.bounds.midX, y: view.bounds.midY, width: 0, height: 0)
                }
                present(activityVC, animated: true)
            }
            
        case "haptic":
            if let type = body["type"] as? String {
                switch type {
                case "light":
                    UIImpactFeedbackGenerator(style: .light).impactOccurred()
                case "medium":
                    UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                case "heavy":
                    UIImpactFeedbackGenerator(style: .heavy).impactOccurred()
                case "success":
                    UINotificationFeedbackGenerator().notificationOccurred(.success)
                case "warning":
                    UINotificationFeedbackGenerator().notificationOccurred(.warning)
                case "error":
                    UINotificationFeedbackGenerator().notificationOccurred(.error)
                default:
                    UISelectionFeedbackGenerator().selectionChanged()
                }
            }
            
        default:
            break
        }
    }
}