package org.lwjgl.opengles;

import java.nio.IntBuffer;

public final class PixelFormat {
    public IntBuffer getAttribBuffer(final EGLDisplay display, final int surfaceType, final int[] lwjglAttribs) {
        if (lwjglAttribs == null) {
            return IntBuffer.allocate(0);
        }
        final IntBuffer buf = IntBuffer.allocate(lwjglAttribs.length);
        buf.put(lwjglAttribs);
        buf.flip();
        return buf;
    }

    public EGLConfig getBestMatch(final EGLConfig[] configs) {
        if (configs == null || configs.length == 0) {
            return null;
        }
        return configs[0];
    }

    public void setSurfaceAttribs(final EGLSurface surface) {
    }
}
