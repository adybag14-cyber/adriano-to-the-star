// Load the glMatrix library
// await import("https://cdnjs.cloudflare.com/ajax/libs/gl-matrix/3.4.2/gl-matrix-min.js");
console.log("LWJGL Native JS Module Loading... VERIFIED RELOAD " + Date.now());

// Mock glMatrix for startup
const glMatrix = {
	mat4: {
		create: () => {
			const out = new Float32Array(16);
			out[0] = 1;
			out[5] = 1;
			out[10] = 1;
			out[15] = 1;
			return out;
		},
		identity: (out) => {
			out[0] = 1;
			out[1] = 0;
			out[2] = 0;
			out[3] = 0;
			out[4] = 0;
			out[5] = 1;
			out[6] = 0;
			out[7] = 0;
			out[8] = 0;
			out[9] = 0;
			out[10] = 1;
			out[11] = 0;
			out[12] = 0;
			out[13] = 0;
			out[14] = 0;
			out[15] = 1;
			return out;
		},
		clone: (a) => {
			const out = new Float32Array(16);
			out.set(a);
			return out;
		},
		multiply: (out, a, b) => {
			const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
			const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
			const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
			const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

			const b00 = b[0], b01 = b[1], b02 = b[2], b03 = b[3];
			const b10 = b[4], b11 = b[5], b12 = b[6], b13 = b[7];
			const b20 = b[8], b21 = b[9], b22 = b[10], b23 = b[11];
			const b30 = b[12], b31 = b[13], b32 = b[14], b33 = b[15];

			out[0] = a00 * b00 + a10 * b01 + a20 * b02 + a30 * b03;
			out[1] = a01 * b00 + a11 * b01 + a21 * b02 + a31 * b03;
			out[2] = a02 * b00 + a12 * b01 + a22 * b02 + a32 * b03;
			out[3] = a03 * b00 + a13 * b01 + a23 * b02 + a33 * b03;
			out[4] = a00 * b10 + a10 * b11 + a20 * b12 + a30 * b13;
			out[5] = a01 * b10 + a11 * b11 + a21 * b12 + a31 * b13;
			out[6] = a02 * b10 + a12 * b11 + a22 * b12 + a32 * b13;
			out[7] = a03 * b10 + a13 * b11 + a23 * b12 + a33 * b13;
			out[8] = a00 * b20 + a10 * b21 + a20 * b22 + a30 * b23;
			out[9] = a01 * b20 + a11 * b21 + a21 * b22 + a31 * b23;
			out[10] = a02 * b20 + a12 * b21 + a22 * b22 + a32 * b23;
			out[11] = a03 * b20 + a13 * b21 + a23 * b22 + a33 * b23;
			out[12] = a00 * b30 + a10 * b31 + a20 * b32 + a30 * b33;
			out[13] = a01 * b30 + a11 * b31 + a21 * b32 + a31 * b33;
			out[14] = a02 * b30 + a12 * b31 + a22 * b32 + a32 * b33;
			out[15] = a03 * b30 + a13 * b31 + a23 * b32 + a33 * b33;
			return out;
		},
		translate: (out, a, v) => {
			const x = v[0], y = v[1], z = v[2];
			if (a !== out) {
				out[0] = a[0];
				out[1] = a[1];
				out[2] = a[2];
				out[3] = a[3];
				out[4] = a[4];
				out[5] = a[5];
				out[6] = a[6];
				out[7] = a[7];
				out[8] = a[8];
				out[9] = a[9];
				out[10] = a[10];
				out[11] = a[11];
			}
			out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
			out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
			out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
			out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
			return out;
		},
		rotate: (out, a, rad, axis) => {
			let x = axis[0], y = axis[1], z = axis[2];
			let len = Math.hypot(x, y, z);
			if (len < 0.000001) return out;
			len = 1 / len;
			x *= len;
			y *= len;
			z *= len;

			const s = Math.sin(rad);
			const c = Math.cos(rad);
			const t = 1 - c;

			const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
			const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
			const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];

			const b00 = x * x * t + c;
			const b01 = y * x * t + z * s;
			const b02 = z * x * t - y * s;
			const b10 = x * y * t - z * s;
			const b11 = y * y * t + c;
			const b12 = z * y * t + x * s;
			const b20 = x * z * t + y * s;
			const b21 = y * z * t - x * s;
			const b22 = z * z * t + c;

			out[0] = a00 * b00 + a10 * b01 + a20 * b02;
			out[1] = a01 * b00 + a11 * b01 + a21 * b02;
			out[2] = a02 * b00 + a12 * b01 + a22 * b02;
			out[3] = a03 * b00 + a13 * b01 + a23 * b02;
			out[4] = a00 * b10 + a10 * b11 + a20 * b12;
			out[5] = a01 * b10 + a11 * b11 + a21 * b12;
			out[6] = a02 * b10 + a12 * b11 + a22 * b12;
			out[7] = a03 * b10 + a13 * b11 + a23 * b12;
			out[8] = a00 * b20 + a10 * b21 + a20 * b22;
			out[9] = a01 * b20 + a11 * b21 + a21 * b22;
			out[10] = a02 * b20 + a12 * b21 + a22 * b22;
			out[11] = a03 * b20 + a13 * b21 + a23 * b22;
			out[12] = a[12];
			out[13] = a[13];
			out[14] = a[14];
			out[15] = a[15];
			return out;
		},
		scale: (out, a, v) => {
			const x = v[0], y = v[1], z = v[2];
			out[0] = a[0] * x;
			out[1] = a[1] * x;
			out[2] = a[2] * x;
			out[3] = a[3] * x;
			out[4] = a[4] * y;
			out[5] = a[5] * y;
			out[6] = a[6] * y;
			out[7] = a[7] * y;
			out[8] = a[8] * z;
			out[9] = a[9] * z;
			out[10] = a[10] * z;
			out[11] = a[11] * z;
			out[12] = a[12];
			out[13] = a[13];
			out[14] = a[14];
			out[15] = a[15];
			return out;
		},
		ortho: (out, left, right, bottom, top, near, far) => {
			const lr = 1 / (left - right);
			const bt = 1 / (bottom - top);
			const nf = 1 / (near - far);
			out[0] = -2 * lr;
			out[1] = 0;
			out[2] = 0;
			out[3] = 0;
			out[4] = 0;
			out[5] = -2 * bt;
			out[6] = 0;
			out[7] = 0;
			out[8] = 0;
			out[9] = 0;
			out[10] = 2 * nf;
			out[11] = 0;
			out[12] = (left + right) * lr;
			out[13] = (top + bottom) * bt;
			out[14] = (far + near) * nf;
			out[15] = 1;
			return out;
		}
	},
	vec3: {
		fromValues: (x, y, z) => {
			const out = new Float32Array(3);
			out[0] = x;
			out[1] = y;
			out[2] = z;
			return out;
		}
	}
};



var _glCanvas = null;
var _glCtx = null;

Object.defineProperty(window, 'glCanvas', {
	get: function () {
		if (!_glCanvas) {
			_glCanvas = window.lwjglCanvasElement || document.getElementsByTagName('canvas')[0] || document.getElementById('lwjglCanvas');
			if (!_glCanvas) {
				console.warn("LWJGL: No canvas found yet. Waiting for creation...");
				return null; // Don't throw yet, maybe caller handles null?
			}
		}
		return _glCanvas;
	}
});

Object.defineProperty(window, 'glCtx', {
	get: function () {
		if (!_glCtx) {
			var c = window.glCanvas;
			if (!c) return null;
			_glCtx = c.getContext("webgl2", { antialias: false, alpha: false });
			if (!_glCtx) console.error("LWJGL: Failed to create WebGL2 context");
			initGLShaders();
		}
		return _glCtx;
	}
});


