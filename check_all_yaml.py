import os
import yaml
import sys

# Define a constructor for GitLab CI specific tags like !reference
def reference_constructor(loader, node):
    return node.value

yaml.SafeLoader.add_constructor('!reference', reference_constructor)

def check_yaml(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            # Use safe_load_all to handle multi-document files (common in K8s)
            list(yaml.safe_load_all(f))
        return True, None
    except Exception as e:
        return False, str(e)

def main():
    root_dir = os.getcwd()
    yaml_files = []
    for root, dirs, files in os.walk(root_dir):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        if '.git' in dirs:
            dirs.remove('.git')
        for file in files:
            if file.endswith(('.yml', '.yaml')):
                yaml_files.append(os.path.join(root, file))

    print(f"Found {len(yaml_files)} YAML files.")
    errors = []
    for f in yaml_files:
        valid, error = check_yaml(f)
        if not valid:
            errors.append((f, error))
            print(f"ERROR: {f}\n  {error}")
        else:
            # print(f"OK: {f}")
            pass

    if not errors:
        print("All YAML files are valid.")
        sys.exit(0)
    else:
        print(f"\nFound {len(errors)} invalid YAML files.")
        sys.exit(1)

if __name__ == "__main__":
    main()
