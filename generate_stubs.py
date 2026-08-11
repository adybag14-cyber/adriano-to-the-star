import zipfile
import os
import struct
import shutil

JAR_PATH = r"c:\Users\adyba\adriano-to-the-star-clean\Starsector\starsector-core\lwjgl_v2.jar"
STUB_DIR = r"c:\Users\adyba\adriano-to-the-star-clean\stubs"

# Classes to extract (Safe ones, unmodified)
EXTRACT_LIST = [
    "org/lwjgl/LWJGLException.class",
    "org/lwjgl/opengl/DisplayMode.class",
    "org/lwjgl/opengl/PixelFormat.class",
    "org/lwjgl/opengl/ContextAttribs.class",
    "org/lwjgl/opengl/GL11.class", # Often safe, static constants
    "org/lwjgl/input/Controller.class",
    "org/lwjgl/input/Controllers.class",
    # Add interfaces which are generally safe
]

# Classes to PATCH (Make methods native, strip clinit)
PATCH_LIST = [
    "org/lwjgl/Sys.class",
    "org/lwjgl/opengl/Display.class",
    "org/lwjgl/input/Mouse.class",
    "org/lwjgl/input/Keyboard.class",
    "org/lwjgl/input/Cursor.class",
    "org/lwjgl/opengl/GLContext.class", 
]

def ensure_dir(file_path):
    directory = os.path.dirname(file_path)
    if not os.path.exists(directory):
        os.makedirs(directory)

def extract_safe_classes():
    print("--- Extracting Safe Classes ---")
    try:
        with zipfile.ZipFile(JAR_PATH, 'r') as jar:
            for file_path in EXTRACT_LIST:
                try:
                    content = jar.read(file_path)
                    target_path = os.path.join(STUB_DIR, file_path.replace("/", os.sep))
                    ensure_dir(target_path)
                    with open(target_path, "wb") as f:
                        f.write(content)
                    print(f"✅ Extracted: {file_path}")
                except KeyError:
                    print(f"⚠️ Not Found in JAR (Skipping): {file_path}")
    except FileNotFoundError:
        print(f"❌ JAR not found at: {JAR_PATH}")

# Bitwise flags for Java access
ACC_PUBLIC = 0x0001
ACC_PRIVATE = 0x0002
ACC_PROTECTED = 0x0004
ACC_STATIC = 0x0008
ACC_FINAL = 0x0010
ACC_SYNCHRONIZED = 0x0020
ACC_BRIDGE = 0x0040
ACC_VARARGS = 0x0080
ACC_NATIVE = 0x0100
ACC_INTERFACE = 0x0200
ACC_ABSTRACT = 0x0400
ACC_STRICT = 0x0800
ACC_SYNTHETIC = 0x1000
ACC_ENUM = 0x4000