var vertexShaderSrc = `
	attribute vec4 aVertexPosition;
	attribute vec4 aColor;
	attribute vec2 aTexCoord;
	uniform mat4 modelView;
	uniform mat4 projection;
	varying vec2 vTexCoord;
	varying vec4 vColor;
	void main() {
		gl_Position = projection * modelView * aVertexPosition;
		vTexCoord = aTexCoord;
		vColor = aColor;
	}
`;
// NOTE: Only the default GL_MODULATE texEnv is supported here
var fragmentShaderSrc = `
	precision mediump float;
	uniform float uTextureMask;
	uniform sampler2D uSampler;
	varying vec2 vTexCoord;
	varying vec4 vColor;
	void main() {
		vec4 texSample = texture2D(uSampler, vTexCoord);
		gl_FragColor = mix(vColor, texSample * vColor, uTextureMask);
	}
`;
var vertexShader = null;
var fragmentShader = null;
var program = null;
var vertexBuffer = null;
var colorBuffer = null;
var texCoordBuffer = null;
var vertexPosition = null;
var colorLocation = null;
var texCoord = null;
var mvLocation = null;
var projLocation = null;
var samplerLocation = null;
var samplerLocation2 = null;
var texMaskLocation = null;
var fbWidth = 1000;
var fbHeight = 500;

function initGLShaders() {
	if (program) return; // Already initialized
	if (!glCtx) return; // Still no context, can't init

	console.log("LWJGL: Initializing GL Shaders...");
	vertexShader = glCtx.createShader(glCtx.VERTEX_SHADER);
	glCtx.shaderSource(vertexShader, vertexShaderSrc);
	glCtx.compileShader(vertexShader);

	fragmentShader = glCtx.createShader(glCtx.FRAGMENT_SHADER);
	glCtx.shaderSource(fragmentShader, fragmentShaderSrc);
	glCtx.compileShader(fragmentShader);

	program = glCtx.createProgram();
	glCtx.attachShader(program, vertexShader);
	glCtx.attachShader(program, fragmentShader);
	glCtx.linkProgram(program);
	glCtx.useProgram(program);

	vertexBuffer = glCtx.createBuffer();
	colorBuffer = glCtx.createBuffer();
	texCoordBuffer = glCtx.createBuffer();

	vertexPosition = glCtx.getAttribLocation(program, "aVertexPosition");
	colorLocation = glCtx.getAttribLocation(program, "aColor");
	texCoord = glCtx.getAttribLocation(program, "aTexCoord");

	mvLocation = glCtx.getUniformLocation(program, "modelView");
	projLocation = glCtx.getUniformLocation(program, "projection");
	samplerLocation = glCtx.getUniformLocation(program, "uSampler");
	samplerLocation2 = glCtx.getUniformLocation(program, "uSampler2");
	texMaskLocation = glCtx.getUniformLocation(program, "uTextureMask");
	texMaskLocation = glCtx.getUniformLocation(program, "uTextureMask");

	// --- Deferred WebGL Initialization ---
	// Fix the sampler to texture unit 0
	glCtx.uniform1i(samplerLocation, 0);
	glCtx.uniform1f(texMaskLocation, 0);

	// We need to use an FBO as the main target to support copyTexSubImage2D that seems broken otherwise
	fbWidth = (glCanvas && glCanvas.width) ? (glCanvas.width | 0) : fbWidth;
	fbHeight = (glCanvas && glCanvas.height) ? (glCanvas.height | 0) : fbHeight;
	fbTexture = glCtx.createTexture();
	glCtx.bindTexture(glCtx.TEXTURE_2D, fbTexture);
	glCtx.texImage2D(glCtx.TEXTURE_2D, 0, glCtx.RGBA, fbWidth, fbHeight, 0, glCtx.RGBA, glCtx.UNSIGNED_BYTE, null);
	glCtx.bindTexture(glCtx.TEXTURE_2D, null);

	mainFb = glCtx.createFramebuffer();
	glCtx.bindFramebuffer(glCtx.READ_FRAMEBUFFER, mainFb);
	glCtx.bindFramebuffer(glCtx.DRAW_FRAMEBUFFER, mainFb);
	glCtx.framebufferTexture2D(glCtx.FRAMEBUFFER, glCtx.COLOR_ATTACHMENT0, glCtx.TEXTURE_2D, fbTexture, 0);

	// Add a depth render buffer
	depthRb = glCtx.createRenderbuffer();
	glCtx.bindRenderbuffer(glCtx.RENDERBUFFER, depthRb);
	glCtx.renderbufferStorage(glCtx.RENDERBUFFER, glCtx.DEPTH_COMPONENT16, fbWidth, fbHeight);
	glCtx.framebufferRenderbuffer(glCtx.FRAMEBUFFER, glCtx.DEPTH_ATTACHMENT, glCtx.RENDERBUFFER, depthRb);

	initInputListeners();
}
var vertexData =
{
	enabled: false,
	size: 0,
	type: 0,
	stride: 0,
	pointer: 0,
	buf: null
};
var normalData =
{
	enabled: false,
	size: 0,
	type: 0,
	stride: 0,
	pointer: 0,
	buf: null
};
var colorData =
{
	enabled: false,
	size: 0,
	type: 0,
	stride: 0,
	pointer: 0,
	buf: null
};
var texCoordData =
{
	enabled: false,
	size: 0,
	type: 0,
	stride: 0,
	pointer: 0,
	buf: null
};
// TODO: Make buffers resizeable if needed
var immediateModeData =
{
	mode: 0,
	vertexBuf: new Float32Array(32),
	vertexPos: 0,
	texCoordBuf: new Float32Array(32),
	texCoordPos: 0
};
var verboseLog = true;
var frameCount = 0;
// Set to a non-zero value to stop after a certain number of frames
var frameLimit = 0;
// NOTE: These initializes to identity
var projMatrixStack = [glMatrix.mat4.create()];
var modelViewMatrixStack = [glMatrix.mat4.create()];
var textureMatrixStack = [glMatrix.mat4.create()];
var curMatrixStack = modelViewMatrixStack;
function getCurMatrixTop() {
	return curMatrixStack[curMatrixStack.length - 1];
}
function setCurMatrixTop(m) {
	curMatrixStack[curMatrixStack.length - 1] = m;
}
function uploadDataImpl(buf, buffer, attributeLocation, size, type, stride) {
	initGLShaders();
	if (!glCtx) return;
	if (program) glCtx.useProgram(program);
	glCtx.bindBuffer(glCtx.ARRAY_BUFFER, buffer);
	glCtx.bufferData(glCtx.ARRAY_BUFFER, buf, glCtx.STATIC_DRAW);
	glCtx.vertexAttribPointer(attributeLocation, size, type, type != glCtx.FLOAT, stride, 0);
	glCtx.enableVertexAttribArray(attributeLocation);
}
function uploadData(v, data, buffer, attributeLocation, count) {
	if (data.enabled) {
		assert(data.stride);
		var buf = data.buf;
		if (buf == null) {
			assert(v && data.pointer);
			buf = new Uint8Array(v.buffer, data.pointer, data.stride * count);
		}
		uploadDataImpl(buf, buffer, attributeLocation, data.size, data.type, data.stride);
	}
	else {
		glCtx.disableVertexAttribArray(attributeLocation);
	}
}
function captureData(v, data, count) {
	var ret = { enabled: data.enabled, size: data.size, type: data.type, stride: data.stride, pointer: 0, buf: null };
	if (data.enabled) {
		assert(data.stride);
		var buf = new Uint8Array(v.buffer, data.pointer, data.stride * count);
		// Capture the current data
		ret.buf = new Uint8Array(buf);
	}
	return ret;
}
function checkNoList(list) {
	if (list != null)
		throw new Error("Unsupported command in list");
}
function pushInList(list, args, callee) {
	// Not an elegant solution, but it works
	// It would be nicer to extract the actual implementation from native interfaces
	// to avoid bringing around the library object
	list.push({ f: callee, a: Array.from(args) });
}
function callList(listId) {
	var l = cmdLists[listId];
	for (var i = 0; i < l.length; i++) {
		var c = l[i];
		c.f.apply(null, c.a);
	}
}
function drawArraysImpl(mode, first, count) {
	initGLShaders();
	if (!glCtx) return;
	if (program) glCtx.useProgram(program);
	// TODO: Conditional
	glCtx.uniformMatrix4fv(mvLocation, false, modelViewMatrixStack[modelViewMatrixStack.length - 1]);
	glCtx.uniformMatrix4fv(projLocation, false, projMatrixStack[projMatrixStack.length - 1]);
	assert(first == 0);
	// We can render each quad a separate GL_TRIANGLE_FAN
	if (mode == 7/*QUADS*/ && (count % 4) == 0) {
		for (var i = 0; i < count; i += 4)
			glCtx.drawArrays(glCtx.TRIANGLE_FAN, i, 4);
	}
	else if (mode == glCtx.LINES || mode == glCtx.LINE_STRIP || mode == glCtx.TRIANGLE_STRIP || mode == glCtx.TRIANGLE_FAN) {
		glCtx.drawArrays(mode, first, count);
	}
	else {
		debugger;
	}
}
function pushDrawArraysInList(list, v, mode, first, count) {
	var args = [mode, first, count, captureData(v, vertexData, count), captureData(v, colorData, count), captureData(v, texCoordData, count)];
	list.push({ f: drawArraysInList, a: args });
}
function drawArraysInList(mode, first, count, capturedVertexData, capturedColorData, capturedTexCoordData) {
	// Upload vertex data
	uploadData(null, capturedVertexData, vertexBuffer, vertexPosition, count);
	// Upload color data
	uploadData(null, capturedColorData, colorBuffer, colorLocation, count);
	// Upload tex coord data
	uploadData(null, capturedTexCoordData, texCoordBuffer, texCoord, count);
	drawArraysImpl(mode, first, count);
}
var curList = null;
var cmdLists = [null];
// The first null implicitly solves resetting on 0 id
var textureObjects = [null];
// We need to use an FBO as the main target to support copyTexSubImage2D that seems broken otherwise
var fbTexture = null;
var mainFb = null;
var depthRb = null;
// Synthetize a focus event, it's needed for LWJGL logic
var eventQueue = [{ type: "focus" }];

