function Java_org_lwjgl_opengl_LinuxEvent_nFilterEvent() {
}

function Java_org_lwjgl_opengl_LinuxEvent_nGetButtonTime() {
    // TODO: Event timestamps
}

function Java_org_lwjgl_opengl_LinuxEvent_nGetButtonRoot() {
}

async function Java_org_lwjgl_opengl_LinuxEvent_nGetButtonXRoot(lib, buffer) {
    var bufferAddr = Number(await buffer.address());
    var v = lib.getJNIDataView();
    return v.getInt32(4, true);
}

async function Java_org_lwjgl_opengl_LinuxEvent_nGetButtonYRoot(lib, buffer) {
    var bufferAddr = Number(await buffer.address());
    var v = lib.getJNIDataView();
    return v.getInt32(8, true);
}

async function Java_org_lwjgl_opengl_LinuxEvent_nGetButtonX(lib, buffer) {
    var bufferAddr = Number(await buffer.address());
    var v = lib.getJNIDataView();
    return v.getInt32(4, true);
}

async function Java_org_lwjgl_opengl_LinuxEvent_nGetButtonY(lib, buffer) {
    var bufferAddr = Number(await buffer.address());
    var v = lib.getJNIDataView();
    return v.getInt32(8, true);
}

function Java_org_lwjgl_opengl_LinuxEvent_nGetFocusDetail() {
}

async function Java_org_lwjgl_opengl_LinuxEvent_nGetButtonType(lib, buffer) {
    // Same as type, apparently
    var bufferAddr = Number(await buffer.address());
    var v = lib.getJNIDataView();
    return v.getInt32(0, true);
}

async function Java_org_lwjgl_opengl_LinuxEvent_nGetButtonButton(lib, buffer) {
    const v = lib.getJNIDataView();
    return v.getInt32(12, true);
}

function Java_org_lwjgl_opengl_LinuxDisplay_nGrabPointer() {
    glCanvas.requestPointerLock();
    lockedMousePos = { x: 0, y: 0 };
}

function Java_org_lwjgl_opengl_LinuxDisplay_nUngrabPointer() {
    document.exitPointerLock();
    lockedMousePos = null;
}

function Java_org_lwjgl_opengl_LinuxDisplay_nDefineCursor() {
}

function Java_org_lwjgl_opengl_LinuxDisplay_getRootWindow() {
}

function Java_org_lwjgl_opengl_LinuxDisplay_nSetWindowIcon() {
}

function Java_org_lwjgl_opengl_LinuxMouse_nGetWindowWidth() {
    return 1000;
}

function Java_org_lwjgl_opengl_LinuxMouse_nSendWarpEvent() {
}

function Java_org_lwjgl_opengl_LinuxMouse_nWarpCursor() {
}

function Java_org_lwjgl_opengl_LinuxEvent_nSetWindow() {
}

function Java_org_lwjgl_opengl_LinuxEvent_nSendEvent() {
}

async function Java_org_lwjgl_opengl_LinuxEvent_nGetKeyAddress(lib, buffer) {
    // Should probably be a pointer, cheat and use directly the value
    var bufferAddr = Number(await buffer.address());
    var v = lib.getJNIDataView();
    return v.getInt32(4, true);
}

function Java_org_lwjgl_opengl_LinuxEvent_nGetKeyTime() {
    // TODO: Event timestamps
}

async function Java_org_lwjgl_opengl_LinuxEvent_nGetKeyType(lib, buffer) {
    // Same as type, apparently
    var bufferAddr = Number(await buffer.address());
    var v = lib.getJNIDataView();
    return v.getInt32(0, true);
}

async function Java_org_lwjgl_opengl_LinuxEvent_nGetKeyKeyCode(lib, buffer) {
    var bufferAddr = Number(await buffer.address());
    var v = lib.getJNIDataView();
    return v.getInt32(4, true);
}

function Java_org_lwjgl_opengl_LinuxEvent_nGetKeyState() {
}

function Java_org_lwjgl_opengl_LinuxKeyboard_lookupKeysym(lib, eventPtr, index) {
    return Number(eventPtr);
}

async function Java_org_lwjgl_opengl_LinuxKeyboard_lookupString(lib, eventPtr, buffer) {
    // Only support single chars
    var bufferAddr = Number(await buffer.address());
    var v = lib.getJNIDataView();
    v.setInt8(bufferAddr, Number(eventPtr));
    return 1;
}

async function Java_org_lwjgl_opengl_Display_getAvailableDisplayModes(lib) {
    var DisplayMode = await lib.org.lwjgl.opengl.DisplayMode;
    var d = await new DisplayMode(1000, 500);
    return [d];
}

function Java_org_lwjgl_Sys_alert(lib, title, message) {
    if (title && title.toString) title = title.toString();
    if (message && message.toString) message = message.toString();
    console.warn("[LWJGL SYS ALERT] " + title + ": " + message);
    // if (typeof window !== 'undefined' && window.alert) window.alert(title + "\n" + message);
}
