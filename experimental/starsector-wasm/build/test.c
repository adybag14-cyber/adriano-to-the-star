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
