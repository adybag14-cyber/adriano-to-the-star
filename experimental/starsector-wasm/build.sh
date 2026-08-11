#!/bin/bash
# LWJGL2 WebAssembly Build Script
# Compiles gl4es and LWJGL2 native code for CheerpJ integration

set -e

echo "=========================================="
echo "LWJGL2 WebAssembly Build for CheerpJ"
echo "=========================================="

# Check Emscripten
if ! command -v emcc &> /dev/null; then
    echo "ERROR: Emscripten (emcc) not found!"
    echo "Install from: https://emscripten.org/docs/getting_started/downloads.html"
    exit 1
fi

# Create output directory
mkdir -p build

echo ""
echo "[1/3] Building gl4es (OpenGL to GLES translation)..."
cd gl4es

# Configure gl4es for Emscripten
mkdir -p build_wasm
cd build_wasm

# CMake with Emscripten
emcmake cmake .. \
    -DCMAKE_BUILD_TYPE=Release \
    -DSTATICLIB=ON \
    -DNOX11=ON \
    -DNOEGL=ON \
    -DUSE_CLOCK=OFF \
    -DDEFAULT_ES=2

emmake make -j4

cd ../..
cp gl4es/build_wasm/lib/libGL.a build/

echo ""
echo "[2/3] Building LWJGL2 native bindings..."

# Create a minimal LWJGL2 WASM build
cd lwjgl2/src/native

# Compile common tools
emcc -c -O2 \
    -I common \
    -I common/opengl \
    -I ../../include \
    -DLWJGL_LINUX \
    -DNO_JNI \
    common/common_tools.c \
    common/opengl/extgl.c \
    -o ../../build/lwjgl_common.o

cd ../../..

echo ""
echo "[3/3] Linking LWJGL2 WebAssembly module..."

# Link everything into a single WASM module
emcc -O2 \
    -s WASM=1 \
    -s EXPORTED_FUNCTIONS='["_malloc","_free"]' \
    -s EXPORTED_RUNTIME_METHODS='["ccall","cwrap"]' \
    -s MODULARIZE=1 \
    -s EXPORT_NAME='LWJGL2' \
    -s FULL_ES2=1 \
    -s USE_WEBGL2=1 \
    -L build \
    -lGL \
    build/lwjgl_common.o \
    -o build/lwjgl2.js

echo ""
echo "=========================================="
echo "BUILD COMPLETE!"
echo "Output: build/lwjgl2.js, build/lwjgl2.wasm"
echo "=========================================="
