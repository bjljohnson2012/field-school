#!/usr/bin/env python3
"""Five square Field School mark options. Does not replace the live logo."""

from __future__ import annotations

import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "marketing-site" / "brand" / "options"
ART = Path("/opt/cursor/artifacts")

BLUE = "#1f5eff"
CREAM = "#f6f3ec"
INK = "#1a1916"
WHITE = "#ffffff"
BAR_DIM = "#d7e3ff"
FONT_CACHE = Path("/tmp/fs-fonts")
FRAUNCES_URL = (
    "https://github.com/google/fonts/raw/main/ofl/fraunces/"
    "Fraunces%5BSOFT%2CWONK%2Copsz%2Cwght%5D.ttf"
)
PLEX_URL = (
    "https://github.com/google/fonts/raw/main/ofl/ibmplexsans/"
    "IBMPlexSans%5Bwdth%2Cwght%5D.ttf"
)

SIZE = 1024
PAD = 128
INNER = SIZE - PAD * 2
RX = 168


def fonts() -> tuple[Path, Path]:
    FONT_CACHE.mkdir(parents=True, exist_ok=True)
    fraunces = FONT_CACHE / "Fraunces-wght.ttf"
    plex = FONT_CACHE / "IBMPlexSans.ttf"
    if not fraunces.exists():
        urllib.request.urlretrieve(FRAUNCES_URL, fraunces)
    if not plex.exists():
        urllib.request.urlretrieve(PLEX_URL, plex)
    return fraunces, plex


def fraunces_font(path: Path, size: int) -> ImageFont.FreeTypeFont:
    font = ImageFont.truetype(str(path), size)
    font.set_variation_by_axes([144, 600, 0, 0])
    return font


def plex_font(path: Path, size: int) -> ImageFont.FreeTypeFont:
    font = ImageFont.truetype(str(path), size)
    if hasattr(font, "set_variation_by_axes"):
        try:
            font.set_variation_by_axes([100, 500])
        except OSError:
            pass
    return font


def rr(draw: ImageDraw.ImageDraw, box, radius: float, fill: str) -> None:
    draw.rounded_rectangle(box, radius=max(1, radius), fill=fill)


def tile() -> tuple[Image.Image, ImageDraw.ImageDraw]:
    image = Image.new("RGBA", (SIZE, SIZE), CREAM)
    draw = ImageDraw.Draw(image)
    rr(draw, (PAD, PAD, PAD + INNER, PAD + INNER), RX, BLUE)
    return image, draw


def u(frac: float) -> float:
    return PAD + INNER * frac


def journal() -> Image.Image:
    image, draw = tile()
    rule_x0, rule_x1 = u(0.18), u(0.24)
    rr(draw, (rule_x0, u(0.18), rule_x1, u(0.82)), 12, WHITE)
    lines = ((0.22, 0.34, 0.50), (0.42, 0.52, 0.40), (0.62, 0.70, 0.26))
    fills = (WHITE, WHITE, BAR_DIM)
    for (y0, y1, width), fill in zip(lines, fills):
        rr(draw, (u(0.32), u(y0), u(0.32 + width), u(y1)), 16, fill)
    return image


def letter_f() -> Image.Image:
    image, draw = tile()
    stem = (u(0.22), u(0.20), u(0.38), u(0.80))
    top = (u(0.22), u(0.20), u(0.78), u(0.36))
    mid = (u(0.22), u(0.46), u(0.64), u(0.60))
    rr(draw, stem, 28, WHITE)
    rr(draw, top, 28, WHITE)
    rr(draw, mid, 24, WHITE)
    return image


def path() -> Image.Image:
    image, draw = tile()
    bars = ((0.20, 0.34, 0.30), (0.42, 0.56, 0.46), (0.64, 0.80, 0.62))
    for y0, y1, width in bars:
        x0 = 0.5 - width / 2
        rr(draw, (u(x0), u(y0), u(x0 + width), u(y1)), 28, WHITE)
    return image


def plots() -> Image.Image:
    image, draw = tile()
    gap = 0.08
    cell = (1 - 0.20 * 2 - gap) / 2
    origins = ((0.20, 0.20), (0.20 + cell + gap, 0.20), (0.20, 0.20 + cell + gap), (0.20 + cell + gap, 0.20 + cell + gap))
    fills = (WHITE, WHITE, BAR_DIM, WHITE)
    for (x, y), fill in zip(origins, fills):
        rr(draw, (u(x), u(y), u(x + cell), u(y + cell)), 36, fill)
    return image


def monogram(fraunces: Path) -> Image.Image:
    image, draw = tile()
    f_font = fraunces_font(fraunces, 430)
    s_font = fraunces_font(fraunces, 250)
    f_box = draw.textbbox((0, 0), "F", font=f_font)
    s_box = draw.textbbox((0, 0), "S", font=s_font)
    fw, fh = f_box[2] - f_box[0], f_box[3] - f_box[1]
    sw, sh = s_box[2] - s_box[0], s_box[3] - s_box[1]
    pair_w = fw + sw * 0.42
    pair_h = max(fh, sh + fh * 0.18)
    fx = SIZE / 2 - pair_w / 2 - f_box[0]
    fy = SIZE / 2 - pair_h / 2 - f_box[1] + 8
    sx = fx + f_box[0] + fw * 0.62 - s_box[0]
    sy = fy + f_box[1] + fh * 0.28 - s_box[1]
    draw.text((fx, fy), "F", font=f_font, fill=WHITE)
    draw.text((sx, sy), "S", font=s_font, fill=BAR_DIM)
    return image


