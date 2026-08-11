package org.lwjgl.opengles;

public final class EGLSurface {
    public final long handle;

    private EGLDisplay display;

    public EGLSurface(final long handle) {
        this.handle = handle;
    }

    void setDisplay(final EGLDisplay display) {
        this.display = display;
    }

    public void swapBuffers() {
    }

    public void destroy() {
        this.display = null;
    }
}