function convertMousePos(x, y) {
	// We have a framebuffer of 1000x500, but Minecraft renders into the bottom left corner of it.
	const offsetX = 0;
	const offsetY = glCanvas.height - fbHeight;

	const xRatio = glCanvas.width / glCanvas.clientWidth;
	const yRatio = glCanvas.height / glCanvas.clientHeight;

	return [x * xRatio - offsetX, y * yRatio - offsetY];
}

/** Convert from MouseEvent.button to X11 mouse button */
function convertMouseButton(button) {
	return button + 1;
}

/**
 * If null, the game does not want the mouse pointer locked.
 * @type {{ x: number, y: number } | null}
 */
let lockedMousePos = null;

function initInputListeners() {
	glCanvas.addEventListener("mousemove", evt => {
		let [x, y] = convertMousePos(evt.offsetX, evt.offsetY);

		// If the pointer is locked, we can't use offsetX/offsetY
		if (lockedMousePos) {
			x = lockedMousePos.x += evt.movementX;
			y = lockedMousePos.y += evt.movementY;

			if (!document.pointerLockElement) {
				// Game still wants the pointer locked, but it's not
				Java_org_lwjgl_opengl_LinuxDisplay_nGrabPointer();
			}
		}

		if (eventQueue[0]?.type == evt.type) {
			// Update unhandled event
			eventQueue[0].x = x;
			eventQueue[0].y = y;
		} else {
			eventQueue.push({ type: evt.type, x, y });
		}
	});
	function mouseHandler(evt) {
		const [x, y] = convertMousePos(evt.offsetX, evt.offsetY);
		eventQueue.push({ type: evt.type, x, y, button: convertMouseButton(evt.button) });
	}
	glCanvas.addEventListener("mousedown", mouseHandler);
	glCanvas.addEventListener("mouseup", mouseHandler);
	glCanvas.addEventListener("contextmenu", evt => evt.preventDefault());
	glCanvas.addEventListener("keydown", keyHandler);
	glCanvas.addEventListener("keyup", keyHandler);
}

/** @param {KeyboardEvent} e */
function keyHandler(e) {
	// Convert to LinuxKeycodes.java keycodes
	// https://github.com/LWJGL/lwjgl/blob/master/src/java/org/lwjgl/opengl/LinuxKeycodes.java
	let keyCode = e.keyCode || e.key.charCodeAt(0); // most map to ASCII
	switch (e.key) {
		case "Escape": // note will have to press twice if pointer is locked
			keyCode = 0xff1b;
			break;
		case "Shift":
			keyCode = 0xffe1;
			break;
		case "Control":
			keyCode = 0xffe3;
			break;
		case "Meta":
			keyCode = 0xffe7;
			break;
		case "Alt":
			keyCode = 0xffe9;
			break;
	}
	console.log(e.key, keyCode);

	eventQueue.push({ type: e.type, keyCode });
	e.preventDefault();
}

function Java_org_lwjgl_DefaultSysImplementation_getPointerSize() {
	return 4;
}

// Basic input support
async function Java_org_lwjgl_opengl_LinuxEvent_createEventBuffer(lib) {
	// This is intended to represent a X11 event, but we are free to use any layout
	var ByteBuffer = await lib.java.nio.ByteBuffer;
	return await ByteBuffer.allocateDirect(4 * 8);
}

function Java_org_lwjgl_DefaultSysImplementation_getJNIVersion() {
	return 19;
}

function Java_org_lwjgl_DefaultSysImplementation_setDebug() {
}

function Java_org_lwjgl_DefaultSysImplementation_getTimerResolution() {
	console.log("[LWJGL Native] DefaultSys.getTimerResolution: 1000 (Force ms)");
	return 1000;
}

// Correct implementation of time functions with proper package names
var _lwjgl_lastTime = 0n;
function Java_org_lwjgl_DefaultSysImplementation_getTime() {
	// Use MILLISECONDS (no * 1000) to prevent integer division issues
	var now = BigInt(Math.floor(performance.now()));
	if (now <= _lwjgl_lastTime) {
		now = _lwjgl_lastTime + 1n;
	}
	_lwjgl_lastTime = now;
	// console.log("[LWJGL Native] DefaultSys.getTime", now);
	return now;
}

// Likely correct path for LinuxSysImplementation in LWJGL 2
function Java_org_lwjgl_LinuxSysImplementation_nGetTime() {
	// Use MILLISECONDS (no * 1000)
	var now = BigInt(Math.floor(performance.now()));
	if (now <= _lwjgl_lastTime) { // Share the same lastTime
		now = _lwjgl_lastTime + 1n;
	}
	_lwjgl_lastTime = now;
	return now;
}

function Java_org_lwjgl_LinuxSysImplementation_getTimerResolution() {
	console.log("[LWJGL Native] LinuxSys.getTimerResolution: 1000 (Force ms)");
	return 1000;
}

// Keeping the opengl variant just in case, but corrected logic
function Java_org_lwjgl_opengl_LinuxSysImplementation_nGetTime() {
	// FORCE SAFE MONOTONIC MS TIMER HERE TOO
	var now = BigInt(Math.floor(performance.now()));
	if (now <= _lwjgl_lastTime) {
		now = _lwjgl_lastTime + 1n;
	}
	_lwjgl_lastTime = now;
	// console.log("[LWJGL Native] opengl.LinuxSys.nGetTime", now);
	return now;
}

function Java_org_lwjgl_opengl_LinuxSysImplementation_getTimerResolution() {
	console.log("[LWJGL Native] opengl.LinuxSys.getTimerResolution: 1000 (Force ms)");
	return 1000;
}

// Re-introducing System.nanoTime override to catch dt=0 issues at the root
function Java_java_lang_System_nanoTime() {
	console.log("System.nanoTime called");
	return BigInt(Math.floor(performance.now() * 1000000));
}

function Java_org_lwjgl_opengl_LinuxDisplay_nLockAWT() {
	// ...
}

function Java_org_lwjgl_opengl_LinuxDisplay_nUnlockAWT() {
}

function Java_org_lwjgl_opengl_LinuxDisplay_setErrorHandler() {
}

