# Startup Script for Nemotron Agent with vLLM & MCP Support

# 1. Environment Checks
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Minimax Agent Startup Sequence" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
Write-Host "[*] Checking Node.js..." -NoNewline
try {
    $nodeVersion = node --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host " OK ($nodeVersion)" -ForegroundColor Green
    }
    else {
        Write-Host " WARNING: Node.js not found in PATH." -ForegroundColor Yellow
    }
}
catch {}

# Check vLLM / Llama-CPP-Server (Port 8000)
Write-Host "[*] Checking Local Inference Server on localhost:8000..." -NoNewline
$serverConnect = Test-NetConnection -ComputerName "localhost" -Port 8000 -InformationLevel Quiet

if ($serverConnect) {
    Write-Host " ONLINE" -ForegroundColor Green
}
else {
    Write-Host " OFFLINE" -ForegroundColor Yellow
    Write-Host "[*] Attempting to start Llama-CPP-Server..." -ForegroundColor Cyan
    
    # Check for llama-cpp-python
    try {
        python -c "import llama_cpp" 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "    ERROR: 'llama-cpp-python' module not found!" -ForegroundColor Red
            Write-Host "    Please run: pip install llama-cpp-python[server] openai flask flask-cors livekit-api" -ForegroundColor Yellow
            Pause
            exit
        }
    }
    catch {}

    # Define Model Path (Result of download_model.py)
    $modelDir = "$PSScriptRoot\models\MiniMax-M2.1-Q8\Q8_0"
    # Find the first part of the split GGUF or the single GGUF
    $modelFile = Get-ChildItem -Path $modelDir -Filter "*-00001-of-*.gguf" -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName
    
    if (-not $modelFile) {
        $modelFile = Get-ChildItem -Path $modelDir -Filter "*.gguf" -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName
    }

    if ($modelFile) {
        Write-Host "    Found Model: $modelFile" -ForegroundColor Gray
        # Llama-CPP Optimization: 32k context, GPU Offload
        $svrArgs = "-m llama_cpp.server --model `"$modelFile`" --n_ctx 32768 --n_gpu_layers -1 --host 0.0.0.0 --port 8000"
        
        Write-Host "    Starting Server (Background)..." -ForegroundColor Yellow
        $svrProcess = Start-Process -FilePath "python" -ArgumentList "$svrArgs" -PassThru -NoNewWindow
        
        # Wait loop for port 8000
        $timeout = 60
        $timer = 0
        Write-Host "    Waiting for server to be ready..." -NoNewline
        do {
            Start-Sleep -Seconds 2
            $timer += 2
            $ready = Test-NetConnection -ComputerName "localhost" -Port 8000 -InformationLevel Quiet
            if (-not $ready) { Write-Host "." -NoNewline }
        } until ($ready -or $timer -ge $timeout)
        
        if ($ready) {
            Write-Host " READY!" -ForegroundColor Green
        }
        else {
            Write-Host " TIMEOUT!" -ForegroundColor Red
            Write-Host "    Proceeding anyway, but agent might fail to connect initially." -ForegroundColor Yellow
        }
    }
    else {
        Write-Host "    ERROR: Model file not found in $modelDir" -ForegroundColor Red
        Write-Host "    Please run 'python download_model.py' first." -ForegroundColor Yellow
        Pause
        exit
    }
}

# 2. Launch Agent
Write-Host ""
Write-Host "[*] Launching Agent..." -ForegroundColor Green
Write-Host "    Script: agent_app.py" -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Cyan

# Disable python buffering
$env:PYTHONUNBUFFERED = "1"

try {
    python agent_app.py
}
catch {
    Write-Host "ERROR: Failed to launch agent execution." -ForegroundColor Red
    Write-Host $_ -ForegroundColor Red
    Pause
}
