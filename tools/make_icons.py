"""Generate every raster version of the Tirai logo from assets/brand/logo.svg.

Usage:  python tools/make_icons.py

Renders the SVG once at 1024px with headless Chrome/Edge (transparent background),
then downsizes with Pillow. Writes:
  icons/icon16|32.png         toolbar icons from logo-small.svg (hinted)
  icons/icon48.png            full logo
  icons/icon128.png           store/extension-page icon: 96px art + 16px transparent padding (Chrome guideline)
  icons/logo.svg              copy used by the popup
  docs/favicon.ico            16/32/48 multi-size favicon
  docs/favicon.svg, logo.svg  vector copies for the site
  docs/apple-touch-icon.png   180px on a solid background (iOS adds its own rounding)
  docs/icon-192.png, icon-512.png   web app manifest icons
"""
import os
import shutil
import subprocess
import tempfile
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SVG = ROOT / "assets" / "brand" / "logo.svg"
SVG_SMALL = ROOT / "assets" / "brand" / "logo-small.svg"  # hinted for 16/32px
BG = (52, 44, 168)  # mid-tone of the tile gradient, for the opaque apple-touch icon

BROWSERS = [
    Path(os.environ.get("ProgramFiles", "")) / "Google/Chrome/Application/chrome.exe",
    Path(os.environ.get("ProgramFiles(x86)", "")) / "Microsoft/Edge/Application/msedge.exe",
    Path("/usr/bin/google-chrome"),
    Path("/usr/bin/chromium"),
    Path("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"),
]


def render_master(svg=SVG, size=1024):
    browser = next((b for b in BROWSERS if b.is_file()), None)
    if not browser:
        raise SystemExit("Chrome or Edge is needed to render the SVG.")
    tmp = Path(tempfile.mkdtemp(prefix="tirai-logo-"))
    page = tmp / "logo.html"
    page.write_text(
        f'<html><body style="margin:0;background:transparent">'
        f'<img src="{svg.as_uri()}" width="{size}" height="{size}" style="display:block"></body></html>',
        encoding="utf-8",
    )
    out = tmp / "master.png"
    subprocess.run(
        [str(browser), "--headless=new", "--disable-gpu", "--hide-scrollbars",
         "--force-device-scale-factor=1", "--default-background-color=00000000",
         f"--user-data-dir={tmp / 'profile'}", f"--window-size={size},{size}",
         f"--screenshot={out}", page.as_uri()],
        check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=60,
    )
    img = Image.open(out).convert("RGBA").crop((0, 0, size, size))
    img.load()
    shutil.rmtree(tmp, ignore_errors=True)
    return img


def fit(img, size):
    return img.resize((size, size), Image.LANCZOS)


def padded(img, size, art):
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    off = (size - art) // 2
    canvas.paste(fit(img, art), (off, off))
    return canvas


def main():
    icons, docs = ROOT / "icons", ROOT / "docs"
    icons.mkdir(exist_ok=True)
    docs.mkdir(exist_ok=True)

    master = render_master()
    small = render_master(SVG_SMALL, 512)

    fit(small, 16).save(icons / "icon16.png")
    fit(small, 32).save(icons / "icon32.png")
    fit(master, 48).save(icons / "icon48.png")
    padded(master, 128, 96).save(icons / "icon128.png")

    # multi-size .ico: hinted art for 16/32, full art for 48
    ico = [fit(small, 16), fit(small, 32), fit(master, 48)]
    ico[2].save(docs / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)], append_images=ico[:2])
    touch = Image.new("RGBA", (180, 180), BG + (255,))
    touch.alpha_composite(fit(master, 180))
    touch.convert("RGB").save(docs / "apple-touch-icon.png")
    fit(master, 192).save(docs / "icon-192.png")
    fit(master, 512).save(docs / "icon-512.png")

    for dest in (icons / "logo.svg", docs / "logo.svg"):
        shutil.copyfile(SVG, dest)
    shutil.copyfile(SVG_SMALL, docs / "favicon.svg")  # browser tabs show it at 16px
    print("icons written")


if __name__ == "__main__":
    main()
