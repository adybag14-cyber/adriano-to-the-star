package org.lwjgl.opengles;

import java.nio.IntBuffer;

public final class EGLDisplay {
    public final long handle;

    public EGLDisplay(final long handle) {
        this.handle = handle;
    }

    public EGLConfig[] chooseConfig(final IntBuffer attribs, final EGLConfig[] configs, final IntBuffer numConfig) {
        if (configs != null && configs.length != 0) {
            if (numConfig != null && numConfig.remaining() > 0) {
                numConfig.put(numConfig.position(), configs.length);
            }
            return configs;
        }

        final EGLConfig[] out = new EGLConfig[] { new EGLConfig(0) };
        if (numConfig != null && numConfig.remaining() > 0) {
            numConfig.put(numConfig.position(), out.length);
        }
        return out;
    }

    public EGLContext createContext(final EGLConfig config, final EGLContext sharedContext, final IntBuffer attribList) {
        final EGLContext ctx = new EGLContext(0);
        ctx.setDisplay(this);
        return ctx;
    }

    public EGLSurface createWindowSurface(final EGLConfig config, final long window, final IntBuffer attribList) {
        final EGLSurface surface = new EGLSurface(0);
        surface.setDisplay(this);
        return surface;
    }

    public void setSwapInterval(final int interval) {
    }

    public void terminate() {
    }
}
