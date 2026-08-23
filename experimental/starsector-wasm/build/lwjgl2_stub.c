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
