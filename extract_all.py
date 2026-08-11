import zipfile
import os
import glob

def extract_all_jars(src_dir, dest_dir):
    if not os.path.exists(dest_dir):
        os.makedirs(dest_dir)
    
    jars = glob.glob(os.path.join(src_dir, "*.jar"))
    print(f"Found {len(jars)} JARs in {src_dir}")

    for jar_path in jars:
        print(f"Extracting {jar_path}...")
        try:
            with zipfile.ZipFile(jar_path, 'r') as zip_ref:
                for member in zip_ref.infolist():
                    try:
                        # Skip if directory
                        if member.is_dir():
                            continue
                        
                        target_path = os.path.join(dest_dir, member.filename)
                        # Check path length
                        if len(target_path) > 250:
                            print(f"Skipping long path in {jar_path}: {member.filename}")
                            continue
                            
                        zip_ref.extract(member, dest_dir)
                    except Exception as e:
                        print(f"Error extracting {member.filename} from {jar_path}: {e}")
        except Exception as e:
            print(f"Failed to open/read {jar_path}: {e}")

if __name__ == "__main__":
    extract_all_jars("files", "files/classes")
