/**
 * LWJGL2 JavaScript Bridge for CheerpJ 4.2
 * Provides JavaScript implementations of LWJGL native methods
 * 
 * CheerpJ 4.2 Native Method Requirements:
 * - All native functions must be `async`
 * - Function names: Java_<fully-qualified-class-name>_<method-name>
 * - Signature: async function(lib, [self], param1, param2, ...)
 *   - `lib`: CJ3Library object for calling back into Java
 *   - `self`: Java instance (omit for static methods)
 */

const LWJGL_Bridge = {
    // Track initialization state
    initialized: false,
    canvas: null,
    gl: null,
    displayWidth: 1280,
    displayHeight: 720,
    frameCounter: 0,
    lastSwapTime: 0,

    // Keyboard state tracking
    keyStates: {},
    keyBuffer: [],

    // Mouse state tracking  
    mouseX: 0,
    mouseY: 0,
    mouseButtons: [false, false, false],
    nextTextureId: 1,
    textures: {},
 
    // Initialize WebGL context
    init: function (container) {
        if (this.initialized) return true;

        console.log("LWJGL Bridge: Initializing WebGL context...");

        // Create canvas if not exists
        if (!this.canvas) {
            this.canvas = window.lwjglCanvasElement || document.createElement('canvas');
            if (!this.canvas.id) this.canvas.id = 'lwjgl-canvas';
            this.canvas.width = this.displayWidth;
            this.canvas.height = this.displayHeight;
            this.canvas.style.width = '100%';
            this.canvas.style.height = '100%';

            if (!this.canvas.parentElement) {
                if (container) {
                    container.appendChild(this.canvas);
                } else {
                    const gameContainer = document.getElementById('game-container');
                    if (gameContainer) gameContainer.appendChild(this.canvas);
                }
            }
        }

        // Get WebGL2 context
        this.gl = this.canvas.getContext('webgl2') || this.canvas.getContext('webgl');

        if (!this.gl) {
            console.error("LWJGL Bridge: WebGL not available!");
            return false;
        }

        // Set up input handlers
        this.setupInputHandlers();

        console.log("LWJGL Bridge: WebGL context created successfully");
        this.frameCounter = 0;
        this.lastSwapTime = performance.now();
        window.LWJGL_FrameCounter = this.frameCounter;
        window.LWJGL_LastSwapTime = this.lastSwapTime;
        this.initialized = true;
        return true;
    },

    // Setup keyboard and mouse input handlers
    setupInputHandlers: function () {
        const canvas = this.canvas;
        if (!canvas) return;

        // Keyboard events
        document.addEventListener('keydown', (e) => {
            this.keyStates[e.keyCode] = true;
            this.keyBuffer.push({ type: 'down', keyCode: e.keyCode, char: e.key });
        });

        document.addEventListener('keyup', (e) => {
            this.keyStates[e.keyCode] = false;
            this.keyBuffer.push({ type: 'up', keyCode: e.keyCode, char: e.key });
        });

        // Mouse events
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
        });

        canvas.addEventListener('mousedown', (e) => {
            if (e.button < 3) this.mouseButtons[e.button] = true;
        });

        canvas.addEventListener('mouseup', (e) => {
            if (e.button < 3) this.mouseButtons[e.button] = false;
        });
    },

    // Get WebGL context
    getGL: function () {
        return this.gl;
    }
};

/**
 * CheerpJ 4.2 Native Method Implementations
 * These functions are called when Java code calls native LWJGL methods
 * All functions are async as required by CheerpJ 4.2
 */
