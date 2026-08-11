from __future__ import annotations

import argparse
import sys
from pathlib import Path

from mechgen.engine import run_attempt, write_json_atomic


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="mechgen")
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_predict = sub.add_parser("predict")
    p_predict.add_argument("--reactants", required=True)
    p_predict.add_argument("--conditions", default=None)
    p_predict.add_argument("--out", default="out")

    p_explain = sub.add_parser("explain")
    p_explain.add_argument("--reactants", required=True)
    p_explain.add_argument("--products", required=True)
    p_explain.add_argument("--conditions", default=None)
    p_explain.add_argument("--out", default="out")

    args = parser.parse_args(argv)

    out_dir = Path(str(args.out))

    if str(args.cmd) == "predict":
        result = run_attempt(
            mode="predict",
            reactants=str(args.reactants),
            products=None,
            conditions=str(args.conditions) if args.conditions is not None else None,
            out_dir=out_dir,
        )
    else:
        result = run_attempt(
            mode="explain",
            reactants=str(args.reactants),
            products=str(args.products),
            conditions=str(args.conditions) if args.conditions is not None else None,
            out_dir=out_dir,
        )

    result_path = out_dir / "unverified" / "result.json"
    write_json_atomic(result_path, result)

    if str(result.get("status")) == "fatal":
        print(str(result_path), file=sys.stderr)
        return 1

    print(str(result_path))
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
