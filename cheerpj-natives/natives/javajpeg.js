console.log("CheerpJ: Loaded dummy javajpeg.js");

if (typeof window !== 'undefined') {
    window.CheerpJ_LWJGL_Natives = window.CheerpJ_LWJGL_Natives || {};

    window.CheerpJ_LWJGL_Natives.Java_com_sun_imageio_plugins_jpeg_JPEGImageReader_initReaderIDs = function (lib, iisClass, qTableClass, huffClass) {
        console.log("[STUB] JPEGImageReader.initReaderIDs");
    };

    window.CheerpJ_LWJGL_Natives.Java_com_sun_imageio_plugins_jpeg_JPEGImageReader_initJPEGImageReader = function (lib, self) {
        console.log("[STUB] JPEGImageReader.initJPEGImageReader - Returning 1 (Success)");
        return 1;
    };

    window.CheerpJ_LWJGL_Natives.Java_com_sun_imageio_plugins_jpeg_JPEGImageReader_disposeReader = function (lib, self, structPointer) {
        console.log("[STUB] JPEGImageReader.disposeReader - No-op");
    };

    window.CheerpJ_LWJGL_Natives.Java_com_sun_imageio_plugins_jpeg_JPEGImageReader_resetReader = function (lib, self, structPointer) {
        console.log("[STUB] JPEGImageReader.resetReader - No-op");
    };

    window.CheerpJ_LWJGL_Natives.Java_com_sun_imageio_plugins_jpeg_JPEGImageReader_abortReader = function (lib, self, structPointer) {
        console.log("[STUB] JPEGImageReader.abortReader - No-op");
    };

    window.CheerpJ_LWJGL_Natives.Java_com_sun_imageio_plugins_jpeg_JPEGImageReader_readImage = function (lib, self, structPointer, buffer, numBands, raster, data, stepX, stepY, bounds) {
        console.log("[STUB] JPEGImageReader.readImage - Returning 1 (Success)");
        return 1;
    };

    window.CheerpJ_LWJGL_Natives.Java_com_sun_imageio_plugins_jpeg_JPEGImageReader_checkJPEGHeader = function (lib, self, structPointer, haveMetadata) {
        console.log("[STUB] JPEGImageReader.checkJPEGHeader - Returning 0 (Not a JPEG)");
        return 0;
    };
}
