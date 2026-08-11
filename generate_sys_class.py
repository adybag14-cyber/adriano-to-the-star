
import struct
import os

def write_class():
    # Constant Pool
    cp_utf8 = 1
    cp_class = 7
    cp_name_type = 12
    cp_method_ref = 10
    
    # We need to define the class org/lwjgl/Sys
    # And methods: initialize()V, getTime()J, getVersion()Ljava/lang/String;, alert(Ljava/lang/String;Ljava/lang/String;)V
    
    # Simplified CP:
    # 1: Class: org/lwjgl/Sys
    # 2: UTF8: org/lwjgl/Sys
    # 3: Class: java/lang/Object
    # 4: UTF8: java/lang/Object
    # 5: UTF8: initialize
    # 6: UTF8: ()V
    # 7: UTF8: Code
    # 8: UTF8: getTime
    # 9: UTF8: ()J
    # 10: UTF8: getVersion
    # 11: UTF8: ()Ljava/lang/String;
    # 12: UTF8: alert
    # 13: UTF8: (Ljava/lang/String;Ljava/lang/String;)V
    # 14: UTF8: getTimerResolution
    # 15: UTF8: ()J  (Actually returning long in mock)
    # 16: UTF8: is64Bit
    # 17: UTF8: ()Z
    # 18: UTF8: getClipboard
    
    # 19: UTF8: SourceFile
    # 20: UTF8: Sys.java
    
    pool = [
        (cp_class, 2), # 1
        (cp_utf8, b'org/lwjgl/Sys'), # 2
        (cp_class, 4), # 3
        (cp_utf8, b'java/lang/Object'), # 4
        (cp_utf8, b'initialize'), # 5
        (cp_utf8, b'()V'), # 6
        (cp_utf8, b'Code'), # 7
        (cp_utf8, b'getTime'), # 8
        (cp_utf8, b'()J'), # 9
        (cp_utf8, b'getVersion'), # 10
        (cp_utf8, b'()Ljava/lang/String;'), # 11
        (cp_utf8, b'alert'), # 12
        (cp_utf8, b'(Ljava/lang/String;Ljava/lang/String;)V'), # 13
        (cp_utf8, b'getTimerResolution'), # 14
        (cp_utf8, b'()J'), # 15
        (cp_utf8, b'is64Bit'), # 16
        (cp_utf8, b'()Z'), # 17
        (cp_utf8, b'getClipboard'), # 18
        (cp_utf8, b'()Ljava/lang/String;'), # 19
        (cp_utf8, b'loadLibrary'), # 20 - CRITICAL: Other classes call this!
        (cp_utf8, b'(Ljava/lang/String;)V'), # 21 - loadLibrary(String name)
        (cp_utf8, b'doLoadLibrary'), # 22 - Also called directly
        (cp_utf8, b'(Ljava/lang/String;)Z'), # 23 - doLoadLibrary returns boolean
    ]
    
    # Constructing the binary
    # Magic + Version
    data = b'\xCA\xFE\xBA\xBE' + b'\x00\x00\x00\x32' # Java 6
    
    # Pool Count
    data += struct.pack('>H', len(pool) + 1)
    
    for item in pool:
        tag = item[0]
        val = item[1]
        data += struct.pack('>B', tag)
        if tag == cp_class:
            data += struct.pack('>H', val)
        elif tag == cp_utf8:
            data += struct.pack('>H', len(val)) + val
            
    # Access Flags (PUBLIC | SUPER)
    data += b'\x00\x21'
    # This Class
    data += b'\x00\x01'
    # Super Class
    data += b'\x00\x03'
    # Interfaces Count
    data += b'\x00\x00'
    # Fields Count
    data += b'\x00\x00'
    
    # Methods Count - now includes loadLibrary and doLoadLibrary
    methods = [
        (5, 6),   # initialize
        (8, 9),   # getTime
        (10, 11), # getVersion
        (12, 13), # alert
        (14, 15), # getTimerResolution
        (16, 17), # is64Bit
        (18, 19), # getClipboard
        (20, 21), # loadLibrary(String) - CRITICAL
        (22, 23), # doLoadLibrary(String) - CRITICAL
    ]
    
    data += struct.pack('>H', len(methods))
    
    # Empty Code Attribute: max_stack=0, max_locals=0, code_len=1 (return), 0 exceptions, 0 attrs
    code_attr = b'\x00\x00\x00\x00\x00\x00\x00\x01\xB1\x00\x00\x00\x00' 
    # Length of code_attr is 13 bytes? No.
    # Attr Frame: NameIdx(2) + Len(4) + [MaxStack(2)+MaxLoc(2)+CodeLen(4)+Code(1)+ExLen(2)+AttrLen(2)]
    # Payload = 2+2+4+1+2+2 = 13 bytes.
    
    for name_idx, desc_idx in methods:
        # Method access_flags: ACC_PUBLIC (0x0001) | ACC_STATIC (0x0008) = 0x0009
        data += struct.pack('>H', 0x0009)  # access_flags
        data += struct.pack('>H', name_idx) # Name
        data += struct.pack('>H', desc_idx) # Desc
        data += b'\x00\x01' # Attr Count (Code)
        
        # Code Attribute
        data += struct.pack('>H', 7) # "Code" utf8 index
        data += struct.pack('>I', 13) # Attr Length (Payload - will be rewritten)
        
        # MaxStack=1, MaxLocals=0 (static methods don't use 'this')
        # Return void (B1), Return long (LCONST_0 + LRETURN?), Return ref (ACONST_NULL + ARETURN?)
        # For simplicity, we just put RETURN (B1) for void.
        # For non-void, the JVM might verify and complain if we just B1.
        # But we don't care about execution correctness, only loading! 
        # CheerpJ natives will intercept BEFORE execution... hopefully.
        # If not, we just need valid bytecode that doesn't crash verifier.
        
        # Void: B1 (return)
        # Long: 09 (lconst_0) + AD (lreturn)
        # Ref: 01 (aconst_null) + B0 (areturn)
        # Boolean: 03 (iconst_0) + AC (ireturn)
        
        # To decide, we check desc_idx (1-indexed, so desc_idx-1 for 0-indexed pool)
        desc = pool[desc_idx - 1][1]  # Direct lookup: pool index = desc_idx - 1
        if desc.endswith(b'V'):
            bytecode = b'\xB1' # return
        elif desc.endswith(b'J'):
            bytecode = b'\x09\xAD' # lreturn 0
        elif desc.endswith(b'Z'):
            bytecode = b'\x03\xAC' # ireturn 0
        else: # String etc
            bytecode = b'\x01\xB0' # areturn null
            
        code_len = len(bytecode)
        payload_len = 2+2+4+code_len+2+2
        
        # Rewrite Attr Length
        data = data[:-4] + struct.pack('>I', payload_len)
        
        data += b'\x00\x01' # Stack
        data += b'\x00\x00' # Locals
        data += struct.pack('>I', code_len)
        data += bytecode
        data += b'\x00\x00' # Ex Table
        data += b'\x00\x00' # Attr Table

    # Class Attributes Count
    data += b'\x00\x00'
    
    target_dir = 'cheerpj-natives/org/lwjgl'
    os.makedirs(target_dir, exist_ok=True)
    with open(f'{target_dir}/Sys.class', 'wb') as f:
        f.write(data)
    print(f"Written valid dummy Sys.class to {target_dir}")

if __name__ == '__main__':
    write_class()
