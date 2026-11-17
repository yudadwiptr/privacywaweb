"""Generate every raster version of the Tirai mark (curtain pleats hanging from a rod).

Usage:  python tools/make_icons.py

Writes:
  icons/icon16|32|48.png      toolbar icons, full bleed
  icons/icon128.png           store/extension-page icon: 96px art + 16px transparent padding (Chrome guideline)
  docs/favicon.ico            16/32/48 multi-size favicon
  docs/apple-touch-icon.png   180px, square, no transparency
  docs/icon-192.png, icon-512.png   web app manifest icons
"""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
S = 1024
VELVET = (74, 58, 216, 255)
WHITE = (255, 255, 255)


def mark(radius_ratio=0.234):
    """The mark on a transparent 1024 canvas. radius_ratio=0 gives a square tile."""
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * radius_ratio), fill=VELVET)
    u = S / 32  # same grid as the SVG (viewBox 0 0 32 32)
    d.rounded_rectangle([6 * u, 6.5 * u, 26 * u, 8.7 * u], radius=1.1 * u, fill=WHITE + (255,))
    for x, a in ((7.2, 255), (13.5, 214), (19.8, 163)):
        d.rounded_rectangle([x * u, 10.5 * u, (x + 5) * u, 25.5 * u], radius=2.5 * u, fill=WHITE + (a,))
    return img


def fit(img, size):
    return img.resize((size, size), Image.LANCZOS)


def padded(img, size, art):
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    off = (size - art) // 2
    canvas.paste(fit(img, art), (off, off))
    return canvas


def main():
    icons = ROOT / "icons"
    docs = ROOT / "docs"
    icons.mkdir(exist_ok=True)
    docs.mkdir(exist_ok=True)

    rounded = mark()
    square = mark(radius_ratio=0)

    for size in (16, 32, 48):
        fit(rounded, size).save(icons / f"icon{size}.png")
    padded(rounded, 128, 96).save(icons / "icon128.png")

    fit(rounded, 48).save(docs / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
    fit(square, 180).convert("RGB").save(docs / "apple-touch-icon.png")
    fit(rounded, 192).save(docs / "icon-192.png")
    fit(rounded, 512).save(docs / "icon-512.png")
    print("icons written")


if __name__ == "__main__":
    main()
