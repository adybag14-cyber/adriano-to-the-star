var r = await fetch('/lwjgl-browsercraft/libraries/liblwjgl.so');
var buf = await r.arrayBuffer();
export default {
	wasmModule: buf
};
