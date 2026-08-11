# Test Gemini Live API with PowerShell
$API_KEY = if ($env:GEMINI_API_KEY) { $env:GEMINI_API_KEY } else { $env:GOOGLE_API_KEY }
if (-not $API_KEY) {
    $API_KEY = Read-Host "Enter API key"
}
if (-not $API_KEY) {
    Write-Host "❌ API key is required" -ForegroundColor Red
    exit 1
}
$TEST_PROMPT = "Say 'Hello! The API is working!' if you can read this."

Write-Host "`n🧪 Testing Gemini Live API..." -ForegroundColor Cyan
Write-Host "API Key: $($API_KEY.Substring(0,10))...$($API_KEY.Substring($API_KEY.Length-4))" -ForegroundColor Gray
Write-Host "Test Prompt: `"$TEST_PROMPT`"`n" -ForegroundColor Gray

# Test 1: REST API with gemini-2.5-flash-live-preview
Write-Host ("=" * 60) -ForegroundColor Yellow
Write-Host "Test 1: REST API (generateContent)" -ForegroundColor Yellow
Write-Host "Model: gemini-2.5-flash-live-preview" -ForegroundColor Gray
Write-Host ("=" * 60) -ForegroundColor Yellow

try {
    $body = @{
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
            maxOutputTokens = 1024
        }
    } | ConvertTo-Json -Depth 10

    $uri = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-live-preview:generateContent?key=$API_KEY"
    
    Write-Host "📤 Sending request..." -ForegroundColor Cyan
    
    $response = Invoke-RestMethod -Uri $uri -Method Post -Body $body -ContentType "application/json"
    
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
    Write-Host ""
}

# Test 2: REST Streaming with gemini-2.5-flash-live
Write-Host ("=" * 60) -ForegroundColor Yellow
Write-Host "Test 2: REST Streaming (streamGenerateContent)" -ForegroundColor Yellow
Write-Host "Model: gemini-2.5-flash-live" -ForegroundColor Gray
Write-Host ("=" * 60) -ForegroundColor Yellow

try {
    $body = @{
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
            maxOutputTokens = 1024
        }
    } | ConvertTo-Json -Depth 10

    $uri = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-live:streamGenerateContent?key=$API_KEY"
    
    Write-Host "📤 Sending streaming request..." -ForegroundColor Cyan
    
    $response = Invoke-WebRequest -Uri $uri -Method Post -Body $body -ContentType "application/json" -UseBasicParsing
    
    $streamText = $response.Content
    $fullResponse = ""
    
    # Parse Server-Sent Events format
    $lines = $streamText -split "`n"
    foreach ($line in $lines) {
        if ($line -match "^data:\s*(.+)$") {
            try {
                $data = $matches[1] | ConvertFrom-Json
                if ($data.candidates -and $data.candidates[0].content.parts[0].text) {
                    $text = $data.candidates[0].content.parts[0].text
                    $fullResponse += $text
                    Write-Host "📝 Chunk: `"$text`"" -ForegroundColor Gray
                }
            } catch {
                # Skip invalid JSON
            }
        }
    }
    
    if ($fullResponse) {
        Write-Host "✅ SUCCESS!" -ForegroundColor Green
        Write-Host "Full Response: `"$fullResponse`"`n" -ForegroundColor White
    } else {
        Write-Host "⚠️  No response text received`n" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
    Write-Host ""
}

Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "Tests Complete!" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan

