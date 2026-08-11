(function (global) {
    if (!global || (typeof global !== 'object' && typeof global !== 'function')) return;

    if (typeof global.cheerpjInit !== 'function') {
        global.cheerpjInit = async function () {
            return { stub: true };
        };
    }

    if (typeof global.cheerpjCreateDisplay !== 'function') {
        global.cheerpjCreateDisplay = function () {
            return { stub: true };
        };
    }

    if (typeof global.cheerpjRunMain !== 'function') {
        global.cheerpjRunMain = async function () {
            return 0;
        };
    }

    if (typeof global.cheerpDef !== 'function') {
        global.cheerpDef = null;
    }
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));
