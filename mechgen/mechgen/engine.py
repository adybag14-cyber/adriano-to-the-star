from __future__ import annotations

import io
import json
import math
import os
import re
import traceback
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from PIL import Image, ImageDraw, ImageFont

try:
    from google import genai

    try:
        from google.genai import types as genai_types
    except Exception:
        genai_types = None
except Exception:
    genai = None
    genai_types = None

load_dotenv()

DEFAULT_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
NODE_ENV = os.getenv("NODE_ENV", "development")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def write_json_atomic(path: Path, obj: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(obj, indent=2, ensure_ascii=False), encoding="utf-8")
    tmp.replace(path)


def get_api_key() -> str | None:
    return os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY_2")


def gemini_generate_json(prompt: str, model: str | None = None) -> tuple[dict[str, Any] | None, str | None]:
    if genai is None:
        return None, "google-genai is not installed"

    api_key = get_api_key()
    if not api_key:
        return None, "GEMINI_API_KEY (or GOOGLE_API_KEY) is not set"

    try:
        client = genai.Client(api_key=api_key)
    except Exception as e:
        return None, f"Failed to create Gemini client: {e}"

    try:
        model_name = model or DEFAULT_MODEL
        safety_settings = [
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
        ]

        if genai_types is not None:
            config = genai_types.GenerateContentConfig(
                response_mime_type="application/json",
                safety_settings=safety_settings
            )
            resp = client.models.generate_content(model=model_name, contents=prompt, config=config)
            parsed = getattr(resp, "parsed", None)
            if isinstance(parsed, dict):
                return parsed, None
            if getattr(resp, "text", None):
                return json.loads(resp.text), None
            return None, "Gemini response missing text"

        resp = client.models.generate_content(model=model_name, contents=prompt)
        text = getattr(resp, "text", "")
        if not text:
            return None, "Gemini response missing text"
        start = text.find("{")
        end = text.rfind("}")
        if start == -1 or end == -1 or end <= start:
            return None, "Gemini did not return JSON"
        return json.loads(text[start : end + 1]), None
    except Exception as e:
        return None, f"Gemini request failed: {e}"


def truncate(s: str, n: int) -> str:
    s = s.strip()
    if len(s) <= n:
        return s
    return s[: n - 1].rstrip() + "…"


def _try_import_rdkit() -> tuple[Any | None, Any | None]:
    try:
        from rdkit import Chem  # type: ignore
        from rdkit.Chem import Draw  # type: ignore

        return Chem, Draw
    except Exception:
        return None, None


def _clean_mixture_smiles(s: str) -> str:
    s = s.strip()
    s = s.replace(" ", "")
    s = s.replace("+", ".")
    s = re.sub(r"\.{{2,}}", ".", s)
    return s


def _mols_from_smiles_mixture(smiles: str) -> list[Any] | None:
    Chem, _ = _try_import_rdkit()
    if Chem is None:
        return None

    s = _clean_mixture_smiles(smiles)
    if not s:
        return None

    parts = [p for p in s.split(".") if p]
    mols: list[Any] = []
    for part in parts:
        try:
            m = Chem.MolFromSmiles(part)
            if m is not None:
                mols.append(m)
        except Exception:
            continue
    return mols if mols else None


