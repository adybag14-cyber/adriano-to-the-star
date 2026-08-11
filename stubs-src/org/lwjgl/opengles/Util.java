package org.lwjgl.opengles;

public final class Util {
    private Util() {
    }

    public static void checkGLError() {
        GLES20.glGetError();
    }
}
