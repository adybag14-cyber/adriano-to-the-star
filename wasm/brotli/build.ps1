$ErrorActionPreference = "Stop"

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $scriptRoot "..\..")
$emsdkRoot = Join-Path $repoRoot "tooling\emsdk"

if (-not (Test-Path $emsdkRoot)) {
    throw "Emscripten SDK not found at $emsdkRoot"
}

& (Join-Path $emsdkRoot "emsdk_env.ps1") | Out-Null

$emcc = Get-Command emcc -ErrorAction SilentlyContinue
if (-not $emcc) {
    throw "emcc not found. Ensure emsdk_env.ps1 was applied."
}

$brotliRoot = Join-Path $repoRoot "third_party\brotli\c"
if (-not (Test-Path $brotliRoot)) {
    throw "Brotli source not found at $brotliRoot"
}

$commonSources = Get-ChildItem -Path (Join-Path $brotliRoot "common") -Filter "*.c" | ForEach-Object { $_.FullName }
$encSources = Get-ChildItem -Path (Join-Path $brotliRoot "enc") -Filter "*.c" | ForEach-Object { $_.FullName }
$decSources = Get-ChildItem -Path (Join-Path $brotliRoot "dec") -Filter "*.c" | ForEach-Object { $_.FullName }

$cppSource = Join-Path $scriptRoot "brotli_wasm.cpp"
if (-not (Test-Path $cppSource)) {
    throw "Missing brotli_wasm.cpp at $cppSource"
}

$outputJs = Join-Path $scriptRoot "brotli_wasm.js"

$exported = "['_brotli_compress','_brotli_decompress','_brotli_free','_malloc','_free','_main']"
$runtimeMethods = "['HEAPU8','HEAPU32']"

& emcc @commonSources @encSources @decSources $cppSource `
    -I (Join-Path $brotliRoot "include") `
    -O3 `
    -DNDEBUG `
    -s MODULARIZE=1 `
    -s EXPORT_NAME='BrotliWasmModule' `
    -s ALLOW_MEMORY_GROWTH=1 `
    -s ENVIRONMENT='web,worker' `
    -s FILESYSTEM=0 `
    -s EXPORTED_FUNCTIONS=$exported `
    -s EXPORTED_RUNTIME_METHODS=$runtimeMethods `
    -o $outputJs

Write-Host "Built Brotli WASM to $outputJs" -ForegroundColor Green
