package com.adrianotothestar

import android.annotation.SuppressLint
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.webkit.WebView
import android.webkit.WebSettings
import android.widget.ProgressBar
import androidx.appcompat.app.AppCompatActivity
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import androidx.webkit.WebSettingsCompat
import androidx.webkit.WebViewFeature

/**
 * Main Activity - WebView wrapper for Adriano To The Star PWA
 * 
 * This activity loads the website in a WebView, providing a native app experience
 * while leveraging the existing PWA functionality.
 * 
 * Features:
 * - Pull-to-refresh for native feel
 * - Secure deep link handling
 * - Network error handling
 * - Modern Kotlin implementation
 */
class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var swipeRefreshLayout: SwipeRefreshLayout
    private lateinit var progressBar: ProgressBar
    private val WEBSITE_URL = "https://starisdons-d53656.gitlab.io"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        initializeViews()
        setupWebView()
        setupPullToRefresh()
        handleDeepLink(intent)
    }

    /**
     * Initialize view references
     */
    private fun initializeViews() {
        webView = findViewById(R.id.webView)
        swipeRefreshLayout = findViewById(R.id.swipeRefreshLayout)
        progressBar = findViewById(R.id.progressBar)
    }

    /**
     * Setup WebView with optimal settings for PWA
     * 
     * Note: JavaScript is enabled for PWA functionality.
     * This is a security consideration that is acknowledged with @SuppressLint.
     */
    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        // Enable JavaScript (required for PWA)
        webView.settings.javaScriptEnabled = true
        
        // Enable DOM storage for PWA
        webView.settings.domStorageEnabled = true
        
        // Enable database storage
        webView.settings.databaseEnabled = true
        
        // Security hardening: this app only needs https web content, not local file access
        webView.settings.allowFileAccess = false
        webView.settings.allowContentAccess = false
        webView.settings.allowFileAccessFromFileURLs = false
        webView.settings.allowUniversalAccessFromFileURLs = false

        // Disallow mixed content (keep https-only)
        webView.settings.mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW

        // Safe browsing
        if (WebViewFeature.isFeatureSupported(WebViewFeature.START_SAFE_BROWSING)) {
            WebSettingsCompat.setSafeBrowsingEnabled(webView.settings, true)
        }

        // Additional safe defaults
        webView.settings.javaScriptCanOpenWindowsAutomatically = false
        
        // Enable zoom controls
        webView.settings.setSupportZoom(true)
        webView.settings.builtInZoomControls = true
        webView.settings.displayZoomControls = false
        
        // Cache settings for offline support
        webView.settings.cacheMode = android.webkit.WebSettings.LOAD_DEFAULT
        
        // User agent
        webView.settings.userAgentString = webView.settings.userAgentString + " AdrianoToTheStarApp/1.0"
        
        // Setup custom WebViewClient with error handling and retry functionality
        webView.webViewClient = AppWebViewClient(
            progressBar = progressBar,
            onPageLoaded = { url ->
                // Inject JavaScript when page loads
                injectJavaScript()
                // Stop refresh indicator
                swipeRefreshLayout.isRefreshing = false
            },
            onRetryRequested = {
                // Retry by reloading the current page
                webView.reload()
            }
        )

        // Load the website
        webView.loadUrl(WEBSITE_URL)
    }

    /**
     * Setup pull-to-refresh functionality
     */
    private fun setupPullToRefresh() {
        swipeRefreshLayout.setOnRefreshListener {
            // Reload the current page
            webView.reload()
        }
        
        // Set refresh colors to match app theme
        swipeRefreshLayout.setColorSchemeColors(
            resources.getColor(android.R.color.holo_blue_bright, theme),
            resources.getColor(android.R.color.holo_green_light, theme),
            resources.getColor(android.R.color.holo_orange_light, theme),
            resources.getColor(android.R.color.holo_red_light, theme)
        )
    }

    /**
     * Handle deep links from intents with security validation
     */
    private fun handleDeepLink(intent: Intent?) {
        if (intent?.action == Intent.ACTION_VIEW) {
            val data: Uri? = intent.data
            if (data != null) {
                val url = data.toString()
                // Validate URL before loading
                if (isValidDeepLink(url)) {
                    webView.loadUrl(url)
                } else {
                    // Invalid deep link - load default URL
                    webView.loadUrl(WEBSITE_URL)
                }
            }
        }
    }

    /**
     * Validate deep link URLs for security
     */
    private fun isValidDeepLink(url: String): Boolean {
        return try {
            val uri = Uri.parse(url)
            val host = uri.host ?: return false
            val scheme = uri.scheme ?: return false
            
            // Only allow HTTPS
            if (scheme != "https") return false
            
            // Only allow specific hosts
            val allowedHosts = listOf(
                "starisdons-d53656.gitlab.io",
                "gitlab.io"
            )
            
            allowedHosts.any { allowedHost ->
                host == allowedHost || host.endsWith(".$allowedHost")
            }
        } catch (e: Exception) {
            false
        }
    }

    /**
     * Inject JavaScript for enhanced functionality
     * Ensures navigation menu and widgets are properly initialized
     */
    private fun injectJavaScript() {
        val js = """
            (function() {
                // Detect Android app
                window.isAndroidApp = true;
                
                // Enhanced PWA support
                if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.register('/sw.js')
                        .then(reg => console.log('Service Worker registered'))
                        .catch(err => console.log('Service Worker registration failed'));
                }
                
                // Ensure navigation menu is initialized
                if (typeof NavigationMenu !== 'undefined') {
                    if (!window.navigationMenu) {
                        window.navigationMenu = new NavigationMenu();
                    }
                } else {
                    // Wait for navigation.js to load
                    window.addEventListener('load', function() {
                        if (typeof NavigationMenu !== 'undefined' && !window.navigationMenu) {
                            window.navigationMenu = new NavigationMenu();
                        }
                    });
                }
                
                // Ensure all widgets are visible and functional
                setTimeout(function() {
                    // Show menu toggle button if it exists
                    var menuToggle = document.getElementById('menu-toggle');
                    if (menuToggle) {
                        menuToggle.style.display = 'flex';
                        menuToggle.style.visibility = 'visible';
                        menuToggle.style.opacity = '1';
                        menuToggle.style.zIndex = '9999';
                    }
                    
                    // Ensure music player is accessible and minimize button is visible
                    if (window.cosmicMusicPlayer) {
                        window.cosmicMusicPlayer.show();
                    }
                    
                    // Ensure music player minimize button is visible and functional
                    var minimizeBtn = document.getElementById('minimize-player');
                    if (minimizeBtn) {
                        minimizeBtn.style.display = 'block';
                        minimizeBtn.style.visibility = 'visible';
                        minimizeBtn.style.opacity = '1';
                        minimizeBtn.style.zIndex = '10000';
                        minimizeBtn.style.cursor = 'pointer';
                        minimizeBtn.style.pointerEvents = 'auto';
                    }
                    
                    // Ensure music player container is visible
                    var musicPlayer = document.getElementById('cosmic-music-player');
                    if (musicPlayer) {
                        musicPlayer.style.display = 'block';
                        musicPlayer.style.visibility = 'visible';
                        musicPlayer.style.opacity = '1';
                        musicPlayer.style.zIndex = '9999';
                    }
                    
                    // Ensure theme toggle is accessible
                    var themeToggle = document.querySelector('.theme-toggle, #theme-toggle');
                    if (themeToggle) {
                        themeToggle.style.display = 'block';
                        themeToggle.style.visibility = 'visible';
                    }
                    
                    // Ensure language switcher is accessible
                    var langSwitcher = document.querySelector('.language-switcher, #language-switcher');
                    if (langSwitcher) {
                        langSwitcher.style.display = 'block';
                        langSwitcher.style.visibility = 'visible';
                        langSwitcher.style.zIndex = '10000';
                    }
                    
                    // Ensure color scheme picker is accessible
                    var colorPicker = document.getElementById('color-scheme-picker');
                    if (colorPicker) {
                        colorPicker.style.display = 'block';
                        colorPicker.style.visibility = 'visible';
                        colorPicker.style.zIndex = '9997';
                    }
                    
                    var colorToggleBtn = document.getElementById('color-scheme-toggle');
                    if (colorToggleBtn) {
                        colorToggleBtn.style.display = 'flex';
                        colorToggleBtn.style.visibility = 'visible';
                        colorToggleBtn.style.zIndex = '9997';
                    }
                }, 1000);
                
                // Notify app is ready
                if (window.Android && window.Android.onAppReady) {
                    window.Android.onAppReady();
                }
            })();
        """.trimIndent()
        
        webView.evaluateJavascript(js, null)
    }

    /**
     * Handle back button
     */
    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }

    /**
     * Handle new intent (for deep links when app is already running)
     * 
     * This ensures that when a deep link is received while the app is running,
     * the new URL is properly loaded.
     */
    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        setIntent(intent)
        
        // Properly handle the new intent
        if (intent?.action == Intent.ACTION_VIEW) {
            val data: Uri? = intent.data
            if (data != null) {
                val url = data.toString()
                // Validate and load the new URL
                if (isValidDeepLink(url)) {
                    webView.loadUrl(url)
                } else {
                    // Invalid URL - reload current page or default
                    webView.reload()
                }
            }
        } else {
            // If no deep link, just reload current page
            webView.reload()
        }
    }

    /**
     * Save WebView state
     */
    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }

    /**
     * Restore WebView state
     */
    override fun onRestoreInstanceState(savedInstanceState: Bundle) {
        super.onRestoreInstanceState(savedInstanceState)
        webView.restoreState(savedInstanceState)
    }

    /**
     * Cleanup
     */
    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }
}