class ClassPatcher:
    def __init__(self, data):
        self.data = data
        self.pos = 0
        self.cp_count = 0
        self.cp_offsets = {} # index -> offset
        self.cp_tags = {} # index -> tag

    def read_u1(self):
        v = self.data[self.pos]
        self.pos += 1
        return v

    def read_u2(self):
        v = struct.unpack('>H', self.data[self.pos:self.pos+2])[0]
        self.pos += 2
        return v

    def read_u4(self):
        v = struct.unpack('>I', self.data[self.pos:self.pos+4])[0]
        self.pos += 4
        return v

    def parse_cp(self):
        self.pos = 8 # Skip Magic(4) + Version(4)
        self.cp_count = self.read_u2()
        
        i = 1
        while i < self.cp_count:
            self.cp_offsets[i] = self.pos
            tag = self.read_u1()
            self.cp_tags[i] = tag
            
            if tag == 1: # Utf8
                length = self.read_u2()
                self.pos += length
            elif tag in [3, 4, 9, 10, 11, 12, 18]: # Integer, Float, FieldRef, MethodRef, IntMethodRef, NameType, InvokeDynamic
                self.pos += 4
            elif tag in [5, 6]: # Long, Double
                self.pos += 8
                i += 1 # Takes 2 slots
            elif tag in [7, 8, 16]: # Class, String, MethodType
                self.pos += 2
            elif tag == 15: # MethodHandle
                self.pos += 3
            else:
                raise Exception(f"Unknown CP Tag: {tag} at index {i}")
            i += 1

    def get_utf8(self, index):
        if self.cp_tags.get(index) != 1:
            return None
        offset = self.cp_offsets[index]
        # Tag(1) at offset, Length(2) at offset+1, Bytes at offset+3
        length = struct.unpack('>H', self.data[offset+1:offset+3])[0]
        return self.data[offset+3:offset+3+length].decode('utf-8', errors='ignore')

    def patch(self):
        # 1. Parse Headers and CP
        self.parse_cp()
        
        # 2. Skip Access, This, Super, Interfaces
        access_flags = self.read_u2()
        this_class = self.read_u2()
        super_class = self.read_u2()
        
        interfaces_count = self.read_u2()
        self.pos += 2 * interfaces_count # u2 * count
        
        # 3. Parse Fields (Keep them, logic changes for Methods)
        fields_count = self.read_u2()
        for _ in range(fields_count):
            self.read_u2() # Access
            self.read_u2() # Name
            self.read_u2() # Desc
            attr_count = self.read_u2()
            for _ in range(attr_count):
                self.read_u2() # Name
                length = self.read_u4()
                self.pos += length
                
        # 4. Parse & Patch Methods
        methods_start_pos = self.pos
        methods_count = self.read_u2()
        
        new_methods_data = bytearray()
        new_methods_count = 0
        
        for _ in range(methods_count):
            start_m = self.pos
            access = self.read_u2()
            name_idx = self.read_u2()
            desc_idx = self.read_u2()
            attr_count = self.read_u2()
            
            name = self.get_utf8(name_idx)
            
            # ATTRIBUTES
            # We just need to read them to advance pos, but for native methods we will DROP them.
            
            # Original parsing to advance pos
            for _ in range(attr_count):
                self.read_u2() # Name index
                a_len = self.read_u4()
                self.pos += a_len
                
            # LOGIC:
            if name == "<clinit>":
                print(f"   ✂️ Stripping <clinit>")
                continue # Skip this method entirely
            
            # For all other methods, including <init>, make them native (except abstract)
            # Actually, <init> cannot be native usually? 
            # CheerpJ implementation: if we make <init> native, we MUST Mock it in JS.
            # But the user logs show NoSuchMethodError.
            # Let's keep <init> non-native if it just calls super()?
            # Analyzing bytecode is hard.
            # SAFER: Make everything native so CheerpJ relies on the mocks. 
            # Users report: "NoSuchMethodError: org.lwjgl.Sys.initialize" -> This is a static method.
            
            # If we make it native, we must construct the method_info without Code attributes.
            
            new_access = access
            # Remove abstract, add native
            new_access &= ~ACC_ABSTRACT
            new_access |= ACC_NATIVE
            
            # Construct new method entry
            m_entry = bytearray()
            m_entry += struct.pack('>H', new_access)
            m_entry += struct.pack('>H', name_idx)
            m_entry += struct.pack('>H', desc_idx)
            m_entry += struct.pack('>H', 0) # 0 Attributes (Code stripped)
            
            new_methods_data += m_entry
            new_methods_count += 1
            # print(f"   ✨ Native-fied: {name}")

        # 5. Construct New Class File
        # Header + CP + Flags/This/Super/Interfaces + Fields
        # Note: headers are up to methods_start_pos
        
        # Important: The CP is unchanged.
        # The fields are unchanged.
        # So we write everything up to methods_start_pos
        
        out_data = bytearray(self.data[:methods_start_pos])
        out_data += struct.pack('>H', new_methods_count)
        out_data += new_methods_data
        
        # 6. Attributes of the Class itself (SourceFile etc.)
        # We can drop them or copy them.
        # Let's copy them? They are at self.pos now.
        # Format: count (u2) + attrs...
        # Wait, if we stripped methods, self.pos is at the end of original methods.
        # Correct.
        
        # Copy remaining data (Class Attributes)
        out_data += self.data[self.pos:]
        
        return out_data

def patch_classes():
    print("--- Patching Native Classes ---")
    try:
        with zipfile.ZipFile(JAR_PATH, 'r') as jar:
            for file_path in PATCH_LIST:
                try:
                    # Clean filename for printing
                    cls_name = file_path.replace("/", ".")
                    print(f"🔧 Patching {cls_name}...")
                    
                    data = jar.read(file_path)
                    patcher = ClassPatcher(data)
                    new_data = patcher.patch()
                    
                    target_path = os.path.join(STUB_DIR, file_path.replace("/", os.sep))
                    ensure_dir(target_path)
                    with open(target_path, "wb") as f:
                        f.write(new_data)
                    
                except KeyError:
                    print(f"❌ Not Found in JAR: {file_path}")
                except Exception as e:
                    print(f"❌ Error patching {file_path}: {e}")
                    import traceback
                    traceback.print_exc()
    except FileNotFoundError:
        print(f"❌ JAR not found at: {JAR_PATH}")

if __name__ == "__main__":
    if not os.path.exists(STUB_DIR):
        os.makedirs(STUB_DIR)
        
    extract_safe_classes()
    patch_classes()
    print("✅ Done!")