function Java_org_lwjgl_opengl_LinuxDisplay_nSetClassHint() {
}

function Java_org_lwjgl_opengl_LinuxDisplay_openDisplay(lib) {
}

function Java_org_lwjgl_opengl_LinuxDisplay_nInternAtom() {
}

function Java_org_lwjgl_opengl_LinuxDisplay_nIsXrandrSupported() {
	return 0;
}

function Java_org_lwjgl_opengl_LinuxDisplay_nIsXF86VidModeSupported() {
	return 1;
}

function Java_org_lwjgl_opengl_LinuxDisplay_nGetDefaultScreen() {
	return 0;
}

async function Java_org_lwjgl_opengl_LinuxDisplay_nGetAvailableDisplayModes(lib) {
	try {
		var DisplayMode = await lib.org.lwjgl.opengl.DisplayMode;
		var d = await new DisplayMode(1280, 768);

		// Fix 0Hz issue via reflection (fields are private/final)
		var clazz = await d.getClass();
		var fieldFreq = await clazz.getDeclaredField("freq");
		await fieldFreq.setAccessible(true);
		await fieldFreq.setInt(d, 60);

		var fieldBpp = await clazz.getDeclaredField("bpp");
		await fieldBpp.setAccessible(true);
		await fieldBpp.setInt(d, 32);

		return [d];
	} catch (e) {
		console.error("DisplayMode fix failed: " + e);
		// Fallback to basic (might crash game later but lets it start)
		var DisplayMode = await lib.org.lwjgl.opengl.DisplayMode;
		var d = await new DisplayMode(1280, 768);
		return [d];
	}
}

async function Java_org_lwjgl_opengl_Display_getAvailableDisplayModes(lib) {
	return Java_org_lwjgl_opengl_LinuxDisplay_nGetAvailableDisplayModes(lib);
}

function Java_org_lwjgl_opengl_Display_getWidth() {
	var c = window.lwjglCanvasElement || document.getElementsByTagName('canvas')[0] || document.getElementById('lwjglCanvas');
	return c ? (c.width | 0) : 1280;
}

function Java_org_lwjgl_opengl_Display_getHeight() {
	var c = window.lwjglCanvasElement || document.getElementsByTagName('canvas')[0] || document.getElementById('lwjglCanvas');
	return c ? (c.height | 0) : 768;
}

function Java_org_lwjgl_opengl_LinuxDisplay_nGetCurrentGammaRamp() {
}

function Java_org_lwjgl_opengl_LinuxPeerInfo_createHandle() {
}

function Java_org_lwjgl_opengl_GLContext_nLoadOpenGLLibrary() {
}

function Java_org_lwjgl_opengl_LinuxDisplayPeerInfo_initDefaultPeerInfo() {
}

function Java_org_lwjgl_opengl_LinuxDisplayPeerInfo_initDrawable() {
}

function Java_org_lwjgl_opengl_AWTSurfaceLock_createHandle() {
}

function Java_org_lwjgl_opengl_AWTSurfaceLock_lockAndInitHandle() {
	return 1;
}

function Java_org_lwjgl_opengl_LinuxAWTGLCanvasPeerInfo_getScreenFromSurfaceInfo() {
}

function Java_org_lwjgl_opengl_LinuxAWTGLCanvasPeerInfo_nInitHandle() {
}

function Java_org_lwjgl_opengl_AWTSurfaceLock_nUnlock() {
}

function Java_org_lwjgl_opengl_LinuxPeerInfo_nGetDrawable() {
}

function Java_org_lwjgl_opengl_LinuxDisplay_nCreateWindow() {
}

function Java_org_lwjgl_opengl_LinuxDisplay_mapRaised() {
}

function Java_org_lwjgl_opengl_LinuxDisplay_nCreateBlankCursor() {
}

function Java_org_lwjgl_opengl_LinuxDisplay_nSetTitle() {
}

function Java_org_lwjgl_opengl_LinuxMouse_nGetButtonCount() {
	return 3;
}

function Java_org_lwjgl_opengl_LinuxMouse_nQueryPointer() {
}

function Java_org_lwjgl_opengl_LinuxMouse_nGetWindowHeight() {
	return 768;
}

function Java_org_lwjgl_opengl_LinuxKeyboard_getModifierMapping() {
}

function Java_org_lwjgl_opengl_LinuxKeyboard_nSetDetectableKeyRepeat() {
}

function Java_org_lwjgl_opengl_LinuxKeyboard_openIM() {
}

function Java_org_lwjgl_opengl_LinuxKeyboard_allocateComposeStatus() {
}

function Java_org_lwjgl_opengl_LinuxContextImplementation_nCreate() {
}

function Java_org_lwjgl_opengl_LinuxContextImplementation_nMakeCurrent() {
}

function Java_org_lwjgl_opengl_LinuxContextImplementation_nIsCurrent() {
	return true;
}

function Java_org_lwjgl_opengl_GLContext_ngetFunctionAddress(lib, stringPtr) {
	// Return any non-zero address, methods are called by name anyway
	return 1;
}

function Java_org_lwjgl_opengl_GL11_nglGetString(lib, id, funcPtr) {
	checkNoList(curList);
	// Special case GL_EXTENSION for now
	if (id == 0x1F03) {
		// TODO: Do we need any?
		return "";
	}
	else {
		return glCtx.getParameter(id);
	}
}

function Java_org_lwjgl_opengl_GL11_nglGetIntegerv(lib, id, memPtr, funcPtr) {
	checkNoList(curList);
	var v = lib.getJNIDataView();
	var buf = new Int32Array(v.buffer, Number(memPtr), 4);
	if (id == /*GL_VIEWPORT*/0xba2) {
		buf[0] = 0;
		buf[1] = 0;
		buf[2] = fbWidth;
		buf[3] = fbHeight;
	}
	else if (verboseLog) {
		console.log("glGetInteger", id);
	}
}

function Java_org_lwjgl_opengl_GL11_nglGetError() {
	checkNoList(curList);
	// We like living dangerously
	return 0;
}

function Java_org_lwjgl_opengl_LinuxContextImplementation_nSetSwapInterval() {
}

function Java_org_lwjgl_opengl_GL11_nglClearColor(lib, r, g, b, a, funcPtr) {
	checkNoList(curList);
	return glCtx.clearColor(r, g, b, a);
}

function Java_org_lwjgl_opengl_GL11_nglClear(lib, a, funcPtr) {
	checkNoList(curList);
	glCtx.clear(a);
}

function Java_org_lwjgl_opengl_LinuxContextImplementation_nSwapBuffers() {
	// Force time glitch fix: Busy wait to ensure System.nanoTime actually moves
	// This prevents dt=0 crashes (ArithmeticException)
	var start = performance.now();
	while (performance.now() - start < 4.0) {
		// burn cpu
	}

	if (!Java_org_lwjgl_opengl_LinuxContextImplementation_nSwapBuffers._logged) {
		Java_org_lwjgl_opengl_LinuxContextImplementation_nSwapBuffers._logged = true;
		console.log(`[LWJGL] SwapBuffers first call fb = ${fbWidth}x${fbHeight} `);
	}
	glCtx.bindFramebuffer(glCtx.DRAW_FRAMEBUFFER, null);
	glCtx.blitFramebuffer(0, 0, fbWidth, fbHeight, 0, 0, fbWidth, fbHeight, glCtx.COLOR_BUFFER_BIT, glCtx.NEAREST);
	glCtx.bindFramebuffer(glCtx.DRAW_FRAMEBUFFER, mainFb);
	frameCount++;
	const frameId = frameCount;
	if (frameCount == frameLimit) {
		console.warn("Stopping");
		return new Promise(function () { });
	}
	if (frameId <= 5) {
		console.log(`[LWJGL] SwapBuffers schedule frame = ${frameId} `);
	}
	return new Promise(function (resolve, reject) {
		let done = false;
		function resume(source) {
			if (done) return;
			done = true;
			if (frameId <= 5) {
				console.log(`[LWJGL] SwapBuffers resume frame = ${frameId} via = ${source} `);
			}
			resolve();
		}

		try {
			requestAnimationFrame(function () { resume('raf'); });
		} catch (e) {
			console.warn(`[LWJGL] SwapBuffers rAF failed frame = ${frameId}: ${String(e)} `);
			resume('raf-error');
			return;
		}

		if (frameId <= 5) {
			setTimeout(function () {
				if (!done) console.warn(`[LWJGL] SwapBuffers still waiting frame = ${frameId} after 1000ms`);
			}, 1000);
		}
	});
}

