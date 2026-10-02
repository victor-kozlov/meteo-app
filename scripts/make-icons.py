#!/usr/bin/env python3
"""Generate the PWA / home-screen icons into public/icons/ (needs Pillow: pip install pillow).

    python3 scripts/make-icons.py

Design: white cloud with three rain streaks on the app's blue gradient. Everything is drawn from the
unit-coordinate geometry below, so tweaking colours/shapes here regenerates every size consistently.
"""
from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent.parent / "public" / "icons"
SS = 4  # supersampling factor (draw big, downscale for smooth edges)

BG_FROM = (59, 130, 246)   # tailwind blue-500
BG_TO = (29, 78, 216)      # tailwind blue-700
CLOUD = (255, 255, 255)
RAIN = (186, 230, 253)     # tailwind sky-200

# Glyph geometry, relative to the icon centre, in fractions of the icon size.
# Total glyph extent stays within r = 0.36 so it fits the maskable "safe zone" (circle of r = 0.4).
# The three cloud bumps are tangent to the bottom of the base pill (y = 0.09) and stay inside its
# left/right ends, so the silhouette has bumps on top only.
CLOUD_CIRCLES = [(-0.17, -0.02, 0.11), (-0.01, -0.10, 0.19), (0.16, -0.04, 0.13)]  # (cx, cy, r)
CLOUD_BASE = (-0.29, -0.06, 0.29, 0.09, 0.075)                                     # x0, y0, x1, y1, radius
RAIN_STREAKS = [(-0.15, 0.17, -0.185, 0.29), (0.0, 0.17, -0.035, 0.29), (0.15, 0.17, 0.115, 0.29)]
RAIN_WIDTH = 0.048


def gradient(size: int) -> Image.Image:
    small = 256
    img = Image.new("RGB", (small, small))
    px = img.load()
    for y in range(small):
        for x in range(small):
            t = (x + y) / (2 * (small - 1))  # diagonal, top-left -> bottom-right
            px[x, y] = tuple(round(a + (b - a) * t) for a, b in zip(BG_FROM, BG_TO))
    return img.resize((size, size), Image.BICUBIC)


def render(size: int, shape: str, glyph_scale: float = 1.0) -> Image.Image:
    """shape: 'square' = full-bleed (maskable / apple-touch), 'rounded' = rounded square on transparent."""
    s = size * SS
    img = gradient(s).convert("RGBA")
    if shape == "rounded":
        mask = Image.new("L", (s, s), 0)
        ImageDraw.Draw(mask).rounded_rectangle((0, 0, s - 1, s - 1), radius=int(0.22 * s), fill=255)
        bg = Image.new("RGBA", (s, s), (0, 0, 0, 0))
        bg.paste(img, (0, 0), mask)
        img = bg
    d = ImageDraw.Draw(img)
    c = s / 2
    k = s * glyph_scale

    def pt(dx: float, dy: float) -> tuple[float, float]:
        return c + dx * k, c + dy * k

    for cx, cy, r in CLOUD_CIRCLES:
        x, y = pt(cx, cy)
        d.ellipse((x - r * k, y - r * k, x + r * k, y + r * k), fill=CLOUD)
    x0, y0, x1, y1, rad = CLOUD_BASE
    (ax, ay), (bx, by) = pt(x0, y0), pt(x1, y1)
    d.rounded_rectangle((ax, ay, bx, by), radius=rad * k, fill=CLOUD)

    w = RAIN_WIDTH * k
    for x_a, y_a, x_b, y_b in RAIN_STREAKS:
        (pa, qa), (pb, qb) = pt(x_a, y_a), pt(x_b, y_b)
        steps = 80  # stamp circles along the segment -> a perfect capsule with round caps
        for i in range(steps + 1):
            t = i / steps
            ex, ey = pa + (pb - pa) * t, qa + (qb - qa) * t
            d.ellipse((ex - w / 2, ey - w / 2, ex + w / 2, ey + w / 2), fill=RAIN)

    return img.resize((size, size), Image.LANCZOS)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    jobs = {
        "icon-192.png": (192, "rounded", 1.12),
        "icon-512.png": (512, "rounded", 1.12),
        "icon-maskable-512.png": (512, "square", 1.0),   # full bleed; glyph inside the safe zone
        "apple-touch-icon.png": (180, "square", 1.05),   # iOS rounds the corners itself, no alpha
        "favicon-32.png": (32, "rounded", 1.2),
    }
    for name, (size, shape, scale) in jobs.items():
        img = render(size, shape, scale)
        if shape == "square":
            img = img.convert("RGB")
        img.save(OUT / name, optimize=True)
        print(f"{name:24s} {size}x{size}")


if __name__ == "__main__":
    main()