def svg_tile(body: str) -> str:
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {SIZE} {SIZE}" '
        f'width="{SIZE}" height="{SIZE}" fill="none">'
        f'<rect width="{SIZE}" height="{SIZE}" fill="{CREAM}"/>'
        f'<rect x="{PAD}" y="{PAD}" width="{INNER}" height="{INNER}" rx="{RX}" fill="{BLUE}"/>'
        f"{body}</svg>\n"
    )


def svg_rr(x0: float, y0: float, x1: float, y1: float, r: float, fill: str) -> str:
    return (
        f'<rect x="{x0:.1f}" y="{y0:.1f}" width="{x1 - x0:.1f}" height="{y1 - y0:.1f}" '
        f'rx="{r:.1f}" fill="{fill}"/>'
    )


def journal_svg() -> str:
    body = svg_rr(u(0.18), u(0.18), u(0.24), u(0.82), 12, WHITE)
    lines = ((0.22, 0.34, 0.50, WHITE), (0.42, 0.52, 0.40, WHITE), (0.62, 0.70, 0.26, BAR_DIM))
    for y0, y1, width, fill in lines:
        body += svg_rr(u(0.32), u(y0), u(0.32 + width), u(y1), 16, fill)
    return svg_tile(body)


def letter_f_svg() -> str:
    body = (
        svg_rr(u(0.22), u(0.20), u(0.38), u(0.80), 28, WHITE)
        + svg_rr(u(0.22), u(0.20), u(0.78), u(0.36), 28, WHITE)
        + svg_rr(u(0.22), u(0.46), u(0.64), u(0.60), 24, WHITE)
    )
    return svg_tile(body)


def path_svg() -> str:
    body = ""
    for y0, y1, width in ((0.20, 0.34, 0.30), (0.42, 0.56, 0.46), (0.64, 0.80, 0.62)):
        x0 = 0.5 - width / 2
        body += svg_rr(u(x0), u(y0), u(x0 + width), u(y1), 28, WHITE)
    return svg_tile(body)


def plots_svg() -> str:
    gap = 0.08
    cell = (1 - 0.20 * 2 - gap) / 2
    origins = ((0.20, 0.20), (0.20 + cell + gap, 0.20), (0.20, 0.20 + cell + gap), (0.20 + cell + gap, 0.20 + cell + gap))
    fills = (WHITE, WHITE, BAR_DIM, WHITE)
    body = ""
    for (x, y), fill in zip(origins, fills):
        body += svg_rr(u(x), u(y), u(x + cell), u(y + cell), 36, fill)
    return svg_tile(body)


def save(image: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, "PNG", optimize=True)


def sheet(images: list[tuple[str, str, Image.Image]], plex: Path) -> Image.Image:
    label_font = plex_font(plex, 36)
    title_font = plex_font(plex, 28)
    cell = 420
    pad = 48
    cols = 5
    width = pad + cols * (cell + pad)
    height = pad + 72 + cell + 28 + 64 + pad + 80
    image = Image.new("RGBA", (width, height), CREAM)
    draw = ImageDraw.Draw(image)
    draw.text((pad, 36), "Field School square options", font=title_font, fill=INK)
    for i, (key, name, mark) in enumerate(images):
        x = pad + i * (cell + pad)
        y = 108
        thumb = mark.resize((cell, cell), Image.Resampling.LANCZOS)
        image.paste(thumb, (x, y))
        chip = mark.resize((48, 48), Image.Resampling.LANCZOS)
        image.paste(chip, (x, y + cell + 20))
        draw.text((x + 64, y + cell + 28), f"{i + 1}  {name}", font=label_font, fill=INK)
        draw.text((x + 64, y + cell + 72), key, font=title_font, fill="#5c5850")
    return image


def build() -> None:
    fraunces, plex = fonts()
    OUT.mkdir(parents=True, exist_ok=True)
    marks = [
        ("journal", "Journal", journal(), journal_svg()),
        ("f", "F", letter_f(), letter_f_svg()),
        ("path", "Path", path(), path_svg()),
        ("plots", "Plots", plots(), plots_svg()),
        ("fs", "FS", monogram(fraunces), None),
    ]
    for key, _name, image, svg in marks:
        save(image, OUT / f"{key}-1024.png")
        save(image.resize((256, 256), Image.Resampling.LANCZOS), OUT / f"{key}-256.png")
        save(image.resize((64, 64), Image.Resampling.LANCZOS), OUT / f"{key}-64.png")
        if svg:
            (OUT / f"{key}.svg").write_text(svg)
    save(sheet([(k, n, im) for k, n, im, _ in marks], plex), OUT / "sheet.png")
    if ART.exists():
        save(sheet([(k, n, im) for k, n, im, _ in marks], plex), ART / "fieldschool_mark_options_sheet.png")
        for key, _name, image, _svg in marks:
            save(image, ART / f"fieldschool_mark_option_{key}.png")


if __name__ == "__main__":
    build()