function Java_org_lwjgl_opengl_LinuxEvent_getPending() {
	return eventQueue.length;
}

function Java_org_lwjgl_opengl_GL11_nglMatrixMode(lib, matrixMode, funcPtr) {
	if (curList)
		return pushInList(curList, arguments, Java_org_lwjgl_opengl_GL11_nglMatrixMode);
	if (matrixMode == 0x1700/*GL_MODELVIEW*/)
		curMatrixStack = modelViewMatrixStack;
	else if (matrixMode == 0x1701/*GL_PROJECTION*/)
		curMatrixStack = projMatrixStack;
	else if (matrixMode == 0x1702/*GL_TEXTURE*/)
		curMatrixStack = textureMatrixStack;
	else
		debugger;
}

function Java_org_lwjgl_opengl_GL11_nglLoadIdentity(lib, funcPtr) {
	checkNoList(curList);
	glMatrix.mat4.identity(getCurMatrixTop());
}

function Java_org_lwjgl_opengl_GL11_nglOrtho(lib, left, right, bottom, top, nearVal, farVal, funcPtr) {
	checkNoList(curList);
	var m = getCurMatrixTop();
	var o = glMatrix.mat4.create();
	glMatrix.mat4.ortho(o, left, right, bottom, top, nearVal, farVal);
	var out = glMatrix.mat4.create();
	setCurMatrixTop(glMatrix.mat4.multiply(out, m, o));
}

function Java_org_lwjgl_opengl_GL11_nglTranslatef(lib, x, y, z, funcPtr) {
	if (curList)
		return pushInList(curList, arguments, Java_org_lwjgl_opengl_GL11_nglTranslatef);
	var m = getCurMatrixTop();
	var out = glMatrix.mat4.create();
	setCurMatrixTop(glMatrix.mat4.translate(out, m, glMatrix.vec3.fromValues(x, y, z)));
}

function Java_org_lwjgl_opengl_GL11_nglViewport(lib, x, y, width, height, funcPtr) {
	checkNoList(curList);
	glCtx.viewport(x, y, width, height);
}

function Java_org_lwjgl_opengl_GL11_nglDisable(lib, a, funcPtr) {
	checkNoList(curList);
	if (a == glCtx.BLEND || a == glCtx.CULL_FACE || a == glCtx.DEPTH_TEST || a == glCtx.SCISSOR_TEST || a == glCtx.STENCIL_TEST)
		glCtx.disable(a);
	else if (a == glCtx.TEXTURE_2D || a == 0x0DE1/*GL_TEXTURE_2D*/ || a == 0x806F/*GL_TEXTURE_3D*/) {
		glCtx.uniform1f(texMaskLocation, 0);
	}
	else if (verboseLog)
		console.log("glDisable " + a.toString(16));
}

function Java_org_lwjgl_opengl_GL11_nglEnable(lib, a, funcPtr) {
	checkNoList(curList);
	if (a == glCtx.BLEND || a == glCtx.CULL_FACE || a == glCtx.DEPTH_TEST || a == glCtx.SCISSOR_TEST || a == glCtx.STENCIL_TEST)
		glCtx.enable(a);
	else if (a == glCtx.TEXTURE_2D || a == 0x0DE1/*GL_TEXTURE_2D*/ || a == 0x806F/*GL_TEXTURE_3D*/) {
		glCtx.uniform1f(texMaskLocation, 1);
	}
	else if (verboseLog)
		console.log("glEnable " + a.toString(16));
}

function Java_org_lwjgl_opengl_GL11_nglGenTextures(lib, n, memPtr, funcPtr) {
	checkNoList(curList);
	var v = lib.getJNIDataView();
	var buf = new Int32Array(v.buffer, Number(memPtr), n);
	for (var i = 0; i < n; i++) {
		var id = textureObjects.length;
		buf[i] = id;
		textureObjects[id] = glCtx.createTexture();
	}
}

function Java_org_lwjgl_opengl_GL11_nglBindTexture(lib, target, id, funcPtr) {
	checkNoList(curList);
	assert(target == glCtx.TEXTURE_2D);
	glCtx.bindTexture(target, textureObjects[id]);
}

function Java_org_lwjgl_opengl_GL11_nglTexParameteri(lib, target, pname, param, funcPtr) {
	checkNoList(curList);
	// WebGL 2 doesn't support GL_GENERATE_MIPMAP (0x8191) via texParam
	if (pname == 0x8191) return;
	// Ignore GL_TEXTURE_PRIORITY (0x8066)
	if (pname == 0x8066) return;

	// Log potential issues
	if (pname == 0x2900 /*GL_CLAMP*/) {
		console.warn(`WebGL: patching GL_CLAMP to GL_CLAMP_TO_EDGE`);
		param = 0x812F; // GL_CLAMP_TO_EDGE
	}

	// Log everything for now to catch the culprit
	console.log(`texParameteri: target = ${target} pname = ${pname} param = ${param} `);

	try {
		glCtx.texParameteri(target, pname, param);
	} catch (e) {
		console.warn(`WebGL: texParameter failed: pname = ${pname} param = ${param} error = ${e} `);
	}
}

function Java_org_lwjgl_opengl_GL11_nglTexImage2D(lib, target, level, internalFormat, width, height, border, format, type, memPtr, funcPtr) {
	checkNoList(curList);
	// assert(target == glCtx.TEXTURE_2D);

	// Fix internalFormat for WebGL 2 compliance
	// WebGL 2 requires rigid 1:1 mapping between internalFormat, format, and type.
	// We prioritize 'format' (the data we have) to select the correct sized internalFormat.

	var oldIfmt = internalFormat;
	var isGeneric = (internalFormat == 0x1908 /*GL_RGBA*/) || (internalFormat == 4) ||
		(internalFormat == 0x1907 /*GL_RGB*/) || (internalFormat == 3);

	if (isGeneric) {
		if (format == 0x1908 /*GL_RGBA*/) {
			internalFormat = 0x8058; // GL_RGBA8
		} else if (format == 0x1907 /*GL_RGB*/) {
			internalFormat = 0x8051; // GL_RGB8
		} else if (format == 0x1909 /*GL_LUMINANCE*/) {
			internalFormat = 0x8040; // GL_LUMINANCE8 (or GL_R8 depending on implementation, but WebGL1/2 compat varies)
			// WebGL 2 uses GL_RED for R8. GL_LUMINANCE is legacy.
			// If using WebGL 2 context, we might need GL_R8 (0x8229) and format GL_RED (0x1903).
			// But let's stick to RGB/RGBA for now as that's the observed error.
		}
	}

	// Explicit overrides if generic mapping logic missed something
	if (internalFormat == 0x1908 /*GL_RGBA*/) internalFormat = 0x8058 /*GL_RGBA8*/;
	if (internalFormat == 4) internalFormat = 0x8058 /*GL_RGBA8*/;
	// But verify consistency
	if (internalFormat == 0x8058 /*GL_RGBA8*/ && format == 0x1907 /*GL_RGB*/) {
		// Mismatch: Data is RGB, Texture is RGBA. WebGL 2 forbids.
		// Downgrade texture to RGB8.
		console.warn(`WebGL: patching mismatched internalFormat GL_RGBA8 -> GL_RGB8 because data is GL_RGB`);
		internalFormat = 0x8051; // GL_RGB8
	}

	if (internalFormat != oldIfmt) {
		console.log(`Patched internalFormat: ${oldIfmt} -> ${internalFormat} (format = ${format})`);
	}

	// Log unexpected formats
	console.log(`texImage2D: ifmt = ${internalFormat} (${width}x${height}) fmt = ${format} type = ${type} `);

	var v = lib.getJNIDataView();
	// Build an unbound array, WebGL will truncate as needed
	var buf = new Uint8Array(v.buffer, Number(memPtr));

	try {
		glCtx.texImage2D(target, level, internalFormat, width, height, border, format, type, buf);
	} catch (e) {
		console.warn(`texImage2D failed: ifmt = ${internalFormat} width = ${width} height = ${height} format = ${format} type = ${type} error = ${e} `);
	}
}

