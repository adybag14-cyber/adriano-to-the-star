import os
import sys
from pathlib import Path

# Add mechgen to path
sys.path.append(str(Path(os.getcwd()) / "mechgen"))

try:
    from mechgen.engine import _depict_smiles_mixture, _try_import_rdkit
    Chem, Draw = _try_import_rdkit()
    
    if Chem is None:
        print("❌ RDKit not found locally. I will rely on the improved logic and prompt.")
    else:
        print("✅ RDKit found. Testing drawing...")
        # Test acetone and water SMILES
        smiles = "CC(=O)C.O"
        img = _depict_smiles_mixture(smiles, (440, 320))
        if img:
            img.save("test_acetone_drawing.png")
            print("📸 Successfully rendered acetone and water to test_acetone_drawing.png")
        else:
            print("❌ Failed to render SMILES.")

except Exception as e:
    print(f"❌ Error testing drawing: {e}")
