package org.lwjgl.opengles;

public final class EGL {
    private EGL() {
    }

    public static EGLDisplay eglGetDisplay(final long displayId) {
        return new EGLDisplay(displayId);
    }

    public static void eglReleaseCurrent(final EGLDisplay dpy) {
    }

    public static boolean eglIsCurrentContext(final EGLContext context) {
        return false;
    }
}
