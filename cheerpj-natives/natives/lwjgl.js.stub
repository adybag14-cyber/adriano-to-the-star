window.CheerpJ_LWJGL_Natives = window.CheerpJ_LWJGL_Natives || {};

console.log("[LWJGL] Cleaned Native Overrides Loaded - " + Date.now());

// --- SYS / UTIL ---
function Java_org_lwjgl_Sys_alert(lib, title, message) {
	console.log("[LWJGL] Sys.alert called:", title, message);
}
function Java_org_lwjgl_Sys_openURL(lib, url) {
	console.log("[LWJGL] Sys.openURL called:", url);
	if (window.open) window.open(url, '_blank');
}
function Java_org_lwjgl_Sys_getClipboard(lib) { return ""; }
function Java_org_lwjgl_Sys_getVersion(lib) { return "2.9.3"; }

// --- DISPLAY ---
async function Java_org_lwjgl_opengl_LinuxDisplay_nGetAvailableDisplayModes(lib, extension_flags) {
	console.log("[LWJGL] nGetAvailableDisplayModes called");
	try {
		var DisplayMode = await lib.org.lwjgl.opengl.DisplayMode;
		var mode = await new DisplayMode(1280, 768);
		// Create array via CheerpJ helper if possible, or try to return JS array?
		// CheerpJ JNI usually expects a jobjectArray handle. 
		// We use lib.cheerpjCreateArray if available.
		if (lib.cheerpjCreateArray) {
			var arr = await lib.cheerpjCreateArray("org.lwjgl.opengl.DisplayMode", 1);
			arr[0] = mode;
			return arr;
		} else {
			// Fallback
			return [mode];
		}
	} catch (e) {
		console.error("Failed to create DisplayMode array stub", e);
		return null;
	}
}

// Fallbacks for other OS if needed
// --- OPENGL 1.1 STUBS (Fixed Pipeline Emulation) ---
var _glError = 0;

function Java_org_lwjgl_opengl_GL11_glClear(mask) {
	// console.log("[GL] glClear", mask);
}
function Java_org_lwjgl_opengl_GL11_glBegin(mode) {
	// console.log("[GL] glBegin", mode);
}
function Java_org_lwjgl_opengl_GL11_glEnd() {
	// console.log("[GL] glEnd");
}
function Java_org_lwjgl_opengl_GL11_glEnable(cap) {
	// console.log("[GL] glEnable", cap);
}
function Java_org_lwjgl_opengl_GL11_glDisable(cap) {
	// console.log("[GL] glDisable", cap);
}
function Java_org_lwjgl_opengl_GL11_glGetString(name) {
	console.log("[GL] glGetString", name);
	return "CheerpJ GL Stub Renderer";
}
function Java_org_lwjgl_opengl_GL11_glGetError() {
	return _glError;
}
function Java_org_lwjgl_opengl_GL11_glMatrixMode(mode) { }
function Java_org_lwjgl_opengl_GL11_glLoadIdentity() { }
function Java_org_lwjgl_opengl_GL11_glOrtho(l, r, b, t, n, f) { }
function Java_org_lwjgl_opengl_GL11_glPushMatrix() { }
function Java_org_lwjgl_opengl_GL11_glPopMatrix() { }
function Java_org_lwjgl_opengl_GL11_glRotatef(angle, x, y, z) { }
function Java_org_lwjgl_opengl_GL11_glTranslatef(x, y, z) { }
function Java_org_lwjgl_opengl_GL11_glScalef(x, y, z) { }

function Java_org_lwjgl_opengl_GL11_glViewport(x, y, w, h) {
	console.log("[GL] glViewport", x, y, w, h);
}
function Java_org_lwjgl_opengl_GL11_glBlendFunc(s, d) { }
function Java_org_lwjgl_opengl_GL11_glAlphaFunc(func, ref) { }
function Java_org_lwjgl_opengl_GL11_glColor4f(r, g, b, a) { }
function Java_org_lwjgl_opengl_GL11_glColor4ub(r, g, b, a) { }
function Java_org_lwjgl_opengl_GL11_glTexCoord2f(s, t) { }
function Java_org_lwjgl_opengl_GL11_glVertex2f(x, y) { }
function Java_org_lwjgl_opengl_GL11_glVertex3f(x, y, z) { }

