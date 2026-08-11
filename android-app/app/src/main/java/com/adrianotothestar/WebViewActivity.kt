package com.adrianotothestar

import android.annotation.SuppressLint
import android.os.Bundle
import android.net.Uri
import android.webkit.WebView
import android.widget.ProgressBar
import androidx.appcompat.app.AppCompatActivity

/**
 * WebView Activity for handling external links
 * Can be used for specific pages that need separate handling
 */
class WebViewActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private val WEBSITE_URL = "https://starisdons-d53656.gitlab.io"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)
        val progressBar = findViewById<ProgressBar>(R.id.progressBar)
        
        // Setup WebView with security annotation
        @SuppressLint("SetJavaScriptEnabled")
        fun setupWebView() {
            webView.settings.javaScriptEnabled = true
            webView.settings.domStorageEnabled = true
            webView.settings.databaseEnabled = true
            
            // Use custom WebViewClient with error handling
            webView.webViewClient = AppWebViewClient(
                progressBar = progressBar,
                onPageLoaded = null
            )
        }
        
        setupWebView()

        // Load URL from intent
        val url = intent.getStringExtra("url") ?: WEBSITE_URL
        val safeUrl = if (isValidUrl(url)) url else WEBSITE_URL
        webView.loadUrl(safeUrl)
    }

    private fun isValidUrl(url: String): Boolean {
        return try {
            val uri = Uri.parse(url)
            val host = uri.host ?: return false
            val scheme = uri.scheme ?: return false

            if (scheme != "https") return false

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

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}

