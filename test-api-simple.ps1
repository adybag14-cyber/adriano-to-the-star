# Simple REST API Test
$API_KEY = if ($env:GEMINI_API_KEY) { $env:GEMINI_API_KEY } else { $env:GOOGLE_API_KEY }
if (-not $API_KEY) {
    $API_KEY = Read-Host "Enter API key"
}
if (-not $API_KEY) {
    Write-Host "❌ API key is required" -ForegroundColor Red
    exit 1
}
$TEST_PROMPT = "Say hello if you can read this"

Write-Host "`n🧪 Testing Gemini REST API..." -ForegroundColor Cyan
Write-Host "Model: gemini-2.5-flash-live-preview`n" -ForegroundColor Gray

$requestBody = @{
    contents = @(
        @{
            parts = @(
                @{
                    text = $TEST_PROMPT
                }
            )
        }
    )
    generationConfig = @{
        temperature = 0.7
        maxOutputTokens = 100
    }
} | ConvertTo-Json -Depth 10

$uri = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-live-preview:generateContent?key=$API_KEY"

try {
    Write-Host "📤 Sending request..." -ForegroundColor Yellow
    $response = Invoke-RestMethod -Uri $uri -Method Post -Body $requestBody -ContentType "application/json"
    
    $responseText = $response.candidates[0].content.parts[0].text
    
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host "Response: `"$responseText`"`n" -ForegroundColor White
} catch {
    Write-Host "❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
}