function Java_org_lwjgl_opengl_GL11_nglTexCoordPointer(lib, size, type, stride, memPtr, funcPtr) {
	texCoordData.size = size;
	texCoordData.type = type;
	texCoordData.stride = stride;
	texCoordData.pointer = Number(memPtr);
}

function Java_org_lwjgl_opengl_GL11_nglEnableClientState(lib, v, funcPtr) {
	if (v == 0x8074/*GL_VERTEX_ARRAY*/) {
		vertexData.enabled = true;
	}
	else if (v == 0x8075/*GL_NORMAL_ARRAY*/) {
		normalData.enabled = true;
	}
	else if (v == 0x8076/*GL_COLOR_ARRAY*/) {
		colorData.enabled = true;
	}
	else if (v == 0x8078/*GL_TEXTURE_COORD_ARRAY*/) {
		texCoordData.enabled = true;
	}
	else if (verboseLog) {
		console.log("glEnableClientState");
	}
}

function Java_org_lwjgl_opengl_GL11_nglColorPointer(lib, size, type, stride, memPtr, funcPtr) {
	colorData.size = size;
	colorData.type = type;
	colorData.stride = stride;
	colorData.pointer = Number(memPtr);
}

function Java_org_lwjgl_opengl_GL11_nglVertexPointer(lib, size, type, stride, memPtr, funcPtr) {
	vertexData.size = size;
	vertexData.type = type;
	vertexData.stride = stride;
	vertexData.pointer = Number(memPtr);
}

function Java_org_lwjgl_opengl_GL11_nglDrawArrays(lib, mode, first, count, funcPtr) {
	var v = lib.getJNIDataView();
	if (curList) {
		// Capture client state at this point in time
		return pushDrawArraysInList(curList, v, mode, first, count);
	}
	// Upload vertex data
	uploadData(v, vertexData, vertexBuffer, vertexPosition, count);
	// Upload color data
	uploadData(v, colorData, colorBuffer, colorLocation, count);
	// Upload tex coord data
	uploadData(v, texCoordData, texCoordBuffer, texCoord, count);
	drawArraysImpl(mode, first, count);
}

function Java_org_lwjgl_opengl_GL11_nglDisableClientState(lib, v, funcPtr) {
	if (v == 0x8074/*GL_VERTEX_ARRAY*/) {
		vertexData.enabled = false;
	}
	else if (v == 0x8075/*GL_NORMAL_ARRAY*/) {
		normalData.enabled = false;
	}
	else if (v == 0x8076/*GL_COLOR_ARRAY*/) {
		colorData.enabled = false;
	}
	else if (v == 0x8078/*GL_TEXTURE_COORD_ARRAY*/) {
		texCoordData.enabled = false;
	}
	else if (verboseLog) {
		console.log("glDisableClientState");
	}
}

function Java_org_lwjgl_opengl_GL11_nglColor4f(lib, r, g, b, a, funcPtr) {
	checkNoList(curList);
	glCtx.vertexAttrib4f(colorLocation, r, g, b, a);
}

function Java_org_lwjgl_opengl_GL11_nglColor4ub(lib, r, g, b, a, funcPtr) {
	checkNoList(curList);
	const rf = (r & 0xff) / 255.0;
	const gf = (g & 0xff) / 255.0;
	const bf = (b & 0xff) / 255.0;
	const af = (a & 0xff) / 255.0;
	glCtx.vertexAttrib4f(colorLocation, rf, gf, bf, af);
}

function Java_org_lwjgl_opengl_GL11_nglAlphaFunc() {
	checkNoList(curList);
	if (verboseLog)
		console.log("glAlphaFunc");
}

function Java_org_lwjgl_opengl_GL11_nglGenLists(lib, range, funcPtr) {
	checkNoList(curList);
	var ret = cmdLists.length;
	for (var i = 0; i < range; i++)
		cmdLists.push([]);
	return ret;
}

function Java_org_lwjgl_opengl_GL11_nglNewList(lib, list, mode, funcPtr) {
	checkNoList(curList);
	assert(mode == 0x1300/*GL_COMPILE*/);
	curList = cmdLists[list];
	// Wipe out the current contents of the list if any
	curList.length = 0;
}

function Java_org_lwjgl_opengl_GL11_nglEndList(lib, funcPtr) {
	curList = null;
}

function Java_org_lwjgl_opengl_GL11_nglColor3f() {
	if (curList)
		return pushInList(curList, arguments, Java_org_lwjgl_opengl_GL11_nglColor3f);
	if (verboseLog)
		console.log("glColor3f");
}

function Java_org_lwjgl_opengl_LinuxDisplay_nGetNativeCursorCapabilities() {
}

function Java_org_lwjgl_opengl_GL11_nglShadeModel() {
	checkNoList(curList);
	if (verboseLog)
		console.log("glShaderModel");
}

function Java_org_lwjgl_opengl_GL11_nglClearDepth(lib, a, funcPtr) {
	checkNoList(curList);
	glCtx.clearDepth(a);
}

function Java_org_lwjgl_opengl_GL11_nglDepthFunc(lib, a, funcPtr) {
	checkNoList(curList);
	glCtx.depthFunc(a);
}

function Java_org_lwjgl_opengl_GL11_nglCullFace(lib, mode, funcPtr) {
	checkNoList(curList);
	glCtx.cullFace(mode);
}

function Java_org_lwjgl_opengl_GL11_nglPushAttrib(lib, mask, funcPtr) {
	checkNoList(curList);
	if (verboseLog)
		console.log("glPushAttrib");
}

function Java_org_lwjgl_opengl_GL11_nglPopAttrib(lib, funcPtr) {
	checkNoList(curList);
	if (verboseLog)
		console.log("glPopAttrib");
}

function Java_org_lwjgl_opengl_GL11_nglPushMatrix(lib, funcPtr) {
	if (curList)
		return pushInList(curList, arguments, Java_org_lwjgl_opengl_GL11_nglPushMatrix);
	curMatrixStack.push(glMatrix.mat4.clone(curMatrixStack[curMatrixStack.length - 1]));
}

function Java_org_lwjgl_opengl_GL11_nglPopMatrix(lib, funcPtr) {
	if (curList)
		return pushInList(curList, arguments, Java_org_lwjgl_opengl_GL11_nglPopMatrix);
	if (curMatrixStack.length > 1) {
		curMatrixStack.pop();
	} else {
		console.error("LWJGL: Stack underflow in glPopMatrix");
	}
}

function Java_org_lwjgl_opengl_GL11_nglMultMatrixf(lib, memPtr, funcPtr) {
	checkNoList(curList);
	var m = getCurMatrixTop();
	var v = lib.getJNIDataView();
	var buf = new Float32Array(v.buffer, Number(memPtr), 16);
	var out = glMatrix.mat4.create();
	setCurMatrixTop(glMatrix.mat4.multiply(out, m, buf));
}

function Java_org_lwjgl_opengl_GL11_nglRotatef(lib, angle, x, y, z, funcPtr) {
	checkNoList(curList);
	var m = getCurMatrixTop();
	var out = glMatrix.mat4.create();
	setCurMatrixTop(glMatrix.mat4.rotate(out, m, angle * Math.PI / 180.0, glMatrix.vec3.fromValues(x, y, z)));
}

function Java_org_lwjgl_opengl_GL11_nglDepthMask(lib, a, funcPtr) {
	checkNoList(curList);
	glCtx.depthMask(a);
}

function Java_org_lwjgl_opengl_GL11_nglBlendFunc(lib, sfactor, dfactor) {
	checkNoList(curList);
	glCtx.blendFunc(sfactor, dfactor);
}