def _heavy_atom_counts(mols: list[Any]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for mol in mols:
        for atom in mol.GetAtoms():
            sym = str(atom.GetSymbol())
            if sym == "H":
                continue
            counts[sym] = counts.get(sym, 0) + 1
    return counts


def _canonical_smiles_list(mols: list[Any]) -> list[str] | None:
    Chem, _ = _try_import_rdkit()
    if Chem is None:
        return None

    out: list[str] = []
    for mol in mols:
        try:
            out.append(Chem.MolToSmiles(mol, canonical=True))
        except Exception:
            return None
    return out


def _fit_to_box(img: Image.Image, box: tuple[int, int]) -> Image.Image:
    if img.mode != "RGB":
        img = img.convert("RGB")

    resized = img.copy()
    if hasattr(Image, "Resampling"):
        resized.thumbnail(box, Image.Resampling.LANCZOS)
    else:
        resized.thumbnail(box, Image.LANCZOS)

    canvas = Image.new("RGB", box, (255, 255, 255))
    ox = (box[0] - resized.width) // 2
    oy = (box[1] - resized.height) // 2
    canvas.paste(resized, (ox, oy))
    return canvas


def _depict_smiles_mixture(smiles: str, box: tuple[int, int]) -> Image.Image | None:
    Chem, Draw = _try_import_rdkit()
    if Chem is None or Draw is None:
        return None

    mols = _mols_from_smiles_mixture(smiles)
    if not mols:
        return None

    try:
        if len(mols) == 1:
            img = Draw.MolToImage(mols[0], size=box)
            return _fit_to_box(img, box)

        per_row = min(3, len(mols))
        img = Draw.MolsToGridImage(mols, molsPerRow=per_row, subImgSize=box)
        if isinstance(img, Image.Image):
            return _fit_to_box(img, box)
        return None
    except Exception:
        return None


def _draw_quadratic_bezier(
    draw: ImageDraw.ImageDraw,
    p0: tuple[float, float],
    p1: tuple[float, float],
    p2: tuple[float, float],
    *,
    width: int,
    color: tuple[int, int, int],
    steps: int = 24,
) -> None:
    pts: list[tuple[float, float]] = []
    for i in range(steps + 1):
        t = i / float(steps)
        x = (1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0]
        y = (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]
        pts.append((x, y))
    draw.line(pts, fill=color, width=width)


def _draw_arrowhead(
    draw: ImageDraw.ImageDraw,
    tip: tuple[float, float],
    direction: tuple[float, float],
    *,
    size: float,
    color: tuple[int, int, int],
    width: int,
) -> None:
    dx, dy = direction
    norm = math.hypot(dx, dy)
    if norm <= 1e-6:
        return
    dx /= norm
    dy /= norm

    angle = math.radians(28)
    cos_a = math.cos(angle)
    sin_a = math.sin(angle)

    lx = dx * cos_a - dy * sin_a
    ly = dx * sin_a + dy * cos_a
    rx = dx * cos_a + dy * sin_a
    ry = -dx * sin_a + dy * cos_a

    p1 = (tip[0] - size * lx, tip[1] - size * ly)
    p2 = (tip[0] - size * rx, tip[1] - size * ry)

    draw.line([p1, tip], fill=color, width=width)
    draw.line([p2, tip], fill=color, width=width)


def _draw_curved_arrow(
    draw: ImageDraw.ImageDraw,
    start: tuple[float, float],
    end: tuple[float, float],
    *,
    color: tuple[int, int, int] = (0, 0, 0),
    width: int = 4,
) -> None:
    x0, y0 = start
    x1, y1 = end
    dx = x1 - x0
    dy = y1 - y0
    dist = math.hypot(dx, dy)
    if dist <= 1.0:
        return

    mx = (x0 + x1) / 2.0
    my = (y0 + y1) / 2.0
    px, py = -dy, dx
    pnorm = math.hypot(px, py)
    if pnorm <= 1e-6:
        pnorm = 1.0
    px /= pnorm
    py /= pnorm

    curvature = max(18.0, min(70.0, dist * 0.25))
    cx = mx + px * curvature
    cy = my + py * curvature

    _draw_quadratic_bezier(draw, (x0, y0), (cx, cy), (x1, y1), width=width, color=color)

    tangent = (x1 - cx, y1 - cy)
    _draw_arrowhead(draw, (x1, y1), tangent, size=14.0, color=color, width=width)


def _depict_smiles_mixture_with_electron_arrows(
    smiles: str,
    box: tuple[int, int],
    arrows: list[dict[str, Any]],
) -> Image.Image | None:
    Chem, _ = _try_import_rdkit()
    if Chem is None:
        return None

    try:
        from rdkit.Chem import AllChem  # type: ignore
        from rdkit.Chem.Draw import rdMolDraw2D  # type: ignore
    except Exception:
        return None

    mols = _mols_from_smiles_mixture(smiles)
    if not mols or len(mols) > 3:
        return None

    spacing = 26
    sub_w = max(1, int((box[0] - spacing * (len(mols) - 1)) / len(mols)))
    sub_h = box[1]

    canvas = Image.new("RGB", box, (255, 255, 255))
    coords_by_map: dict[int, tuple[float, float]] = {}
    x = 0

    for mol in mols:
        try:
            mapnum_by_idx = {a.GetIdx(): int(a.GetAtomMapNum()) for a in mol.GetAtoms() if int(a.GetAtomMapNum()) > 0}
            mol_draw = Chem.Mol(mol)
            for a in mol_draw.GetAtoms():
                a.SetAtomMapNum(0)

            try:
                AllChem.Compute2DCoords(mol_draw)
            except Exception:
                pass

            try:
                drawer = rdMolDraw2D.MolDraw2DCairo(sub_w, sub_h)
            except (AttributeError, Exception):
                # Fallback if Cairo is not available
                img = Draw.MolToImage(mol_draw, size=(sub_w, sub_h))
                img = img.convert("RGB")
                canvas.paste(img, (x, 0))
                x += sub_w + spacing
                continue

            drawer.DrawMolecule(mol_draw)
            drawer.FinishDrawing()
            png = drawer.GetDrawingText()
            img = Image.open(io.BytesIO(png)).convert("RGB")
            canvas.paste(img, (x, 0))

            for atom_idx, mapnum in mapnum_by_idx.items():
                try:
                    pt = drawer.GetDrawCoords(int(atom_idx))
                    coords_by_map[int(mapnum)] = (float(pt.x) + float(x), float(pt.y))
                except Exception:
                    continue

            x += sub_w + spacing
        except Exception as e:
            print(f"Error drawing molecule: {e}")
            x += sub_w + spacing
            continue

    if not coords_by_map:
        return None

    draw = ImageDraw.Draw(canvas)
    font = _get_font(18)
    if len(mols) >= 2:
        plus_x = sub_w
        for _ in range(len(mols) - 1):
            draw.text((plus_x + 6, (box[1] // 2) - 10), "+", fill=(0, 0, 0), font=font)
            plus_x += sub_w + spacing

    for a in arrows:
        if not isinstance(a, dict):
            continue
        try:
            fm = int(a.get("from_map"))
            tm = int(a.get("to_map"))
        except Exception:
            continue
        if fm <= 0 or tm <= 0:
            continue
        if fm not in coords_by_map or tm not in coords_by_map:
            continue

        _draw_curved_arrow(draw, coords_by_map[fm], coords_by_map[tm], color=(0, 0, 0), width=4)

    return _fit_to_box(canvas, box)


def _get_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    repo_root = Path(__file__).resolve().parents[2]
    font_paths = [
        repo_root / "fonts" / "Raleway-Regular.ttf",
        repo_root / "public" / "fonts" / "Raleway-Regular.ttf",
        Path("/workspace/fonts/Raleway-Regular.ttf"),
    ]
    for p in font_paths:
        if p.exists():
            try:
                return ImageFont.truetype(str(p), size)
            except Exception:
                pass
    return ImageFont.load_default()


def render_step_png(
    path: Path,
    title: str,
    body: str,
    footer: str,
    *,
    reactants_smiles: str | None = None,
    products_smiles: str | None = None,
    electron_arrows: list[dict[str, Any]] | None = None,
) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    react_img = None
    prod_img = None

    if reactants_smiles and products_smiles:
        if electron_arrows:
            react_img = _depict_smiles_mixture_with_electron_arrows(reactants_smiles, (440, 320), electron_arrows)
        if react_img is None:
            react_img = _depict_smiles_mixture(reactants_smiles, (440, 320))
        prod_img = _depict_smiles_mixture(products_smiles, (440, 320))

    img = Image.new("RGB", (1200, 800), (255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    title_font = _get_font(32)
    body_font = _get_font(20)
    footer_font = _get_font(16)

    draw.text((40, 30), truncate(title, 120), fill=(0, 0, 0), font=title_font)

    if react_img is not None and prod_img is not None:
        top_y = 100
        left_x = 40
        right_x = 1200 - 40 - prod_img.width

        img.paste(react_img, (left_x, top_y))
        img.paste(prod_img, (right_x, top_y))

        mid_y = top_y + (react_img.height // 2)
        ax0 = left_x + react_img.width + 30
        ax1 = right_x - 30

        draw.line((ax0, mid_y, ax1, mid_y), fill=(0, 0, 0), width=4)
        draw.polygon(
            [
                (ax1, mid_y),
                (ax1 - 18, mid_y - 10),
                (ax1 - 18, mid_y + 10),
            ],
            fill=(0, 0, 0),
        )

        text_y = top_y + max(react_img.height, prod_img.height) + 40
        y = text_y
        for line in truncate(body, 2000).split("\n"):
            draw.text((40, y), line, fill=(40, 40, 40), font=body_font)
            y += 26

    else:
        y = 100
        for line in truncate(body, 2500).split("\n"):
            draw.text((40, y), line, fill=(40, 40, 40), font=body_font)
            y += 26

    draw.text((40, 750), footer, fill=(180, 0, 0), font=footer_font)
    img.save(path, format="PNG")


def build_prompt(mode: str, reactants: str, products: str | None, conditions: str | None, input_kind: str = "auto") -> str:
    prompt = (
        "You are an expert organic chemistry assistant. Return JSON only. Do not claim verification.\n\n"
        "GOAL: Map the full reaction mechanism. Every step MUST have 'from_smiles' and 'to_smiles'.\n"
        "SMILES REQUIREMENTS:\n"
        "1. Use valid RDKit SMILES strings.\n"
        "2. For electron movement, you MUST use atom-mapped SMILES in 'from_smiles' (e.g. [CH3:1][C:2](=[O:3])[H:4]).\n"
        "3. Reference those same map numbers in the 'arrows' list: [{'from_map': start_atom, 'to_map': end_atom}, ...].\n"
        "4. If inputs are names like 'acetone', you MUST convert them to SMILES like 'CC(=O)C' in your response.\n\n"
        "EXAMPLE JSON OUTPUT:\n"
        "{\n"
        '  "identified_reactants_smiles": "CC(=O)C.O",\n'
        '  "identified_products_smiles": "CC(O)(O)C",\n'
        '  "steps": [\n'
        '    {\n'
        '      "index": 0,\n'
        '      "title": "Protonation",\n'
        '      "from_smiles": "[O:1]=[C:2]([CH3:3])[CH3:4].[H:5][O:6][H:7]",\n'
        '      "to_smiles": "[OH+:1]=[C:2]([CH3:3])[CH3:4].[O-:6][H:7]",\n'
        '      "arrows": [{"from_map": 1, "to_map": 5}]\n'
        '    }\n'
        '  ]\n'
        "}\n\n"
        f"Request Mode: {mode}\n"
        f"Input: {reactants}\n"
    )
    if products:
        prompt += f"Target Products: {products}\n"
    if conditions:
        prompt += f"Conditions: {conditions}\n"
    
    return prompt


ENGINE_VERSION = "2026-01-04-v2"

def health() -> dict[str, Any]:
    Chem, _ = _try_import_rdkit()
    rdkit_version: str | None = None
    if Chem is not None:
        try:
            import rdkit  # type: ignore

            rdkit_version = str(getattr(rdkit, "__version__", "")) or None
        except Exception:
            rdkit_version = None

    return {
        "ok": True,
        "version": ENGINE_VERSION,
        "model": DEFAULT_MODEL,
        "gemini_available": genai is not None,
        "api_key_present": bool(get_api_key()),
        "rdkit_available": Chem is not None,
        "rdkit_version": rdkit_version,
    }


def run_attempt(
    *,
    mode: str,
    reactants: str,
    products: str | None,
    conditions: str | None,
    input_kind: str = "auto",
    out_dir: Path,
    max_steps: int = 8,
) -> dict[str, Any]:
    created_at = now_iso()
    errors: list[str] = []
    steps: list[dict[str, Any]] = []
    predicted_products: list[str] = []

    try:
        prompt = build_prompt(mode, reactants, products, conditions, input_kind)
        llm_data, llm_err = gemini_generate_json(prompt)
        if llm_err:
            errors.append(llm_err)

        identified_reactants = reactants
        identified_products = products or ""

        if isinstance(llm_data, dict):
            # Prioritize SMILES but keep names if they don't look like SMILES
            raw_react = str(llm_data.get("identified_reactants_smiles", "")).strip()
            if raw_react and ('(' in raw_react or '=' in raw_react or len(raw_react) < 30):
                identified_reactants = raw_react
            
            raw_prod = str(llm_data.get("identified_products_smiles", "")).strip()
            if raw_prod and ('(' in raw_prod or '=' in raw_prod or len(raw_prod) < 30):
                identified_products = raw_prod
            
            raw_products = llm_data.get("predicted_products", [])
            if isinstance(raw_products, list):
                predicted_products = [str(x) for x in raw_products if str(x).strip()]

            raw_steps = llm_data.get("steps", [])
            if isinstance(raw_steps, list):
                for i, st in enumerate(raw_steps[:max_steps]):
                    if not isinstance(st, dict):
                        continue
                    title = str(st.get("title", f"Step {i + 1}")).strip() or f"Step {i + 1}"
                    desc = str(st.get("description", "")).strip()
                    step: dict[str, Any] = {"index": i, "title": title, "description": desc}
                    from_smiles = str(st.get("from_smiles", "")).strip()
                    to_smiles = str(st.get("to_smiles", "")).strip()
                    if from_smiles:
                        step["from_smiles"] = from_smiles
                    if to_smiles:
                        step["to_smiles"] = to_smiles

                    raw_arrows = st.get("arrows", [])
                    if isinstance(raw_arrows, list):
                        arrows_out: list[dict[str, Any]] = []
                        for a in raw_arrows:
                            if not isinstance(a, dict):
                                continue
                            try:
                                fm = int(a.get("from_map"))
                                tm = int(a.get("to_map"))
                            except Exception:
                                continue
                            if fm <= 0 or tm <= 0:
                                continue
                            arrows_out.append({"from_map": fm, "to_map": tm})
                        if arrows_out:
                            step["arrows"] = arrows_out

                    steps.append(step)

            raw_warn = llm_data.get("warnings", [])
            if isinstance(raw_warn, list):
                for w in raw_warn:
                    w = str(w).strip()
                    if w:
                        errors.append(w)

        if not steps:
            error_msg = f"No step data available. {llm_err if llm_err else 'The AI returned an empty response.'}"
            steps = [
                {
                    "index": 0,
                    "title": "Mechanism attempt",
                    "description": error_msg,
                }
            ]

        products_for_depiction = identified_products or ".".join(predicted_products)

        validation: dict[str, Any] | None = None
        Chem, _ = _try_import_rdkit()
        if Chem is not None:
            react_mols = _mols_from_smiles_mixture(identified_reactants)
            prod_mols = _mols_from_smiles_mixture(products_for_depiction) if products_for_depiction else None

            validation = {
                "reactants_smiles_valid": react_mols is not None,
                "products_smiles_valid": (prod_mols is not None) if products_for_depiction else None,
                "reactants_canonical": _canonical_smiles_list(react_mols) if react_mols is not None else None,
                "products_canonical": _canonical_smiles_list(prod_mols) if prod_mols is not None else None,
                "heavy_atom_balance_ok": None,
                "heavy_atom_balance_delta": None,
            }

            if react_mols is not None and prod_mols is not None:
                rc = _heavy_atom_counts(react_mols)
                pc = _heavy_atom_counts(prod_mols)
                delta: dict[str, dict[str, int]] = {}
                for el in sorted(set(rc.keys()) | set(pc.keys())):
                    a = int(rc.get(el, 0))
                    b = int(pc.get(el, 0))
                    if a != b:
                        delta[el] = {"reactants": a, "products": b}
                validation["heavy_atom_balance_delta"] = delta
                validation["heavy_atom_balance_ok"] = len(delta) == 0

        unverified_steps_dir = out_dir / "unverified" / "steps"
        for st in steps:
            i = int(st["index"])
            img_path = unverified_steps_dir / f"{i}.png"
            step_reactants_smiles = str(st.get("from_smiles", "")).strip() or identified_reactants
            step_products_smiles = str(st.get("to_smiles", "")).strip() or products_for_depiction
            render_step_png(
                img_path,
                title=str(st.get("title", f"Step {i}")),
                body=(
                    f"{str(st.get('description', '')).strip()}\n\n"
                    f"Reactants: {reactants}\n"
                    f"Products: {products or ''}\n"
                    f"Conditions: {conditions or ''}"
                ),
                footer=f"UNVERIFIED (attempt) v:{ENGINE_VERSION}",
                reactants_smiles=step_reactants_smiles if step_reactants_smiles else None,
                products_smiles=step_products_smiles if step_products_smiles else None,
                electron_arrows=st.get("arrows") if isinstance(st.get("arrows"), list) else None,
            )
            st["image_path"] = str(img_path)

        return {
            "mode": mode,
            "created_at": created_at,
            "verified": False,
            "status": "unverified",
            "reactants_input": reactants,
            "products_input": products,
            "conditions": conditions,
            "predicted_products": predicted_products,
            "steps": steps,
            "validation": validation,
            "errors": errors
            + [
                "Mechanism is not verified: validation/atom-mapping checks are not implemented yet."
            ],
            "diagnostics": health(),
        }

    except Exception as e:
        is_prod = NODE_ENV == "production"
        tb = traceback.format_exc(limit=50)
        errors.append("Fatal error" if is_prod else f"Fatal error: {e}")
        if not is_prod:
            errors.append(tb)

        unverified_steps_dir = out_dir / "unverified" / "steps"
        img_path = unverified_steps_dir / "0.png"
        body = "An error occurred while processing this job." if is_prod else truncate("\n".join(errors), 1400)
        render_step_png(
            img_path,
            title="Mechanism attempt failed",
            body=body,
            footer="FATAL (unverified artifacts still emitted)",
        )

        return {
            "mode": mode,
            "created_at": created_at,
            "verified": False,
            "status": "fatal",
            "reactants_input": reactants,
            "products_input": products,
            "conditions": conditions,
            "predicted_products": [],
            "steps": [
                {
                    "index": 0,
                    "title": "Mechanism attempt failed",
                    "description": "See errors",
                    "image_path": str(img_path),
                }
            ],
            "errors": ["An error occurred while processing this job."] if is_prod else errors,
            "diagnostics": health(),
        }