function Java_org_lwjgl_opengl_GL11_glBindTexture(target, texture) { }
function Java_org_lwjgl_opengl_GL11_glGenTextures(n, textures) {
	// Need to return valid handles?
	console.log("[GL] glGenTextures called, n=" + n);
	// If textures is a buffer, we might need to write to it?
	// CheerpJ handles IntBuffer references differently.
	return 1;
}
function Java_org_lwjgl_opengl_GL11_glDeleteTextures(n, textures) { }

// --- TEXTURE LOADING STUBS ---
function Java_org_lwjgl_opengl_GL11_glTexImage2D(target, level, internalformat, width, height, border, format, type, pixels) {
	console.log(`[GL] glTexImage2D: ${width}x${height}`);
}
function Java_org_lwjgl_opengl_GL11_glTexParameteri(target, pname, param) { }

// --- OTHERS ---
function Java_org_lwjgl_opengl_GL11_glFlush() { }
function Java_org_lwjgl_opengl_GL11_glFinish() { }
function Java_org_lwjgl_opengl_GL11_glDepthFunc(func) { }
function Java_org_lwjgl_opengl_GL11_glDepthMask(flag) { }

// --- DISPLAY UPDATES ---
var _frames = 0;


async function Java_org_lwjgl_opengl_Display_getAvailableDisplayModes(lib) {
	console.log("[LWJGL] getAvailableDisplayModes called");
	return Java_org_lwjgl_opengl_LinuxDisplay_nGetAvailableDisplayModes(lib);
}

function Java_org_lwjgl_opengl_Display_isCreated() {
	// console.log("[LWJGL] isCreated called");
	return true; // Pretend we are created to avoid loops? Or false?
}
function Java_org_lwjgl_opengl_Display_create() {
	console.log("[LWJGL] Display.create called");
}
function Java_org_lwjgl_opengl_Display_update() {
	_frames++;
	if (_frames % 60 === 0) console.log(`[LWJGL] Display.update running... Frame: ${_frames}`);
}
async function Java_org_lwjgl_opengl_WindowsDisplay_nGetAvailableDisplayModes(lib) { console.log("[LWJGL] Windows nGetAvailableDisplayModes"); return Java_org_lwjgl_opengl_LinuxDisplay_nGetAvailableDisplayModes(lib); }
async function Java_org_lwjgl_opengl_MacOSXDisplay_nGetAvailableDisplayModes(lib) { console.log("[LWJGL] MacOS nGetAvailableDisplayModes"); return Java_org_lwjgl_opengl_LinuxDisplay_nGetAvailableDisplayModes(lib); }

function Java_org_lwjgl_opengl_Display_getWidth() { console.log("[LWJGL] getWidth called"); return 1280; }
function Java_org_lwjgl_opengl_Display_getHeight() { console.log("[LWJGL] getHeight called"); return 768; }
function Java_org_lwjgl_opengl_Display_getDisplayMode() {
	console.log("[LWJGL] getDisplayMode called");
	// Return a dummy DisplayMode object? Wrapper needs to handle this.
	// For now, let it fail or return null if not handled by native.
	// But wait, getDisplayMode isn't a native? It calls nGetDisplayMode?
	return null;
}

function Java_org_lwjgl_opengl_LinuxDisplay_nSetClassHint(lib, thread_handle, window_handle, name, value) { }

async function Java_org_lwjgl_opengl_LinuxDisplay_nCreateWindow(lib, x, y, width, height, undecorated, parent_handle, parent_window_handle) {
	console.log("[LWJGL] Native Display Create Called (nCreateWindow)");
	try {
		if (lib.org.lwjgl.opengl.Display) {
			// Try to let CheerpJ handle it if it has an implementation?
			// Or just return a fake handle to see if it proceeds.
			console.log("[LWJGL] Returning fake window handle 1");
			return 1;
		}
	} catch (e) {
		console.error("[LWJGL] Error in nCreateWindow stub", e);
	}
	return 1;
}

