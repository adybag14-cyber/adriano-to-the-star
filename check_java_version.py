
import zipfile
import struct
import sys

def get_class_version(jar_path, class_path):
    try:
        with zipfile.ZipFile(jar_path, 'r') as jar:
            if class_path is None:
                # Check first 5 classes
                results = []
                count = 0
                for info in jar.infolist():
                    if info.filename.endswith('.class'):
                        v = get_class_version(jar_path, info.filename)
                        results.append(f"{info.filename}: {v}")
                        count += 1
                        if count >= 5: break
                return "\n".join(results)
            
            with jar.open(class_path) as f:
                magic = f.read(4)
                if magic != b'\xca\xfe\xba\xbe':
                    return "Not a class file"
                minor = struct.unpack('>H', f.read(2))[0]
                major = struct.unpack('>H', f.read(2))[0]
                return f"Major: {major} (Java {major - 44})"
    except Exception as e:
        return f"Error: {e}"

print("--- starfarer_obf.jar ---")
print(get_class_version('files/starfarer_obf.jar', 'com/fs/starfarer/StarfarerLauncher.class'))
print("Sampling random classes:")
print(get_class_version('files/starfarer_obf.jar', None))

print("\n--- starfarer.api.jar ---")
print(get_class_version('files/starfarer.api.jar', None))
