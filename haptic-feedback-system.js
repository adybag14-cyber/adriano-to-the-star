/**
 * Haptic Feedback Interface
 * Integrates Gamepad API to provide physical feedback.
 * "Feel the burn."
 */

class HapticFeedbackSystem {
    constructor() {
        this.gamepads = {};
        this.supported = 'vibrate' in navigator || 'getGamepads' in navigator;

        if (this.supported) {
            window.addEventListener("gamepadconnected", (e) => this.connectHandler(e));
            window.addEventListener("gamepaddisconnected", (e) => this.disconnectHandler(e));
        }
    }

    connectHandler(e) {
        console.log("🎮 Gamepad connected:", e.gamepad.id);
        this.gamepads[e.gamepad.index] = e.gamepad;
        this.triggerHaptic("pulse", 100); // Pulse to confirm
    }

    disconnectHandler(e) {
        console.log("🎮 Gamepad disconnected:", e.gamepad.id);
        delete this.gamepads[e.gamepad.index];
    }

    triggerHaptic(type, duration = 200, intensity = 1.0) {
        // Method 1: Navigator Vibrate (Mobile/Tablet)
        if (navigator.vibrate) {
            navigator.vibrate(duration);
        }

        // Method 2: Gamepad Haptics
        const pads = navigator.getGamepads ? navigator.getGamepads() : [];
        for (let i = 0; i < pads.length; i++) {
            const gp = pads[i];
            if (gp && gp.vibrationActuator) {
                gp.vibrationActuator.playEffect("dual-rumble", {
                    startDelay: 0,
                    duration: duration,
                    weakMagnitude: intensity,
                    strongMagnitude: type === "explosion" ? intensity : 0
                });
            }
        }

        console.log(`📳 Haptic Event: ${type} (${duration}ms)`);
    }

    // Preset effects
    explosion() { this.triggerHaptic("explosion", 500, 1.0); }
    gunshot() { this.triggerHaptic("shot", 50, 0.5); }
    collision() { this.triggerHaptic("collision", 300, 0.8); }
}

if (typeof window !== 'undefined') {
    window.HapticFeedbackSystem = HapticFeedbackSystem;
    window.hapticFeedbackSystem = new HapticFeedbackSystem();
}
