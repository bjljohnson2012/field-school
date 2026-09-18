"""Allow glide/takeover in fieldschool_edit.remotion._scenes. Operator VPS only."""

from pathlib import Path
import sys

OLD = '        if motion not in {"spring", "interpolate"}:\n            motion = "spring"'
NEW = '        if motion not in {"spring", "interpolate", "glide", "takeover"}:\n            motion = "spring"'


def main() -> int:
    path = Path(sys.argv[1] if len(sys.argv) > 1 else "/opt/fieldschool-edit/fieldschool_edit/remotion.py")
    text = path.read_text()
    if NEW in text:
        print(f"already patched {path}")
        return 0
    if OLD not in text:
        print(f"pattern missing in {path}", file=sys.stderr)
        return 2
    path.write_text(text.replace(OLD, NEW, 1))
    print(f"patched {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