function Java_org_lwjgl_opengl_GL11_nglColorMask(lib, r, g, b, a, funcPtr) {
	checkNoList(curList);
	glCtx.colorMask(r, g, b, a);
}

function Java_org_lwjgl_opengl_GL11_nglCopyTexSubImage2D(lib, target, level, xoffset, yoffset, x, y, width, height, funcPtr) {
	checkNoList(curList);
	glCtx.copyTexSubImage2D(target, level, xoffset, yoffset, x, y, width, height);
}

function Java_org_lwjgl_opengl_GL11_nglScalef(lib, x, y, z, funcPtr) {
	if (curList)
		return pushInList(curList, arguments, Java_org_lwjgl_opengl_GL11_nglScalef);
	var m = getCurMatrixTop();
	var out = glMatrix.mat4.create();
	setCurMatrixTop(glMatrix.mat4.scale(out, m, glMatrix.vec3.fromValues(x, y, z)));
}

function Java_org_lwjgl_opengl_GL11_nglCallLists(lib, n, type, memPtr, funcPtr) {
	checkNoList(curList);
	assert(type == glCtx.UNSIGNED_INT);
	var v = lib.getJNIDataView();
	var buf = new Int32Array(v.buffer, Number(memPtr), n);
	for (var i = 0; i < n; i++)
		callList(buf[i]);
}

function Java_org_lwjgl_opengl_GL11_nglFlush() {
	checkNoList(curList);
	glCtx.flush();
}

function Java_org_lwjgl_opengl_GL11_nglTexSubImage2D(lib, target, level, xoffset, yoffset, width, height, format, type, memPtr, funcPtr) {
	checkNoList(curList);
	assert(target == glCtx.TEXTURE_2D);
	var v = lib.getJNIDataView();
	// Build an unbound array, WebGL will truncate as needed
	var buf = new Uint8Array(v.buffer, Number(memPtr));
	glCtx.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, buf);
}

function Java_org_lwjgl_opengl_GL11_nglGetFloatv(lib, a, memPtr, funcPtr) {
	checkNoList(curList);
	var v = lib.getJNIDataView();
	var buf = new Float32Array(v.buffer, Number(memPtr), 16);
	if (a == /*GL_MODELVIEW_MATRIX*/0xba6) {
		var m = modelViewMatrixStack[modelViewMatrixStack.length - 1];
		for (var i = 0; i < 16; i++)
			buf[i] = m[i];
	}
	else if (a == /*GL_PROJECTION_MATRIX*/0xba7) {
		var m = projMatrixStack[projMatrixStack.length - 1];
		for (var i = 0; i < 16; i++)
			buf[i] = m[i];
	}
	else if (verboseLog) {
		console.log("glGetFloat " + a);
	}
}

function Java_org_lwjgl_opengl_GL11_nglFogfv() {
	checkNoList(curList);
	if (verboseLog)
		console.log("glFog");
}

function Java_org_lwjgl_opengl_GL11_nglNormal3f() {
	checkNoList(curList);
	if (verboseLog)
		console.log("glNormal3f");
}

function Java_org_lwjgl_opengl_GL11_nglFogi() {
	checkNoList(curList);
	if (verboseLog)
		console.log("glFogi");
}

function Java_org_lwjgl_opengl_GL11_nglFogf() {
	checkNoList(curList);
	if (verboseLog)
		console.log("glFogf");
}

function Java_org_lwjgl_opengl_GL11_nglColorMaterial() {
	checkNoList(curList);
	if (verboseLog)
		console.log("glColorMaterial");
}

function Java_org_lwjgl_opengl_GL11_nglCallList(lib, listId, funcPtr) {
	checkNoList(curList);
	callList(listId);
}

function Java_org_lwjgl_opengl_GL13_nglActiveTexture() {
	checkNoList(curList);
	if (verboseLog)
		console.log("glActiveTexture");
}

function Java_org_lwjgl_opengl_GL11_nglLightfv() {
	checkNoList(curList);
	if (verboseLog)
		console.log("glLightfv");
}

function Java_org_lwjgl_opengl_GL11_nglLightModelfv() {
	checkNoList(curList);
	if (verboseLog)
		console.log("glLightModelfv");
}

function Java_org_lwjgl_opengl_GL11_nglNormalPointer(lib, type, stride, memPtr, funcPtr) {
	normalData.size = 3;
	normalData.type = type;
	normalData.stride = stride;
	normalData.pointer = Number(memPtr);
}

function Java_org_lwjgl_opengl_GL13_nglMultiTexCoord2f() {
	checkNoList(curList);
	if (verboseLog)
		console.log("glMultiTexCoord2f");
}

function Java_org_lwjgl_opengl_GL13_nglClientActiveTexture() {
	if (verboseLog)
		console.log("glClientActiveTexture");
}

function Java_org_lwjgl_opengl_GL11_nglLineWidth() {
	checkNoList(curList);
	if (verboseLog)
		console.log("glLineWidth");
}

function Java_org_lwjgl_opengl_GL11_nglPolygonOffset() {
	checkNoList(curList);
	if (verboseLog)
		console.log("glPolygonOffset");
}

function Java_org_lwjgl_opengl_GL11_nglBegin(lib, mode, funcPtr) {
	checkNoList(curList);
	immediateModeData.mode = mode;
	immediateModeData.vertexPos = 0;
	immediateModeData.texCoordPos = 0;
}

function Java_org_lwjgl_opengl_GL11_nglTexCoord2f(lib, x, y, funcPtr) {
	checkNoList(curList);
	var curPos = immediateModeData.texCoordPos;
	if (curPos > immediateModeData.texCoordBuf.length) {
		console.log("glTexCoord2f overflow");
		return;
	}
	immediateModeData.texCoordBuf[curPos] = x;
	immediateModeData.texCoordBuf[curPos + 1] = y;
	immediateModeData.texCoordPos = curPos + 2;
}

function Java_org_lwjgl_opengl_GL11_nglVertex2f(lib, x, y, funcPtr) {
	checkNoList(curList);
	var curPos = immediateModeData.vertexPos;
	if (curPos > immediateModeData.vertexBuf.length) {
		console.log("glVertex2f overflow");
		return;
	}
	immediateModeData.vertexBuf[curPos] = x;
	immediateModeData.vertexBuf[curPos + 1] = y;
	immediateModeData.vertexBuf[curPos + 2] = 0.0;
	immediateModeData.vertexPos = curPos + 3;
}

function Java_org_lwjgl_opengl_GL11_nglVertex3f(lib, x, y, z, funcPtr) {
	checkNoList(curList);
	var curPos = immediateModeData.vertexPos;
	if (curPos > immediateModeData.vertexBuf.length) {
		console.log("glVertex3f overflow");
		return;
	}
	immediateModeData.vertexBuf[curPos] = x;
	immediateModeData.vertexBuf[curPos + 1] = y;
	immediateModeData.vertexBuf[curPos + 2] = z;
	immediateModeData.vertexPos = curPos + 3;
}

function Java_org_lwjgl_opengl_GL11_nglEnd(lib, funcPtr) {
	checkNoList(curList);
	// Upload vertex data
	uploadDataImpl(immediateModeData.vertexBuf.subarray(0, immediateModeData.vertexPos), vertexBuffer, vertexPosition, 3, glCtx.FLOAT, 3 * 4);
	// TODO: Should we do something about color data?
	// Upload tex coord data
	uploadDataImpl(immediateModeData.texCoordBuf.subarray(0, immediateModeData.texCoordPos), texCoordBuffer, texCoord, 2, glCtx.FLOAT, 2 * 4);
	// NOTE: We count vertices
	drawArraysImpl(immediateModeData.mode, 0, immediateModeData.vertexPos / 3);
}

// These stubs make sure audio creation fails sooner rather than later
function Java_org_lwjgl_openal_AL_nCreate() {
}

function Java_org_lwjgl_openal_AL10_initNativeStubs() {
}

function Java_org_lwjgl_openal_ALC10_initNativeStubs() {
}

