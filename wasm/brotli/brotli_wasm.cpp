#include <brotli/decode.h>
#include <brotli/encode.h>
#include <emscripten/emscripten.h>

#include <cstddef>
#include <cstdint>
#include <cstdlib>
#include <cstring>
#include <vector>

namespace {
constexpr size_t kChunkSize = 16384;
}

extern "C" {

EMSCRIPTEN_KEEPALIVE
uint8_t* brotli_compress(const uint8_t* input,
                         size_t input_size,
                         size_t* output_size,
                         int quality,
                         int lgwin) {
    if (!output_size) {
        return nullptr;
    }

    BrotliEncoderState* state = BrotliEncoderCreateInstance(nullptr, nullptr, nullptr);
    if (!state) {
        return nullptr;
    }

    const int final_quality = quality > 0 ? quality : BROTLI_DEFAULT_QUALITY;
    BrotliEncoderSetParameter(state, BROTLI_PARAM_QUALITY, final_quality);

    if (lgwin > 0) {
        BrotliEncoderSetParameter(state, BROTLI_PARAM_LGWIN, lgwin);
    }

    std::vector<uint8_t> output;
    output.reserve(input_size / 2 + 32);

    size_t available_in = input_size;
    const uint8_t* next_in = input;

    uint8_t buffer[kChunkSize];

    while (true) {
        size_t available_out = sizeof(buffer);
        uint8_t* next_out = buffer;

        const BROTLI_BOOL ok = BrotliEncoderCompressStream(
            state,
            BROTLI_OPERATION_FINISH,
            &available_in,
            &next_in,
            &available_out,
            &next_out,
            nullptr);

        if (!ok) {
            BrotliEncoderDestroyInstance(state);
            return nullptr;
        }

        const size_t produced = sizeof(buffer) - available_out;
        if (produced > 0) {
            output.insert(output.end(), buffer, buffer + produced);
        }

        if (BrotliEncoderIsFinished(state)) {
            break;
        }
    }

    BrotliEncoderDestroyInstance(state);

    *output_size = output.size();
    if (output.empty()) {
        return static_cast<uint8_t*>(malloc(1));
    }

    uint8_t* result = static_cast<uint8_t*>(malloc(output.size()));
    if (!result) {
        return nullptr;
    }

    std::memcpy(result, output.data(), output.size());
    return result;
}

EMSCRIPTEN_KEEPALIVE
uint8_t* brotli_decompress(const uint8_t* input,
                           size_t input_size,
                           size_t* output_size) {
    if (!output_size) {
        return nullptr;
    }

    BrotliDecoderState* state = BrotliDecoderCreateInstance(nullptr, nullptr, nullptr);
    if (!state) {
        return nullptr;
    }

    std::vector<uint8_t> output;

    size_t available_in = input_size;
    const uint8_t* next_in = input;

    uint8_t buffer[kChunkSize];

    while (true) {
        size_t available_out = sizeof(buffer);
        uint8_t* next_out = buffer;

        BrotliDecoderResult result = BrotliDecoderDecompressStream(
            state,
            &available_in,
            &next_in,
            &available_out,
            &next_out,
            nullptr);

        const size_t produced = sizeof(buffer) - available_out;
        if (produced > 0) {
            output.insert(output.end(), buffer, buffer + produced);
        }

        if (result == BROTLI_DECODER_RESULT_SUCCESS) {
            break;
        }

        if (result == BROTLI_DECODER_RESULT_ERROR) {
            BrotliDecoderDestroyInstance(state);
            return nullptr;
        }

        if (result == BROTLI_DECODER_RESULT_NEEDS_MORE_INPUT && available_in == 0) {
            BrotliDecoderDestroyInstance(state);
            return nullptr;
        }
    }

    BrotliDecoderDestroyInstance(state);

    *output_size = output.size();
    if (output.empty()) {
        return static_cast<uint8_t*>(malloc(1));
    }

    uint8_t* result = static_cast<uint8_t*>(malloc(output.size()));
    if (!result) {
        return nullptr;
    }

    std::memcpy(result, output.data(), output.size());
    return result;
}

EMSCRIPTEN_KEEPALIVE
void brotli_free(uint8_t* ptr) {
    free(ptr);
}

}

int main() {
    return 0;
}
