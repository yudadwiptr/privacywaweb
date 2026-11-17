"""Package Tirai for the browser stores.

Usage:  python tools/build.py

Writes:
  dist/tirai-chrome-<version>.zip   Chrome Web Store, Edge Add-ons, Opera (service worker only)
  dist/tirai-firefox-<version>.zip  Firefox Add-ons (background scripts + gecko settings)
"""
import json
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"

# Only what the extension needs at runtime: no docs, store images, or tools.
INCLUDE = ["_locales", "content", "fonts", "icons", "popup", "shared", "background.js"]


def files():
    for name in INCLUDE:
        path = ROOT / name
        if path.is_file():
            yield path
        else:
            yield from sorted(p for p in path.rglob("*") if p.is_file())


def manifest_for(target, base):
    """manifest.json in the repo is the Chrome one (so Load unpacked works). Firefox gets its tweaks here."""
    m = json.loads(json.dumps(base))
    if target == "firefox":
        m["background"] = {"scripts": ["background.js"], "type": "module"}
        m["browser_specific_settings"] = {
            "gecko": {
                "id": "tirai@yudadwiptr.github.io",
                "strict_min_version": "128.0",
                "data_collection_permissions": {"required": ["none"]},
            }
        }
    return m


def main():
    base = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
    version = base["version"]
    DIST.mkdir(exist_ok=True)
    for target in ("chrome", "firefox"):
        out = DIST / f"tirai-{target}-{version}.zip"
        with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
            z.writestr("manifest.json", json.dumps(manifest_for(target, base), indent=2, ensure_ascii=False))
            for f in files():
                z.write(f, f.relative_to(ROOT).as_posix())
        print(f"{out.relative_to(ROOT).as_posix()}  ({out.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