const CheerpJ_LWJGL_Natives = {
    // ========================================
    // System.loadLibrary entry points
    // ========================================
    async JNI_OnLoad_lwjgl(lib) {
        console.log("LWJGL Bridge: JNI_OnLoad_lwjgl called");
        LWJGL_Bridge.init();
        return 0; // JNI_VERSION
    },

    async JNI_OnLoad_lwjgl64(lib) {
        console.log("LWJGL Bridge: JNI_OnLoad_lwjgl64 called");
        LWJGL_Bridge.init();
        return 0;
    },

    // ========================================
    // Java Core Runtime Natives (Java 14+ features)
    // ========================================

    // Java 14+ Enhanced NPE message - must return null to use default message
    async Java_java_lang_NullPointerException_getExtendedNPEMessage(lib, self) {
        // Return null to let Java use its default NPE message
        return null;
    },

    // System natives that may be needed
    async Java_java_lang_System_nanoTime(lib) {
        return BigInt(Math.floor(performance.now() * 1000000));
    },

    async Java_java_lang_System_currentTimeMillis(lib) {
        return BigInt(Date.now());
    },

    // Runtime natives
    async Java_java_lang_Runtime_availableProcessors(lib, self) {
        return navigator.hardwareConcurrency || 4;
    },

    async Java_java_lang_Runtime_maxMemory(lib, self) {
        console.log("Java_java_lang_Runtime_maxMemory called");
        return 1073741824; // 1GB (Fits in 32-bit signed int)
    },

    async Java_java_lang_Runtime_totalMemory(lib, self) {
        return 536870912; // 512MB
    },

    async Java_java_lang_Runtime_freeMemory(lib, self) {
        return 268435456; // 256MB
    },

    // ========================================
    // JVM Reference/GC Natives (critical for Java 9+)
    // These are JVM internals for garbage collection reference handling
    // ========================================

    // ========================================
    // JVM Reference/GC Natives (critical for Java 9+)
    // We implement the *Native JNI* methods of java.lang.ref.Reference
    // to intercept the calls before they hit missing JVM internals
    // ========================================

    // java.lang.ref.Reference.hasReferencePendingList()
    async Java_java_lang_ref_Reference_hasReferencePendingList(lib) {
        return false; // No pending references
    },

    // java.lang.ref.Reference.waitForReferencePendingList()
    async Java_java_lang_ref_Reference_waitForReferencePendingList(lib) {
        // No-op
    },

    // java.lang.ref.Reference.getAndClearReferencePendingList()
    async Java_java_lang_ref_Reference_getAndClearReferencePendingList(lib) {
        return null; // Return null (no references)
    },

    // Also keep JVM_ aliases just in case direct internal binding is attempted
    async JVM_HasReferencePendingList(lib) { return false; },
    async JVM_WaitForReferencePendingList(lib) { return; },
    async JVM_GetAndClearReferencePendingList(lib) { return null; },

    // Additional JVM natives that may be needed
    async JVM_GetStackAccessControlContext(lib, env) {
        return null; // No security manager in browser
    },

    async JVM_GetInheritedAccessControlContext(lib, env, cls) {
        return null;
    },

    async JVM_CurrentThread(lib, env, threadClass) {
        // Return null - CheerpJ manages threads internally
        return null;
    },

    async JVM_ActiveProcessorCount(lib) {
        return navigator.hardwareConcurrency || 4;
    },

    async JVM_IsSupportedJNIVersion(lib, version) {
        // Support JNI 1.1 through 10
        return (version >= 0x00010001 && version <= 0x000A0000) ? 1 : 0;
    },

    async JVM_FindLibraryEntry(lib, handle, name) {
        console.log(`JVM_FindLibraryEntry: ${name}`);
        // Spoof success for libraries we implement in JS
        if (name && (name.includes("lwjgl") || name.includes("jawt") || name.includes("openal") || name.includes("OpenAL"))) {
            return { address: 1 };
        }
        return { address: 0 }; // Not found but valid return type
    },

    // JVM_LoadLibrary - Critical Stub
    async JVM_LoadLibrary(lib, name) {
        console.log(`STUB: JVM_LoadLibrary called for: ${name}`);
        return { address: 1 };
    },

    // ========================================
    // ClassLoader Natives (to bypass JVM_LoadLibrary/UnsatisfiedLinkError)
    // ========================================

    // Runtime.loadLibrary0 fallback interception
    async Java_java_lang_Runtime_loadLibrary0(lib, self, fromClass, libname) {
        console.log(`Runtime.loadLibrary0 intercepted: ${libname}`);
        // We cannot prevent the JVM from proceeding to ClassLoader here easily without reimplementing the logic,
        // but we can log it.
        return null;
    },

    // ========================================
    // org.lwjgl.Sys native methods (static)
    // ========================================
    async Java_org_lwjgl_Sys_getVersion(lib) {
        console.log("Java_org_lwjgl_Sys_getVersion called");
        return "2.9.4"; // LWJGL2 version string
    },

    async Java_org_lwjgl_Sys_getTimerResolution(lib) {
        return 1000000000; // nanosecond resolution
    },

    async Java_org_lwjgl_Sys_getTime(lib) {
        return BigInt(Math.floor(performance.now() * 1000000)); // Convert to nanoseconds
    },

    async Java_org_lwjgl_Sys_nAlert(lib, title, message) {
        window.alert(`${title}: ${message}`);
    },

    // ========================================
    // org.lwjgl.opengl.Display native methods (static)
    // ========================================
    async Java_org_lwjgl_opengl_Display_nCreate(lib, mode, fullscreen, parent) {
        console.log("LWJGL Bridge: Display.create() called");
        return LWJGL_Bridge.init() ? 0 : -1;
    },

    async Java_org_lwjgl_opengl_Display_nGetWidth(lib) {
        return LWJGL_Bridge.displayWidth;
    },

    async Java_org_lwjgl_opengl_Display_nGetHeight(lib) {
        return LWJGL_Bridge.displayHeight;
    },

    async Java_org_lwjgl_opengl_Display_nIsCloseRequested(lib) {
        return 0; // Never close in browser
    },

    async Java_org_lwjgl_opengl_Display_nUpdate(lib) {
        // Browser handles refresh automatically
        LWJGL_Bridge.frameCounter += 1;
        window.LWJGL_FrameCounter = LWJGL_Bridge.frameCounter;
        window.LWJGL_LastSwapTime = performance.now();
        if (window.reportLwjglFrame && LWJGL_Bridge.frameCounter % 5 === 0) {
            window.reportLwjglFrame(LWJGL_Bridge.frameCounter);
        }
    },

    async Java_org_lwjgl_opengl_Display_nSwapBuffers(lib) {
        // WebGL swaps automatically
        LWJGL_Bridge.frameCounter += 1;
        window.LWJGL_FrameCounter = LWJGL_Bridge.frameCounter;
        window.LWJGL_LastSwapTime = performance.now();
        if (window.reportLwjglFrame && LWJGL_Bridge.frameCounter % 5 === 0) {
            window.reportLwjglFrame(LWJGL_Bridge.frameCounter);
        }
    },

    async Java_org_lwjgl_opengl_Display_nSetTitle(lib, title) {
        if (title) {
            document.title = title + " - Starsector Browser";
        }
    },

    async Java_org_lwjgl_opengl_Display_nSetResizable(lib, resizable) {
        // Browser handles this
    },

    async Java_org_lwjgl_opengl_Display_nIsActive(lib) {
        return document.hasFocus() ? 1 : 0;
    },

    async Java_org_lwjgl_opengl_Display_nIsVisible(lib) {
        return document.visibilityState === 'visible' ? 1 : 0;
    },

    async Java_org_lwjgl_opengl_LinuxDisplay_setErrorHandler(lib) {
        return BigInt(0);
    },

    async Java_org_lwjgl_opengl_LinuxDisplay_openDisplay(lib) {
        return BigInt(1);
    },

    async Java_org_lwjgl_opengl_LinuxDisplay_closeDisplay(lib, display) {
    },

    async Java_org_lwjgl_opengl_LinuxDisplay_resetErrorHandler(lib, handler) {
        return BigInt(0);
    },

    async Java_org_lwjgl_opengl_LinuxDisplay_callErrorHandler(lib, handler, display, error_ptr) {
        return 0;
    },

    async Java_org_lwjgl_opengl_LinuxDisplay_synchronize(lib, display, synchronize) {
    },

    async Java_org_lwjgl_opengl_LinuxDisplay_getErrorText(lib, display, error_code) {
        return "XError";
    },

    async Java_org_lwjgl_opengl_LinuxDisplay_nGetDefaultScreen(lib, display) {
        return 0;
    },

    async Java_org_lwjgl_opengl_LinuxDisplay_getRootWindow(lib, display, screen) {
        return BigInt(1);
    },

    async Java_org_lwjgl_opengl_LinuxDisplay_nCreateWindow(lib, display, screen, peer_info_handle, mode, window_mode, x, y, undecorated, parent_handle, resizable) {
        return BigInt(1);
    },

    async Java_org_lwjgl_opengl_LinuxDisplay_mapRaised(lib, display, window) {
    },

    async Java_org_lwjgl_opengl_LinuxDisplay_nSetTitle(lib, display, window, title, len) {
    },

    async Java_org_lwjgl_opengl_LinuxDisplay_nSetClassHint(lib, display, window, wm_name, wm_class) {
    },

    async Java_org_lwjgl_opengl_LinuxDisplay_nSetWindowIcon(lib, display, window, icons_data, icons_size) {
    },

    async Java_org_lwjgl_opengl_LinuxDisplay_nCreateBlankCursor(lib, display, window) {
        return BigInt(0);
    },

    async Java_org_lwjgl_opengl_LinuxDisplay_nDefineCursor(lib, display, window, cursor_handle) {
    },

    async Java_org_lwjgl_opengl_LinuxDisplay_nInternAtom(lib, display, atom_name, only_if_exists) {
        if (atom_name === "_XEMBED_INFO") {
            return BigInt(0);
        }
        return BigInt(1);
    },

    async Java_org_lwjgl_opengl_LinuxDisplay_nIsXrandrSupported(lib, display) {
        return false;
    },

    async Java_org_lwjgl_opengl_LinuxDisplay_nIsXF86VidModeSupported(lib, display) {
        return true;
    },

    async Java_org_lwjgl_opengl_LinuxDisplay_nGetCurrentGammaRamp(lib, display, screen) {
        return null;
    },

    async Java_org_lwjgl_opengl_LinuxDisplay_nGetAvailableDisplayModes(lib, display, screen, extension) {
        const DisplayMode = await lib.org.lwjgl.opengl.DisplayMode;
        const primary = await new DisplayMode(LWJGL_Bridge.displayWidth, LWJGL_Bridge.displayHeight);
        const fallback = await new DisplayMode(1920, 1080);
        return [primary, fallback];
    },

    async Java_org_lwjgl_opengl_LinuxDisplay_nLockAWT(lib) {
    },

    async Java_org_lwjgl_opengl_LinuxDisplay_nUnlockAWT(lib) {
    },

    async Java_org_lwjgl_opengl_LinuxPeerInfo_createHandle(lib) {
        const ByteBuffer = await lib.java.nio.ByteBuffer;
        return await ByteBuffer.allocateDirect(64);
    },

    async Java_org_lwjgl_opengl_GLContext_nLoadOpenGLLibrary(lib) {
        LWJGL_Bridge.init();
    },

    async Java_org_lwjgl_opengl_GLContext_nUnloadOpenGLLibrary(lib) {
    },

    async Java_org_lwjgl_opengl_GLContext_resetNativeStubs(lib, clazz) {
    },

    async Java_org_lwjgl_opengl_GLContext_ngetFunctionAddress(lib, name) {
        return 1;
    },

    async Java_org_lwjgl_opengl_LinuxDisplayPeerInfo_initDefaultPeerInfo(lib, display, screen, peer_info_handle, pixel_format) {
    },

    async Java_org_lwjgl_opengl_LinuxDisplayPeerInfo_initDrawable(lib, window, peer_info_handle) {
    },

    async Java_org_lwjgl_opengl_LinuxPeerInfo_nGetDisplay(lib, handle) {
        return BigInt(1);
    },

    async Java_org_lwjgl_opengl_LinuxPeerInfo_nGetDrawable(lib, handle) {
        return BigInt(1);
    },

    async Java_org_lwjgl_opengl_LinuxContextImplementation_nCreate(lib, peer_handle, attribs, shared_context_handle) {
        LWJGL_Bridge.init();
        const ByteBuffer = await lib.java.nio.ByteBuffer;
        return await ByteBuffer.allocateDirect(64);
    },

    async Java_org_lwjgl_opengl_LinuxContextImplementation_nMakeCurrent(lib, peer_handle, context_handle) {
        LWJGL_Bridge.init();
    },

    async Java_org_lwjgl_opengl_LinuxContextImplementation_nIsCurrent(lib, context_handle) {
        return true;
    },

    async Java_org_lwjgl_opengl_LinuxContextImplementation_nSwapBuffers(lib, peer_info_handle) {
    },

    async Java_org_lwjgl_opengl_LinuxContextImplementation_nReleaseCurrentContext(lib, peer_info_handle) {
    },

    async Java_org_lwjgl_opengl_LinuxContextImplementation_nSetSwapInterval(lib, peer_handle, context_handle, value) {
    },

    async Java_org_lwjgl_opengl_LinuxContextImplementation_nDestroy(lib, peer_handle, context_handle) {
    },

    async Java_org_lwjgl_opengl_LinuxContextImplementation_getGLXContext(lib, self, context_handle) {
        return BigInt(1);
    },

    async Java_org_lwjgl_opengl_LinuxContextImplementation_getDisplay(lib, self, peer_info_handle) {
        return BigInt(1);
    },

    async Java_org_lwjgl_opengl_LinuxMouse_nGetButtonCount(lib, display) {
        return 3;
    },

    async Java_org_lwjgl_opengl_LinuxMouse_nGetWindowHeight(lib, display, window) {
        return LWJGL_Bridge.displayHeight;
    },

    async Java_org_lwjgl_opengl_LinuxMouse_nGetWindowWidth(lib, display, window) {
        return LWJGL_Bridge.displayWidth;
    },

    async Java_org_lwjgl_opengl_LinuxMouse_nQueryPointer(lib, display, window, result) {
        return BigInt(1);
    },

    async Java_org_lwjgl_opengl_LinuxMouse_nWarpCursor(lib, display, window, x, y) {
    },

    async Java_org_lwjgl_opengl_LinuxMouse_nSendWarpEvent(lib, display, window, warp_atom, center_x, center_y) {
    },

    async Java_org_lwjgl_opengl_LinuxKeyboard_getModifierMapping(lib, display) {
        return BigInt(0);
    },

    async Java_org_lwjgl_opengl_LinuxKeyboard_nSetDetectableKeyRepeat(lib, display, enabled) {
        return true;
    },

    async Java_org_lwjgl_opengl_LinuxKeyboard_openIM(lib, display) {
        return BigInt(0);
    },

    async Java_org_lwjgl_opengl_LinuxKeyboard_allocateComposeStatus(lib) {
        const ByteBuffer = await lib.java.nio.ByteBuffer;
        return await ByteBuffer.allocateDirect(8);
    },

    async Java_org_lwjgl_opengl_LinuxEvent_createEventBuffer(lib) {
        const ByteBuffer = await lib.java.nio.ByteBuffer;
        return await ByteBuffer.allocateDirect(192);
    },

    async Java_org_lwjgl_opengl_LinuxEvent_getPending(lib, display) {
        return 0;
    },

    async Java_org_lwjgl_opengl_LinuxEvent_nSetWindow(lib, event_buffer, window) {
    },

    async Java_org_lwjgl_opengl_LinuxEvent_nSendEvent(lib, event_buffer, display, window, propagate, event_mask) {
    },

    async Java_org_lwjgl_opengl_LinuxEvent_nFilterEvent(lib, event_buffer, window) {
        return false;
    },

    async Java_org_lwjgl_opengl_LinuxEvent_nNextEvent(lib, display, event_buffer) {
    },

    async Java_org_lwjgl_opengl_LinuxEvent_nGetType(lib, event_buffer) {
        return 0;
    },

    async Java_org_lwjgl_opengl_LinuxEvent_nGetWindow(lib, event_buffer) {
        return 0;
    },

    async Java_org_lwjgl_opengl_LinuxEvent_nGetFocusMode(lib, event_buffer) {
        return 0;
    },

    async Java_org_lwjgl_opengl_LinuxEvent_nGetFocusDetail(lib, event_buffer) {
        return 0;
    },

    async Java_org_lwjgl_opengl_LinuxEvent_nGetClientMessageType(lib, event_buffer) {
        return 0;
    },

    async Java_org_lwjgl_opengl_LinuxEvent_nGetClientData(lib, event_buffer, index) {
        return 0;
    },

    async Java_org_lwjgl_opengl_LinuxEvent_nGetClientFormat(lib, event_buffer) {
        return 0;
    },

    async Java_org_lwjgl_opengl_LinuxEvent_nGetButtonTime(lib, event_buffer) {
        return 0;
    },

    async Java_org_lwjgl_opengl_LinuxEvent_nGetButtonState(lib, event_buffer) {
        return 0;
    },

    async Java_org_lwjgl_opengl_LinuxEvent_nGetButtonType(lib, event_buffer) {
        return 0;
    },

    async Java_org_lwjgl_opengl_LinuxEvent_nGetButtonButton(lib, event_buffer) {
        return 0;
    },

    async Java_org_lwjgl_opengl_LinuxEvent_nGetButtonRoot(lib, event_buffer) {
        return 0;
    },

    async Java_org_lwjgl_opengl_LinuxEvent_nGetButtonXRoot(lib, event_buffer) {
        return 0;
    },

    async Java_org_lwjgl_opengl_LinuxEvent_nGetButtonYRoot(lib, event_buffer) {
        return 0;
    },

    async Java_org_lwjgl_opengl_LinuxEvent_nGetButtonX(lib, event_buffer) {
        return 0;
    },

    async Java_org_lwjgl_opengl_LinuxEvent_nGetButtonY(lib, event_buffer) {
        return 0;
    },

    async Java_org_lwjgl_opengl_LinuxEvent_nGetKeyAddress(lib, event_buffer) {
        return 0;
    },

    async Java_org_lwjgl_opengl_LinuxEvent_nGetKeyTime(lib, event_buffer) {
        return 0;
    },

    async Java_org_lwjgl_opengl_LinuxEvent_nGetKeyType(lib, event_buffer) {
        return 0;
    },

    async Java_org_lwjgl_opengl_LinuxEvent_nGetKeyKeyCode(lib, event_buffer) {
        return 0;
    },

    async Java_org_lwjgl_opengl_LinuxEvent_nGetKeyState(lib, event_buffer) {
        return 0;
    },

    // ========================================
    // org.lwjgl.opengl.GL11 native methods (static)
    // ========================================
    async Java_org_lwjgl_opengl_GL11_nglEnable(lib, cap) {
        const gl = LWJGL_Bridge.getGL();
        if (gl) gl.enable(cap);
    },

    async Java_org_lwjgl_opengl_GL11_nglDisable(lib, cap) {
        const gl = LWJGL_Bridge.getGL();
        if (gl) gl.disable(cap);
    },

    async Java_org_lwjgl_opengl_GL11_nglClear(lib, mask) {
        const gl = LWJGL_Bridge.getGL();
        if (gl) gl.clear(mask);
    },

    async Java_org_lwjgl_opengl_GL11_nglClearColor(lib, r, g, b, a) {
        const gl = LWJGL_Bridge.getGL();
        if (gl) gl.clearColor(r, g, b, a);
    },

    async Java_org_lwjgl_opengl_GL11_nglViewport(lib, x, y, w, h) {
        const gl = LWJGL_Bridge.getGL();
        if (gl) gl.viewport(x, y, w, h);
    },

    async Java_org_lwjgl_opengl_GL11_nglBegin(lib, mode) {
        // Legacy immediate mode - not supported in WebGL
        console.warn("LWJGL Bridge: glBegin not supported in WebGL");
    },

    async Java_org_lwjgl_opengl_GL11_nglEnd(lib) {
        console.warn("LWJGL Bridge: glEnd not supported in WebGL");
    },

    async Java_org_lwjgl_opengl_GL11_nglFlush(lib) {
        const gl = LWJGL_Bridge.getGL();
        if (gl) gl.flush();
    },

    async Java_org_lwjgl_opengl_GL11_nglFinish(lib) {
        const gl = LWJGL_Bridge.getGL();
        if (gl) gl.finish();
    },

    async Java_org_lwjgl_opengl_GL11_nglGetError(lib) {
        const gl = LWJGL_Bridge.getGL();
        return gl ? gl.getError() : 0;
    },

    async Java_org_lwjgl_opengl_GL11_nglGetString(lib, name, function_pointer) {
        const gl = LWJGL_Bridge.getGL();
        try {
            if (!gl) {
                if (name === 0x1F02) return "2.1 WebGL";
                if (name === 0x1F00) return "WebGL";
                if (name === 0x1F01) return "WebGL";
                if (name === 0x1F03) return "";
                return "";
            }

            switch (name) {
                case 0x1F00: { // GL_VENDOR
                    return gl.getParameter(gl.VENDOR) || "WebGL";
                }
                case 0x1F01: { // GL_RENDERER
                    const dbg = gl.getExtension && gl.getExtension('WEBGL_debug_renderer_info');
                    if (dbg) return gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || gl.getParameter(gl.RENDERER) || "WebGL";
                    return gl.getParameter(gl.RENDERER) || "WebGL";
                }
                case 0x1F02: { // GL_VERSION
                    return "2.1 WebGL";
                }
                case 0x1F03: { // GL_EXTENSIONS
                    const exts = gl.getSupportedExtensions ? gl.getSupportedExtensions() : [];
                    return exts && exts.length ? exts.join(' ') : "";
                }
                default: {
                    return (typeof gl.getParameter === 'function' ? (gl.getParameter(name) || "") : "");
                }
            }
        } catch (e) {
            return "";
        }
    },

    async Java_org_lwjgl_opengl_GL11_nglGetIntegerv(lib, pname, params, function_pointer) {
        const gl = LWJGL_Bridge.getGL();
        let values = null;

        if (gl && typeof gl.getParameter === 'function') {
            try {
                const v = gl.getParameter(pname);
                if (typeof v === 'number') {
                    values = [v];
                } else if (typeof v === 'boolean') {
                    values = [v ? 1 : 0];
                } else if (Array.isArray(v)) {
                    values = v;
                } else if (v && typeof v.length === 'number') {
                    values = Array.from(v);
                }
            } catch (e) {
            }
        }

        if (!values) values = [0];

        const ints = values.map((x) => {
            if (typeof x === 'boolean') return x ? 1 : 0;
            if (typeof x === 'number') return x | 0;
            if (typeof x === 'bigint') return Number(x) | 0;
            return 0;
        });

        if (typeof params === 'number' || typeof params === 'bigint') {
            const addr = Number(params);
            const dv = (typeof lib.getJNIDataView === 'function') ? lib.getJNIDataView() : null;
            if (dv && Number.isFinite(addr)) {
                const max = Math.min(ints.length, 16);
                for (let i = 0; i < max; i++) {
                    dv.setInt32(addr + i * 4, ints[i], true);
                }
            }
            return;
        }

        if (params && typeof params.length === 'number') {
            const max = Math.min(ints.length, params.length);
            for (let i = 0; i < max; i++) {
                params[i] = ints[i];
            }
        }
    },

    async Java_org_lwjgl_opengl_GL11_nglBlendFunc(lib, sfactor, dfactor) {
        const gl = LWJGL_Bridge.getGL();
        if (gl) gl.blendFunc(sfactor, dfactor);
    },

    async Java_org_lwjgl_opengl_GL11_nglColorMask(lib, red, green, blue, alpha, function_pointer) {
        const gl = LWJGL_Bridge.getGL();
        if (gl) gl.colorMask(!!red, !!green, !!blue, !!alpha);
    },

    async Java_org_lwjgl_opengl_GL11_nglColor4ub(lib, red, green, blue, alpha, function_pointer) {
    },

    async Java_org_lwjgl_opengl_GL11_nglPushAttrib(lib, mask, function_pointer) {
    },

    async Java_org_lwjgl_opengl_GL11_nglPopAttrib(lib, function_pointer) {
    },

    async Java_org_lwjgl_opengl_GL11_nglPushClientAttrib(lib, mask, function_pointer) {
    },

    async Java_org_lwjgl_opengl_GL11_nglPopClientAttrib(lib, function_pointer) {
    },

    async Java_org_lwjgl_opengl_GL11_nglDepthFunc(lib, func) {
        const gl = LWJGL_Bridge.getGL();
        if (gl) gl.depthFunc(func);
    },

    async Java_org_lwjgl_opengl_GL11_nglDepthMask(lib, flag) {
        const gl = LWJGL_Bridge.getGL();
        if (gl) gl.depthMask(flag);
    },

    async Java_org_lwjgl_opengl_GL11_nglCullFace(lib, mode) {
        const gl = LWJGL_Bridge.getGL();
        if (gl) gl.cullFace(mode);
    },

    async Java_org_lwjgl_opengl_GL11_nglFrontFace(lib, mode) {
        const gl = LWJGL_Bridge.getGL();
        if (gl) gl.frontFace(mode);
    },

    // Texture methods
    async Java_org_lwjgl_opengl_GL11_nglGenTextures(lib, n, textures, function_pointer) {
        const gl = LWJGL_Bridge.getGL();
        if (!gl) return;

        const dv = (typeof lib.getJNIDataView === 'function') ? lib.getJNIDataView() : null;

        let baseAddr = null;
        if (typeof textures === 'number' || typeof textures === 'bigint') {
            baseAddr = Number(textures);
        } else if (textures && typeof textures === 'object' && ('address' in textures)) {
            baseAddr = Number(textures.address);
        }

        const count = n | 0;
        for (let i = 0; i < count; i++) {
            const id = LWJGL_Bridge.nextTextureId++;
            const tex = gl.createTexture();
            LWJGL_Bridge.textures[id] = tex;

            if (dv && baseAddr !== null && Number.isFinite(baseAddr)) {
                dv.setInt32(baseAddr + i * 4, id, true);
            } else if (textures && typeof textures.length === 'number') {
                textures[i] = id;
            }
        }
    },

    async Java_org_lwjgl_opengl_GL11_nglBindTexture(lib, target, texture, function_pointer) {
        const gl = LWJGL_Bridge.getGL();
        if (!gl) return;

        let texObj = null;
        if (texture === 0 || texture === 0n || texture == null) {
            texObj = null;
        } else if (typeof texture === 'number' || typeof texture === 'bigint') {
            const id = Number(texture);
            texObj = LWJGL_Bridge.textures[id];
            if (!texObj) {
                texObj = gl.createTexture();
                LWJGL_Bridge.textures[id] = texObj;
            }
        } else {
            texObj = texture;
        }

        gl.bindTexture(target, texObj);
    },

    async Java_org_lwjgl_opengl_GL11_nglDeleteTextures(lib, n, textures, function_pointer) {
        const gl = LWJGL_Bridge.getGL();
        if (!gl) return;

        if (textures && typeof textures === 'object' && typeof textures.length !== 'number') {
            try {
                gl.deleteTexture(textures);
            } catch (e) {
            }
            return;
        }

        const dv = (typeof lib.getJNIDataView === 'function') ? lib.getJNIDataView() : null;

        let baseAddr = null;
        if (typeof textures === 'number' || typeof textures === 'bigint') {
            baseAddr = Number(textures);
        } else if (textures && typeof textures === 'object' && ('address' in textures)) {
            baseAddr = Number(textures.address);
        }

        const count = n | 0;
        for (let i = 0; i < count; i++) {
            let id = 0;
            if (dv && baseAddr !== null && Number.isFinite(baseAddr)) {
                id = dv.getInt32(baseAddr + i * 4, true);
            } else if (textures && typeof textures.length === 'number') {
                id = textures[i] | 0;
            }

            if (!id) continue;

            const texObj = LWJGL_Bridge.textures[id];
            if (texObj) {
                try {
                    gl.deleteTexture(texObj);
                } catch (e) {
                }
                delete LWJGL_Bridge.textures[id];
            }
        }
    },

    // Matrix operations (legacy - need shader-based implementation)
    async Java_org_lwjgl_opengl_GL11_nglMatrixMode(lib, mode) {
        console.warn("LWJGL Bridge: glMatrixMode (legacy) - using modern pipeline");
    },

    async Java_org_lwjgl_opengl_GL11_nglLoadIdentity(lib) {
        console.warn("LWJGL Bridge: glLoadIdentity (legacy)");
    },

    async Java_org_lwjgl_opengl_GL11_nglOrtho(lib, left, right, bottom, top, near, far) {
        console.warn("LWJGL Bridge: glOrtho (legacy)");
    },

    async Java_org_lwjgl_opengl_GL11_nglPushMatrix(lib) {
        console.warn("LWJGL Bridge: glPushMatrix (legacy)");
    },

    async Java_org_lwjgl_opengl_GL11_nglPopMatrix(lib) {
        console.warn("LWJGL Bridge: glPopMatrix (legacy)");
    },

    async Java_org_lwjgl_opengl_GL11_nglTranslatef(lib, x, y, z) {
        console.warn("LWJGL Bridge: glTranslatef (legacy)");
    },

    async Java_org_lwjgl_opengl_GL11_nglRotatef(lib, angle, x, y, z) {
        console.warn("LWJGL Bridge: glRotatef (legacy)");
    },

    async Java_org_lwjgl_opengl_GL11_nglScalef(lib, x, y, z) {
        console.warn("LWJGL Bridge: glScalef (legacy)");
    },

    async Java_org_lwjgl_opengl_GL11_nglVertex2f(lib, x, y, function_pointer) {
    },

    // ========================================
    // org.lwjgl.input.Keyboard native methods (static)
    // ========================================
    async Java_org_lwjgl_input_Keyboard_nCreate(lib) {
        console.log("LWJGL Bridge: Keyboard.create() called");
        return 0;
    },

    async Java_org_lwjgl_input_Keyboard_nDestroy(lib) {
        // Cleanup if needed
    },

    async Java_org_lwjgl_input_Keyboard_nPoll(lib) {
        // Browser handles input differently
    },

    async Java_org_lwjgl_input_Keyboard_nIsKeyDown(lib, key) {
        return LWJGL_Bridge.keyStates[key] ? 1 : 0;
    },

    async Java_org_lwjgl_input_Keyboard_nNext(lib) {
        return LWJGL_Bridge.keyBuffer.length > 0 ? 1 : 0;
    },

    async Java_org_lwjgl_input_Keyboard_nGetEventKey(lib) {
        if (LWJGL_Bridge.keyBuffer.length > 0) {
            return LWJGL_Bridge.keyBuffer[0].keyCode;
        }
        return 0;
    },

    async Java_org_lwjgl_input_Keyboard_nGetEventKeyState(lib) {
        if (LWJGL_Bridge.keyBuffer.length > 0) {
            return LWJGL_Bridge.keyBuffer[0].type === 'down' ? 1 : 0;
        }
        return 0;
    },

    // ========================================
    // org.lwjgl.input.Mouse native methods (static)
    // ========================================
    async Java_org_lwjgl_input_Mouse_nCreate(lib) {
        console.log("LWJGL Bridge: Mouse.create() called");
        return 0;
    },

    async Java_org_lwjgl_input_Mouse_nDestroy(lib) {
        // Cleanup if needed  
    },

    async Java_org_lwjgl_input_Mouse_nPoll(lib) {
        // Browser handles input differently
    },

    async Java_org_lwjgl_input_Mouse_nGetX(lib) {
        return Math.floor(LWJGL_Bridge.mouseX);
    },

    async Java_org_lwjgl_input_Mouse_nGetY(lib) {
        // LWJGL uses bottom-left origin, flip Y
        return Math.floor(LWJGL_Bridge.displayHeight - LWJGL_Bridge.mouseY);
    },

    async Java_org_lwjgl_input_Mouse_nIsButtonDown(lib, button) {
        return LWJGL_Bridge.mouseButtons[button] ? 1 : 0;
    },

    async Java_org_lwjgl_input_Mouse_nSetGrabbed(lib, grabbed) {
        if (grabbed && LWJGL_Bridge.canvas) {
            LWJGL_Bridge.canvas.requestPointerLock?.();
        } else {
            document.exitPointerLock?.();
        }
    },

    async Java_org_lwjgl_input_Mouse_nIsGrabbed(lib) {
        return document.pointerLockElement === LWJGL_Bridge.canvas ? 1 : 0;
    },

    // ========================================
    // OpenAL stubs (audio - return success codes)
    // ========================================
    async Java_org_lwjgl_openal_AL10_nalGenSources(lib, n) {
        console.log("LWJGL Bridge: OpenAL alGenSources (stub)");
        return 1; // Return fake source ID
    },

    async Java_org_lwjgl_openal_AL10_nalSourcePlay(lib, source) {
        // Audio stub
    },

    async Java_org_lwjgl_openal_AL10_nalSourceStop(lib, source) {
        // Audio stub
    },

    async Java_org_lwjgl_openal_ALC10_nalcOpenDevice(lib, devicename) {
        console.log("LWJGL Bridge: OpenAL alcOpenDevice (stub)");
        return 1; // Return fake device handle
    },

    async Java_org_lwjgl_openal_ALC10_nalcCreateContext(lib, device, attrList) {
        console.log("LWJGL Bridge: OpenAL alcCreateContext (stub)");
        return 1; // Return fake context handle
    },

    async Java_org_lwjgl_openal_ALC10_nalcMakeContextCurrent(lib, context) {
        return 1; // Success
    }
};

// Export for CheerpJ 4.2
window.LWJGL_Bridge = LWJGL_Bridge;
window.CheerpJ_LWJGL_Natives = CheerpJ_LWJGL_Natives;

// Also keep old export name for backwards compatibility
window.LWJGL_Natives = CheerpJ_LWJGL_Natives;

console.log("LWJGL2 JavaScript Bridge loaded (CheerpJ 4.2 compatible)");
