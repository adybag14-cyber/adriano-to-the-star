# LWJGL2 WebAssembly Build Script (PowerShell)
# Compiles gl4es and LWJGL2 native code for CheerpJ integration

$ErrorActionPreference = "Stop"

Write-Host "=========================================="
Write-Host "LWJGL2 WebAssembly Build for CheerpJ"
Write-Host "==========================================" -ForegroundColor Cyan

# Check Emscripten
$emcc = Get-Command emcc -ErrorAction SilentlyContinue
if (-not $emcc) {
    Write-Host "ERROR: Emscripten (emcc) not found!" -ForegroundColor Red
    Write-Host "To install Emscripten:"
    Write-Host "  1. git clone https://github.com/emscripten-core/emsdk.git"
    Write-Host "  2. cd emsdk && .\emsdk install latest && .\emsdk activate latest"
    Write-Host "  3. .\emsdk_env.ps1"
    exit 1
}

Write-Host "Found Emscripten at: $($emcc.Source)" -ForegroundColor Green

# Create output directory
New-Item -ItemType Directory -Path "build" -Force | Out-Null

Write-Host ""
Write-Host "[Step 1] Testing Emscripten with simple C program..." -ForegroundColor Yellow

# Create a simple test file
@"
#include <stdio.h>
#include <emscripten.h>

EMSCRIPTEN_KEEPALIVE
int test_function() {
    printf("LWJGL2 WASM Test - Success!\n");
    return 42;
}

int main() {
    printf("LWJGL2 WASM Module Loaded\n");
    return 0;
}
"@ | Out-File -FilePath "build/test.c" -Encoding utf8

# Compile test
Write-Host "Compiling test.c to WebAssembly..."
emcc build/test.c `
    -O2 `
    -s WASM=1 `
    -s MODULARIZE=1 `
    -s EXPORT_NAME='LWJGL2Test' `
    -s EXPORTED_RUNTIME_METHODS='["ccall","cwrap"]' `
    -o build/test.js

if ($LASTEXITCODE -eq 0) {
    Write-Host "Test compilation successful!" -ForegroundColor Green
    Write-Host "Output: build/test.js, build/test.wasm"
}
else {
    Write-Host "Test compilation failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[Step 2] Building gl4es..." -ForegroundColor Yellow
Write-Host "NOTE: gl4es requires CMake. Skipping for now - will use Emscripten's built-in OpenGL support."

Write-Host ""
Write-Host "[Step 3] Building LWJGL2 stub..." -ForegroundColor Yellow

# Create LWJGL2 stub that exports required functions for CheerpJ
@"
#include <stdio.h>
#include <string.h>
#include <emscripten.h>
#include <GLES2/gl2.h>

// LWJGL2 stub functions for CheerpJ
// These will be called when Java loads the native library

EMSCRIPTEN_KEEPALIVE
void JNI_OnLoad_lwjgl() {
    printf("LWJGL2 WASM: JNI_OnLoad called\n");
}

EMSCRIPTEN_KEEPALIVE
void Java_org_lwjgl_opengl_GL11_nglEnable(int cap) {
    glEnable(cap);
}

EMSCRIPTEN_KEEPALIVE
void Java_org_lwjgl_opengl_GL11_nglDisable(int cap) {
    glDisable(cap);
}

EMSCRIPTEN_KEEPALIVE
void Java_org_lwjgl_opengl_GL11_nglClear(int mask) {
    glClear(mask);
}

EMSCRIPTEN_KEEPALIVE
void Java_org_lwjgl_opengl_GL11_nglClearColor(float r, float g, float b, float a) {
    glClearColor(r, g, b, a);
}

EMSCRIPTEN_KEEPALIVE
void Java_org_lwjgl_opengl_GL11_nglViewport(int x, int y, int w, int h) {
    glViewport(x, y, w, h);
}

// Display stub
EMSCRIPTEN_KEEPALIVE
int Java_org_lwjgl_opengl_Display_getWidth() {
    return 1280;
}

EMSCRIPTEN_KEEPALIVE
int Java_org_lwjgl_opengl_Display_getHeight() {
    return 720;
}

EMSCRIPTEN_KEEPALIVE
void Java_org_lwjgl_opengl_Display_create() {
    printf("LWJGL2 WASM: Display.create() called\n");
}

EMSCRIPTEN_KEEPALIVE
void Java_org_lwjgl_opengl_Display_update() {
    // No-op in browser - browser handles refresh
}

EMSCRIPTEN_KEEPALIVE
int Java_org_lwjgl_opengl_Display_isCloseRequested() {
    return 0; // Never close
}

int main() {
    printf("LWJGL2 WASM Module Ready\n");
    return 0;
}
"@ | Out-File -FilePath "build/lwjgl2_stub.c" -Encoding utf8

Write-Host "Compiling LWJGL2 stub..."
emcc build/lwjgl2_stub.c `
    -O2 `
    -s WASM=1 `
    -s MODULARIZE=1 `
    -s EXPORT_NAME='LWJGL2' `
    -s FULL_ES2=1 `
    -s USE_WEBGL2=1 `
    -s EXPORTED_RUNTIME_METHODS='["ccall","cwrap"]' `
    -s EXPORTED_FUNCTIONS='["_main","_JNI_OnLoad_lwjgl","_Java_org_lwjgl_opengl_Display_create"]' `
    -o build/lwjgl2.js

if ($LASTEXITCODE -eq 0) {
    Write-Host "LWJGL2 stub compilation successful!" -ForegroundColor Green
    Write-Host "Output: build/lwjgl2.js, build/lwjgl2.wasm"
}
else {
    Write-Host "LWJGL2 stub compilation failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "BUILD COMPLETE!" -ForegroundColor Green
Write-Host "Files created in: build/"
Write-Host "  - test.js, test.wasm (test module)"
Write-Host "  - lwjgl2.js, lwjgl2.wasm (LWJGL2 stub)"
Write-Host "==========================================" -ForegroundColor Cyan
