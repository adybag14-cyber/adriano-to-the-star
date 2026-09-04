"""Validate a ZWS container without modifying it or importing game code."""
import json
import lzma
import struct
import sys

payload = sys.stdin.buffer.read()
try:
    declared = struct.unpack_from('<I', payload, 4)[0]
    properties = payload[12]
    if properties >= 225:
        raise ValueError('Invalid LZMA properties')
    filters = [{
        'id': lzma.FILTER_LZMA1,
        'lc': properties % 9,
        'lp': (properties // 9) % 5,
        'pb': properties // 45,
        'dict_size': struct.unpack_from('<I', payload, 13)[0],
    }]
    if declared > 128 * 1024 * 1024 or filters[0]['dict_size'] > 128 * 1024 * 1024:
        raise ValueError('SWF exceeds validation memory bound')
    decoder = lzma.LZMADecompressor(format=lzma.FORMAT_RAW, filters=filters)
    decoded = decoder.decompress(payload[17:], max_length=128 * 1024 * 1024)
    print(json.dumps({'valid': len(decoded) + 8 == declared, 'decodedBytes': len(decoded) + 8, 'declaredBytes': declared}))
except (ValueError, IndexError, struct.error, lzma.LZMAError) as error:
    print(json.dumps({'valid': False, 'error': str(error)}))
