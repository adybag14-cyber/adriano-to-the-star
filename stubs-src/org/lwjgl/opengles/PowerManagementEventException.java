package org.lwjgl.opengles;

public class PowerManagementEventException extends RuntimeException {
    public PowerManagementEventException() {
    }

    public PowerManagementEventException(final String message) {
        super(message);
    }

    public PowerManagementEventException(final String message, final Throwable cause) {
        super(message, cause);
    }

    public PowerManagementEventException(final Throwable cause) {
        super(cause);
    }
}
