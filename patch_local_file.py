
import os

target = r'cheerpj\4.2\cj3.js'
needle = b'if(c==="__syscall_pipe2")'
replacement = b'if(c==="JVM_LoadLibrary"||c==="JVM_FindLibraryEntry"){console.log("HOOKED_JVM_ANCHOR "+c);return 1;}else if(c==="__syscall_pipe2")'

try:
    with open(target, 'rb') as f:
        data = f.read()
    
    if needle in data:
        print("Needle found. Patching...")
        new_data = data.replace(needle, replacement)
        with open(target, 'wb') as f:
            f.write(new_data)
        print("SUCCESS: Patch applied.")
    elif b'HOOKED_JVM_ANCHOR' in data:
        print("Already patched.")
    else:
        print("FAIL: Needle not found.")
        idx = data.find(b'__syscall_pipe2')
        if idx != -1:
            print(f"Context: {data[idx-10:idx+30]}")
        else:
            print("Key string not found at all.")

except Exception as e:
    print(f"Error: {e}")
