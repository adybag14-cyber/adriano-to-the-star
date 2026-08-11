//
//  WebViewContainer.swift
//  AdrianoToTheStar
//
//  Created on November 27, 2025
//

import SwiftUI
import UIKit
import WebKit

struct WebViewContainer: UIViewRepresentable {
    private let websiteURL = "https://starisdons-d53656.gitlab.io"
    
    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        
        // Enable JavaScript
        let preferences = WKWebpagePreferences()
        preferences.allowsContentJavaScript = true
        configuration.defaultWebpagePreferences = preferences
        
        // Enable data storage for PWA
        let dataStore = WKWebsiteDataStore.default()
        configuration.websiteDataStore = dataStore
        
        // Create WebView
        let webView = WKWebView(frame: .zero, configuration: configuration)
        
        // Configure WebView
        webView.navigationDelegate = context.coordinator
        webView.allowsBackForwardNavigationGestures = true
        webView.scrollView.contentInsetAdjustmentBehavior = .never

        context.coordinator.bind(webView)
        
        // Custom user agent
        webView.customUserAgent = webView.customUserAgent ?? "" + " AdrianoToTheStarApp/1.0"
        
        // Load website
        if let url = URL(string: websiteURL) {
            let request = URLRequest(url: url)
            webView.load(request)
        }
        
        return webView
    }
    
    func updateUIView(_ webView: WKWebView, context: Context) {
        context.coordinator.bind(webView)
    }
    
    func makeCoordinator() -> Coordinator {
        Coordinator()
    }
    
    class Coordinator: NSObject, WKNavigationDelegate {
        private weak var webView: WKWebView?
        private var deepLinkObserver: NSObjectProtocol?

        override init() {
            super.init()
            deepLinkObserver = NotificationCenter.default.addObserver(
                forName: NSNotification.Name("HandleDeepLink"),
                object: nil,
                queue: .main
            ) { [weak self] notification in
                guard let self else { return }
                guard let url = notification.object as? URL else { return }
                guard self.isAllowed(url: url) else { return }
                self.webView?.load(URLRequest(url: url))
            }
        }

        deinit {
            if let deepLinkObserver {
                NotificationCenter.default.removeObserver(deepLinkObserver)
            }
        }

        func bind(_ webView: WKWebView) {
            if self.webView !== webView {
                self.webView = webView
            }
        }

        private func isAllowed(url: URL) -> Bool {
            guard let scheme = url.scheme?.lowercased() else { return false }
            guard scheme == "https" else { return false }
            guard let host = url.host?.lowercased() else { return false }
            let allowedHosts = [
                "starisdons-d53656.gitlab.io",
                "gitlab.io"
            ]
            return allowedHosts.contains(where: { host == $0 || host.hasSuffix("." + $0) })
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            // Inject JavaScript for enhanced functionality
            let js = """
                (function() {
                    // Detect iOS app
                    window.isiOSApp = true;
                    
                    // Enhanced PWA support
                    if ('serviceWorker' in navigator) {
                        navigator.serviceWorker.register('/sw.js')
                            .then(reg => console.log('Service Worker registered'))
                            .catch(err => console.log('Service Worker registration failed'));
                    }
                    
                    // Notify app is ready
                    if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.appReady) {
                        window.webkit.messageHandlers.appReady.postMessage('ready');
                    }
                })();
            """
            webView.evaluateJavaScript(js, completionHandler: nil)
        }
        
        func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            guard let url = navigationAction.request.url else {
                decisionHandler(.allow)
                return
            }

            if isAllowed(url: url) {
                decisionHandler(.allow)
                return
            }

            if let scheme = url.scheme?.lowercased(), scheme == "http" || scheme == "https" {
                UIApplication.shared.open(url)
            }
            decisionHandler(.cancel)
        }
    }
}