// --- SCREEN OVERRIDES ---
(function () {
	if (typeof window !== 'undefined') {
		const forcedWidth = 1280;
		const forcedHeight = 768;
		try {
			Object.defineProperty(window, 'innerWidth', { value: forcedWidth, configurable: true });
			Object.defineProperty(window, 'innerHeight', { value: forcedHeight, configurable: true });
			Object.defineProperty(document.documentElement, 'clientWidth', { value: forcedWidth, configurable: true });
			Object.defineProperty(document.documentElement, 'clientHeight', { value: forcedHeight, configurable: true });
		} catch (e) { console.warn("Screen override failed:", e); }
	}
})();

// --- CANVAS HELPER ---
var _glCanvas = null;
Object.defineProperty(window, 'glCanvas', {
	get: function () {
		if (!_glCanvas) {
			_glCanvas = window.lwjglCanvasElement || document.getElementsByTagName('canvas')[0] || document.getElementById('lwjglCanvas');
		}
		return _glCanvas;
	}
});

// --- TIME STUBS ---
function Java_org_lwjgl_DefaultSysImplementation_getTimerResolution() { return 1000n; }
function Java_org_lwjgl_Sys_getTimerResolution() { return 1000n; }
function Java_org_lwjgl_opengl_LinuxSysImplementation_getTimerResolution() { return 1000n; }
function Java_org_lwjgl_LinuxSysImplementation_getTimerResolution() { return 1000n; }

var _globLastTimeMs = 0n;
function getMonotonicTimeMs() {
	let now = BigInt(Math.floor(performance.now()));
	if (now <= _globLastTimeMs) { now = _globLastTimeMs + 1n; }
	_globLastTimeMs = now;
	return now;
}

function Java_org_lwjgl_DefaultSysImplementation_getTime() { return getMonotonicTimeMs(); }
function Java_org_lwjgl_Sys_getTime() {
	// Console spam warning!
	console.log("Sys.getTime");
	return getMonotonicTimeMs();
}
function Java_org_lwjgl_LinuxSysImplementation_nGetTime() { return getMonotonicTimeMs(); }
function Java_org_lwjgl_opengl_LinuxSysImplementation_nGetTime() { return getMonotonicTimeMs(); }

var _lwjgl_lastSystemMillis = 0n;
function Java_java_lang_System_currentTimeMillis() {
	var now = BigInt(Date.now());
	if (now <= _lwjgl_lastSystemMillis) now = _lwjgl_lastSystemMillis + 1n;
	_lwjgl_lastSystemMillis = now;
	return now;
}

var _lwjgl_lastNano = 0n;
function Java_java_lang_System_nanoTime() {
	var now = BigInt(Math.floor(performance.now() * 1000000));
	if (now <= _lwjgl_lastNano) now = _lwjgl_lastNano + 1000n;
	_lwjgl_lastNano = now;
	return now;
}

// --- AUDIO STUBS (Disable Audio to prevent crashes) ---
function Java_org_lwjgl_openal_AL_create() { console.log("[LWJGL] AL.create() called - STUBBING"); }
function Java_org_lwjgl_openal_AL_isCreated() { console.log("[LWJGL] AL.isCreated()"); return true; }
function Java_org_lwjgl_openal_ALC10_nalcOpenDevice() { return 1; }
function Java_org_lwjgl_openal_ALC10_nalcCreateContext() { return 1; }
function Java_org_lwjgl_openal_ALC10_nalcMakeContextCurrent() { return 1; }
function Java_org_lwjgl_openal_ALC10_nalcGetString() { return 0; }
function Java_org_lwjgl_openal_ALC10_nalcGetInteger() { return 0; }
function Java_org_lwjgl_openal_ALC10_nalcCloseDevice() { }
function Java_org_lwjgl_openal_ALC10_nalcDestroyContext() { }

// --- SYSCALL STUBS ---
window.CheerpJ_LWJGL_Natives.__syscall_pipe2 = function (pipefd, flags) {
	console.warn("[LWJGL] Stubbed __syscall_pipe2 called (returning -1)");
	return -1; // ENOSYS/Error
};

// --- NATIVE REGISTRATION ---
if (typeof window !== 'undefined') {
	// Register all global Java_* functions to CheerpJ_LWJGL_Natives
	for (const key of Object.getOwnPropertyNames(window)) {
		if (key.startsWith("Java_")) {
			window.CheerpJ_LWJGL_Natives[key] = window[key];
		}
	}
}

// Heartbeat
setInterval(() => {
	console.log("[Heartbeat] JS Thread Active. Time: " + Date.now());
}, 5000);
