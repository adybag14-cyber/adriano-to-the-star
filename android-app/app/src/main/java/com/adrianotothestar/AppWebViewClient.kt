package com.adrianotothestar

import android.annotation.SuppressLint
import android.graphics.Bitmap
import android.net.Uri
import android.util.Log
import android.view.View
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.ProgressBar
import android.widget.Toast
import androidx.appcompat.app.AlertDialog

// Top-level constants (file-private)
private const val TAG = "AppWebViewClient"
private val ALLOWED_HOSTS = listOf(
    "starisdons-d53656.gitlab.io",
    "gitlab.io",
    "localhost"
)

/**
 * Custom WebViewClient for handling navigation, errors, and deep links
 * 
 * This class provides:
 * - Network error handling with user feedback
 * - Secure deep link validation (whitelist-only)
 * - Loading state management
 * - Error recovery suggestions with retry functionality
 */
class AppWebViewClient(
    private val progressBar: ProgressBar? = null,
    private val onPageLoaded: ((String?) -> Unit)? = null,
    private val onRetryRequested: (() -> Unit)? = null
) : WebViewClient() {

    /**
     * Core URL validation and loading logic (shared by both methods)
     * Uses whitelist-only security model: block all URLs by default, only allow whitelisted hosts
     * Uses idiomatic Kotlin with let block for safe nullable handling
     */
    private fun handleUrlLoading(view: WebView?, url: String?): Boolean {
        if (view == null) return false
        
        return url?.let { urlString ->
            // Whitelist-only security: block all navigation by default
            if (!isUrlAllowed(urlString)) {
                Log.w(TAG, "Blocked navigation to non-whitelisted URL: $urlString")
                // Show Toast to give user immediate feedback
                Toast.makeText(
                    view.context,
                    "Navigation to external sites is disabled",
                    Toast.LENGTH_SHORT
                ).show()
                true // Block navigation
            } else {
                false // URL is whitelisted, let WebView handle the navigation
            }
        } ?: false // If url is null, don't override
    }

    /**
     * Handle URL loading with security validation (API 24+)
     */
    override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
        val url = request?.url?.toString()
        return handleUrlLoading(view, url)
    }

    /**
     * Handle URL loading with security validation (API < 24)
     */
    @Deprecated("Use shouldOverrideUrlLoading(WebView, WebResourceRequest)")
    override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean {
        return handleUrlLoading(view, url)
    }

    /**
     * Validate if URL is allowed (whitelist-only security model)
     * Only allows URLs that match the ALLOWED_HOSTS list
     */
    private fun isUrlAllowed(url: String): Boolean {
        return try {
            val uri = Uri.parse(url)
            val host = uri.host ?: return false
            val scheme = uri.scheme ?: return false
            
            // Only allow HTTPS (or HTTP for localhost)
            if (scheme != "https" && !(scheme == "http" && host == "localhost")) {
                return false
            }
            
            // Whitelist-only: only allow specific hosts
            ALLOWED_HOSTS.any { allowedHost ->
                host == allowedHost || host.endsWith(".$allowedHost")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error parsing URL: $url", e)
            false
        }
    }

    /**
     * Handle page started loading
     */
    override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
        super.onPageStarted(view, url, favicon)
        progressBar?.visibility = View.VISIBLE
        Log.d(TAG, "Page started loading: $url")
    }

    /**
     * Handle page finished loading
     */
    override fun onPageFinished(view: WebView?, url: String?) {
        super.onPageFinished(view, url)
        progressBar?.visibility = View.GONE
        onPageLoaded?.invoke(url)
        Log.d(TAG, "Page finished loading: $url")
    }

    /**
     * Handle HTTP errors
     * Consolidated error handling: determine title and message first, then make a single call
     */
    override fun onReceivedHttpError(
        view: WebView?,
        request: WebResourceRequest?,
        errorResponse: android.webkit.WebResourceResponse?
    ) {
        super.onReceivedHttpError(view, request, errorResponse)
        val statusCode = errorResponse?.statusCode ?: 0
        val url = request?.url?.toString() ?: "unknown"
        
        Log.e(TAG, "HTTP Error $statusCode for URL: $url")
        
        // Determine error title and message based on status code
        val (title, message) = when (statusCode) {
            404 -> "Page Not Found" to "The requested page could not be found. Please check the URL and try again."
            500 -> "Server Error" to "The server encountered an error. Please try again later."
            else -> if (statusCode >= 400) {
                "Loading Error" to "An error occurred while loading the page (Error $statusCode). Please try again."
            } else {
                null to null // No error dialog for non-error status codes
            }
        }
        
        // Show error dialog only if we have title and message
        if (title != null && message != null) {
            showErrorDialog(view?.context, title, message)
        }
    }

    /**
     * Handle network errors
     */
    override fun onReceivedError(
        view: WebView?,
        request: WebResourceRequest?,
        error: WebResourceError?
    ) {
        super.onReceivedError(view, request, error)
        
        val errorCode = error?.errorCode ?: -1
        val description = error?.description?.toString() ?: "Unknown error"
        val url = request?.url?.toString() ?: "unknown"
        
        Log.e(TAG, "Network error $errorCode: $description for URL: $url")
        
        // Show user-friendly error message
        when (errorCode) {
            WebViewClient.ERROR_HOST_LOOKUP,
            WebViewClient.ERROR_CONNECT,
            WebViewClient.ERROR_TIMEOUT -> {
                showNetworkErrorDialog(view?.context, errorCode, description)
            }
            else -> {
                Toast.makeText(
                    view?.context,
                    "Unable to load page. Please check your internet connection.",
                    Toast.LENGTH_LONG
                ).show()
            }
        }
    }

    /**
     * Show network error dialog with recovery options
     * Includes functional retry button that calls the onRetryRequested callback
     * Non-cancelable to ensure user acknowledges the error
     */
    @SuppressLint("SetTextI18n")
    private fun showNetworkErrorDialog(context: android.content.Context?, errorCode: Int, description: String) {
        if (context == null) return
        
        val errorMessage = when (errorCode) {
            WebViewClient.ERROR_HOST_LOOKUP -> "Unable to resolve host. Please check your internet connection."
            WebViewClient.ERROR_CONNECT -> "Connection failed. Please check your internet connection and try again."
            WebViewClient.ERROR_TIMEOUT -> "Connection timed out. Please check your internet connection and try again."
            else -> "Network error: $description"
        }
        
        AlertDialog.Builder(context)
            .setTitle("Connection Error")
            .setMessage(errorMessage)
            .setPositiveButton("Retry") { _, _ ->
                // Call the retry callback to reload the page
                onRetryRequested?.invoke()
            }
            .setNegativeButton("Cancel", null)
            .setIcon(android.R.drawable.ic_dialog_alert)
            .setCancelable(false) // Make dialog non-cancelable - user must acknowledge error
            .show()
    }

    /**
     * Show error dialog
     * Non-cancelable to ensure user acknowledges the error
     */
    private fun showErrorDialog(
        context: android.content.Context?,
        title: String,
        message: String
    ) {
        if (context == null) return
        
        AlertDialog.Builder(context)
            .setTitle(title)
            .setMessage(message)
            .setPositiveButton("OK", null)
            .setIcon(android.R.drawable.ic_dialog_alert)
            .setCancelable(false) // Make dialog non-cancelable - user must acknowledge error
            .show()
    }
}