function Java_org_lwjgl_openal_ALC10_nalcOpenDevice() {
}

function Java_org_lwjgl_openal_AL_resetNativeStubs() {
}

function Java_org_lwjgl_openal_AL_nDestroy() {
}

// Basic input support
async function Java_org_lwjgl_opengl_LinuxEvent_createEventBuffer(lib) {
	// This is intended to represent a X11 event, but we are free to use any layout
	var ByteBuffer = await lib.java.nio.ByteBuffer;
	return await ByteBuffer.allocateDirect(4 * 8);
}

async function Java_org_lwjgl_opengl_LinuxEvent_nNextEvent(lib, windowId, buffer) {
	// Resolve the address and directly access the JNI memory
	var bufferAddr = Number(await buffer.address());
	var v = lib.getJNIDataView();
	var e = eventQueue.shift();
	if (!e) {
		v.setInt32(bufferAddr + 0, 0, true);
		return;
	}
	switch (e.type) {
		case "focus":
			v.setInt32(bufferAddr + 0, /*FocusIn*/9, true);
			break;
		case "mousedown":
			v.setInt32(bufferAddr + 0, /*ButtonPress*/4, true);
			v.setInt32(bufferAddr + 4, e.x, true);
			v.setInt32(bufferAddr + 8, e.y, true);
			v.setInt32(bufferAddr + 12, e.button, true);
			break;
		case "mouseup":
			v.setInt32(bufferAddr + 0, /*ButtonRelease*/5, true);
			v.setInt32(bufferAddr + 4, e.x, true);
			v.setInt32(bufferAddr + 8, e.y, true);
			v.setInt32(bufferAddr + 12, e.button, true);
			break;
		case "mousemove":
			v.setInt32(bufferAddr + 0, /*MotionNotify*/6, true);
			v.setInt32(bufferAddr + 4, e.x, true);
			v.setInt32(bufferAddr + 8, e.y, true);
			break;
		case "keydown":
			v.setInt32(bufferAddr + 0, /*KeyPress*/2, true);
			v.setInt32(bufferAddr + 4, e.keyCode, true);
			break;
		case "keyup":
			v.setInt32(bufferAddr + 0, /*KeyRelease*/3, true);
			v.setInt32(bufferAddr + 4, e.keyCode, true);
			break;
		default:
			debugger;
	}
}

function Java_org_lwjgl_opengl_LinuxEvent_nGetWindow() {
	// Only a single window is emulated
	return 0;
}

async function Java_org_lwjgl_opengl_LinuxEvent_nGetType(lib, buffer) {
	var bufferAddr = Number(await buffer.address());
	var v = lib.getJNIDataView();
	return v.getInt32(bufferAddr + 0, true);
}

async function Java_org_lwjgl_Sys_alert(lib, title, message) {
	if (title && title.toString) title = title.toString();
	if (message && message.toString) message = message.toString();
	console.warn("[LWJGL SYS ALERT] " + title + ": " + message);
	if (typeof window !== 'undefined' && window.alert) window.alert(title + "\n" + message);
}

// Ensure gl/gl2 are available globally or attached to window if needed, but they are declared as var/const usually.
// End of file.

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
	return v.getInt32(bufferAddr + 4, true);
}

async function Java_org_lwjgl_opengl_LinuxEvent_nGetButtonYRoot(lib, buffer) {
	var bufferAddr = Number(await buffer.address());
	var v = lib.getJNIDataView();
	return v.getInt32(bufferAddr + 8, true);
}

async function Java_org_lwjgl_opengl_LinuxEvent_nGetButtonX(lib, buffer) {
	var bufferAddr = Number(await buffer.address());
	var v = lib.getJNIDataView();
	return v.getInt32(bufferAddr + 4, true);
}

async function Java_org_lwjgl_opengl_LinuxEvent_nGetButtonY(lib, buffer) {
	var bufferAddr = Number(await buffer.address());
	var v = lib.getJNIDataView();
	return v.getInt32(bufferAddr + 8, true);
}

function Java_org_lwjgl_opengl_LinuxEvent_nGetFocusDetail() {
}

async function Java_org_lwjgl_opengl_LinuxEvent_nGetButtonType(lib, buffer) {
	// Same as type, apparently
	var bufferAddr = Number(await buffer.address());
	var v = lib.getJNIDataView();
	return v.getInt32(bufferAddr + 0, true);
}

async function Java_org_lwjgl_opengl_LinuxEvent_nGetButtonButton(lib, buffer) {
	var bufferAddr = Number(await buffer.address());
	const v = lib.getJNIDataView();
	return v.getInt32(bufferAddr + 12, true);
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
	return 1280;
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
	return v.getInt32(bufferAddr + 4, true);
}

function Java_org_lwjgl_opengl_LinuxEvent_nGetKeyTime() {
	// TODO: Event timestamps
}

async function Java_org_lwjgl_opengl_LinuxEvent_nGetKeyType(lib, buffer) {
	// Same as type, apparently
	var bufferAddr = Number(await buffer.address());
	var v = lib.getJNIDataView();
	return v.getInt32(bufferAddr + 0, true);
}

async function Java_org_lwjgl_opengl_LinuxEvent_nGetKeyKeyCode(lib, buffer) {
	var bufferAddr = Number(await buffer.address());
	var v = lib.getJNIDataView();
	return v.getInt32(bufferAddr + 4, true);
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

function Java_org_lwjgl_opengl_Display_create(lib, pixelFormat, contextAttribs) {
	console.log("[Mock] Java_org_lwjgl_opengl_Display_create called");
	initGLShaders();
}

if (typeof window !== 'undefined') {
	window.CheerpJ_LWJGL_Natives = window.CheerpJ_LWJGL_Natives || {};

	const __lwjglDebug = window.__lwjglDebug = window.__lwjglDebug || {
		counts: Object.create(null),
		uniqueLogged: 0,
		maxUniqueLogs: 60
	};

	const __lwjglImportant = new Set([
		'Java_org_lwjgl_opengl_Display_create',
		'Java_org_lwjgl_opengl_LinuxDisplay_openDisplay',
		'Java_org_lwjgl_opengl_LinuxContextImplementation_nCreate',
		'Java_org_lwjgl_opengl_LinuxContextImplementation_nMakeCurrent',
		'Java_org_lwjgl_opengl_LinuxContextImplementation_nSwapBuffers',
		'Java_org_lwjgl_opengl_LinuxEvent_getPending',
		'Java_org_lwjgl_opengl_LinuxEvent_nNextEvent'
	]);

	function __lwjglWrap(name, fn) {
		if (fn && fn.__lwjglWrapped) return fn;
		function wrapped() {
			const prev = __lwjglDebug.counts[name] || 0;
			const next = prev + 1;
			__lwjglDebug.counts[name] = next;

			if (next === 1) {
				if (__lwjglImportant.has(name) || __lwjglDebug.uniqueLogged < __lwjglDebug.maxUniqueLogs) {
					if (!__lwjglImportant.has(name)) __lwjglDebug.uniqueLogged += 1;
					console.log(`[LWJGL] native first - call ${name} `);
				}
			} else if (__lwjglImportant.has(name) && (next === 100 || next === 1000)) {
				console.log(`[LWJGL] native call - count ${name}=${next} `);
			}

			return fn.apply(this, arguments);
		}
		wrapped.__lwjglWrapped = true;
		return wrapped;
	}

	let registeredCount = 0;
	for (const key of Object.getOwnPropertyNames(window)) {
		if (
			key.startsWith('Java_org_lwjgl_') ||
			key.startsWith('JNI_OnLoad_') ||
			key.startsWith('JVM_') ||
			key.startsWith('_JVM_')
		) {
			const fn = window[key];
			if (typeof fn === 'function') {
				const wrapped = __lwjglWrap(key, fn);
				window.CheerpJ_LWJGL_Natives[key] = wrapped;
				try { window[key] = wrapped; } catch { }
				registeredCount += 1;
			}
		}
	}
	console.log(`[LWJGL] Registered natives count = ${registeredCount} `);
}
