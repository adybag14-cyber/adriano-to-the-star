package org.lwjgl.opengles;

public final class GLContext {
    private static final ContextCapabilities CAPABILITIES = new ContextCapabilities();

    private GLContext() {
    }

    public static void loadOpenGLLibrary() {
    }

    public static void unloadOpenGLLibrary() {
    }

    public static void useContext(final Object context) {
    }

    public static ContextCapabilities getCapabilities() {
        return CAPABILITIES;
    }
}
