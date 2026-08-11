package org.lwjgl.opengles;

public final class EGLContext {
    public final long handle;

    private EGLDisplay display;

    public EGLContext(final long handle) {
        this.handle = handle;
    }

    public void setDisplay(final EGLDisplay display) {
        this.display = display;
    }

    public void makeCurrent(final EGLSurface surface) {
    }

    public void destroy() {
        this.display = null;
    }
}
