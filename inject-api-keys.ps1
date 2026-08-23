# PowerShell script to inject API keys from GitLab CI/CD variables into config files
# This runs during the GitLab CI/CD build process

Write-Host "Injecting browser-safe public configuration from GitLab CI/CD variables..."

# Get the public directory path
$publicDir = "public"
if (-not (Test-Path $publicDir)) {
    New-Item -ItemType Directory -Path $publicDir -Force | Out-Null
}

# 1. Inject Stripe Public Key
if ($env:STRIPE_PUBLIC_KEY) {
    Write-Host "Injecting STRIPE_PUBLIC_KEY..."
    $stripeConfigPath = Join-Path $publicDir "stripe-config.js"

    if (Test-Path "stripe-config.js") {
        Copy-Item "stripe-config.js" $stripeConfigPath -Force

        # Replace placeholder with actual key
        $stripeConfig = Get-Content $stripeConfigPath -Raw
        $stripeReplacement = "const STRIPE_PUBLIC_KEY = '" + $env:STRIPE_PUBLIC_KEY + "';"
        $stripeConfig = $stripeConfig -replace "const STRIPE_PUBLIC_KEY = .*?;", $stripeReplacement
        $stripeWindowReplacement = "'" + $env:STRIPE_PUBLIC_KEY + "' ||"
        $stripeConfig = $stripeConfig -replace "window\.STRIPE_PUBLIC_KEY \|\|", $stripeWindowReplacement

        Set-Content -Path $stripeConfigPath -Value $stripeConfig -NoNewline
        Write-Host "Stripe key injected successfully"
    } else {
        Write-Host "Warning: stripe-config.js not found, creating new one..."
        $stripeKey = $env:STRIPE_PUBLIC_KEY

        # Use here-string with placeholders to avoid PowerShell parsing issues
        $stripeConfigContent = @'
/**
 * Stripe Payment Configuration
 * Injected from GitLab CI/CD variable STRIPE_PUBLIC_KEY during build
 */

const STRIPE_PUBLIC_KEY = 'PLACEHOLDER_STRIPE_KEY';

if (typeof window !== 'undefined') {
    window.STRIPE_PUBLIC_KEY = STRIPE_PUBLIC_KEY;
    if (STRIPE_PUBLIC_KEY) {
        console.log('Stripe public key configured');
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { STRIPE_PUBLIC_KEY };
}
'@

        # Replace placeholder with actual key
        $stripeConfigContent = $stripeConfigContent -replace 'PLACEHOLDER_STRIPE_KEY', $stripeKey

        Set-Content -Path $stripeConfigPath -Value $stripeConfigContent
        Write-Host "Created stripe-config.js with injected key"
    }
} else {
    Write-Host "Warning: STRIPE_PUBLIC_KEY not found in environment variables"
}


# Secret provider credentials are deliberately not emitted into public/*.js.
# Gemini and Pinata authenticated operations must go through a server-side backend/proxy.
foreach ($secretName in @('GEMINI_API_KEY', 'PINATA_API_KEY', 'PINATA_SECRET_KEY')) {
    if (Test-Path Env:$secretName) {
        Write-Host "Skipping $secretName: secret credentials are server-side only."
    }
}

Write-Host "Public configuration injection complete"
