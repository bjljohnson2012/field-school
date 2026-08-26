#!/usr/bin/env python3
"""Build the Field School logo set from the blue field-note mark."""

from __future__ import annotations

import shutil
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib.mutator import instantiateVariableFont

ROOT = Path(__file__).resolve().parents[1]
BRAND = ROOT / "marketing-site" / "brand"
PNG = BRAND / "png"
PUBLIC_BRAND = ROOT / "public" / "brand"
FONT_CACHE = Path("/tmp/fs-fonts")
FRAUNCES_URL = (
    "https://github.com/google/fonts/raw/main/ofl/fraunces/"
    "Fraunces%5BSOFT%2CWONK%2Copsz%2Cwght%5D.ttf"
)
PLEX_URL = (
    "https://github.com/google/fonts/raw/main/ofl/ibmplexsans/"
    "IBMPlexSans%5Bwdth%2Cwght%5D.ttf"
)

BLUE = "#1f5eff"
CREAM = "#f6f3ec"
INK = "#1a1916"
WHITE = "#ffffff"
BAR_DIM = "#d7e3ff"
WORD = "Field School"
TAGLINE = "Lead yourself. Learn yourself. Do the Work."
SITE = "fieldschool.ai"
MUTED = "#5c5850"

# Card mark in a 40x32 space. Two bars read as a field note.
MARK_W, MARK_H = 40, 32


def ensure_fonts() -> tuple[Path, Path]:
    FONT_CACHE.mkdir(parents=True, exist_ok=True)
    fraunces = FONT_CACHE / "Fraunces-wght.ttf"
    plex = FONT_CACHE / "IBMPlexSans.ttf"
    if not fraunces.exists():
        urllib.request.urlretrieve(FRAUNCES_URL, fraunces)
    if not plex.exists():
        urllib.request.urlretrieve(PLEX_URL, plex)
    return fraunces, plex


def load_fraunces(path: Path):
    return instantiateVariableFont(
        TTFont(path),
        {"opsz": 144, "wght": 600, "SOFT": 0, "WONK": 0},
    )


def load_plex(path: Path):
    tt = TTFont(path)
    if "fvar" in tt:
        return instantiateVariableFont(tt, {"wght": 500, "wdth": 100})
    return tt


def text_paths(tt: TTFont, text: str, size: float, x: float, y: float):
    glyph_set = tt.getGlyphSet()
    cmap = tt.getBestCmap()
    scale = size / tt["head"].unitsPerEm
    commands = []
    cursor = x
    for char in text:
        name = cmap.get(ord(char))
        if not name:
            continue
        pen = SVGPathPen(glyph_set)
        tpen = TransformPen(pen, (scale, 0, 0, -scale, cursor, y))
        glyph_set[name].draw(tpen)
        commands.append(pen.getCommands())
        cursor += glyph_set[name].width * scale
    return commands, cursor - x


def text_width(tt: TTFont, text: str, size: float) -> float:
    _, width = text_paths(tt, text, size, 0, 0)
    return width


def svg_doc(width: int, height: int, body: str, bg: str | None = None) -> str:
    backdrop = (
        f'<rect width="{width}" height="{height}" fill="{bg}"/>' if bg else ""
    )
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" '
        f'width="{width}" height="{height}" fill="none">'
        f"{backdrop}{body}</svg>\n"
    )


def mark_svg(fill: str, bar: str, bar_dim: str, x=0, y=0, scale=1.0) -> str:
    def n(v: float) -> str:
        return f"{v:.2f}".rstrip("0").rstrip(".")

    w, h = MARK_W * scale, MARK_H * scale
    r = 8 * scale
    return (
        f'<rect x="{n(x)}" y="{n(y)}" width="{n(w)}" height="{n(h)}" rx="{n(r)}" fill="{fill}"/>'
        f'<rect x="{n(x + 7 * scale)}" y="{n(y + 8 * scale)}" width="{n(26 * scale)}" '
        f'height="{n(5 * scale)}" rx="{n(2.5 * scale)}" fill="{bar}"/>'
        f'<rect x="{n(x + 7 * scale)}" y="{n(y + 18 * scale)}" width="{n(16 * scale)}" '
        f'height="{n(3.5 * scale)}" rx="{n(1.75 * scale)}" fill="{bar_dim}"/>'
    )


def paths_svg(commands: list[str], fill: str) -> str:
    return "".join(f'<path d="{d}" fill="{fill}"/>' for d in commands)


def write(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text)


def rounded_rect(draw: ImageDraw.ImageDraw, box, radius: float, fill: str) -> None:
    draw.rounded_rectangle(box, radius=max(1, radius), fill=fill)


def paint_mark(draw: ImageDraw.ImageDraw, x: float, y: float, scale: float, fill: str, bar: str, bar_dim: str) -> None:
    rounded_rect(draw, (x, y, x + MARK_W * scale, y + MARK_H * scale), 8 * scale, fill)
    rounded_rect(
        draw,
        (x + 7 * scale, y + 8 * scale, x + 33 * scale, y + 13 * scale),
        2.5 * scale,
        bar,
    )
    rounded_rect(
        draw,
        (x + 7 * scale, y + 18 * scale, x + 23 * scale, y + 21.5 * scale),
        1.75 * scale,
        bar_dim,
    )


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


def save_png(image: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, "PNG", optimize=True)


def raster_mark(size: int, fill: str, bar: str, bar_dim: str, bg: str | None) -> Image.Image:
    scale = size / MARK_W
    height = max(1, round(MARK_H * scale))
    image = Image.new("RGBA", (size, height), (0, 0, 0, 0) if bg is None else bg)
    paint_mark(ImageDraw.Draw(image), 0, 0, scale, fill, bar, bar_dim)
    return image


def raster_icon(size: int, bg: str, fill: str, bar: str, bar_dim: str) -> Image.Image:
    image = Image.new("RGBA", (size, size), bg)
    pad = size * 0.18
    scale = (size - pad * 2) / MARK_W
    x = (size - MARK_W * scale) / 2
    y = (size - MARK_H * scale) / 2
    paint_mark(ImageDraw.Draw(image), x, y, scale, fill, bar, bar_dim)
    return image


def build() -> None:
    if WORD != "Field School":
        raise SystemExit("Wordmark must stay Field School")

    fraunces_path, plex_path = ensure_fonts()
    fraunces = load_fraunces(fraunces_path)
    plex = load_plex(plex_path)

    brand_page = (BRAND / "index.html").read_text() if (BRAND / "index.html").exists() else None
    options_keep = Path("/tmp/fs-brand-options")
    if options_keep.exists():
        shutil.rmtree(options_keep)
    if (BRAND / "options").exists():
        shutil.copytree(BRAND / "options", options_keep)
    if BRAND.exists():
        shutil.rmtree(BRAND)
    PNG.mkdir(parents=True)
    if options_keep.exists():
        shutil.copytree(options_keep, BRAND / "options")

    # Transparent marks
    write(BRAND / "mark-color.svg", svg_doc(MARK_W, MARK_H, mark_svg(BLUE, WHITE, BAR_DIM)))
    write(BRAND / "mark-black.svg", svg_doc(MARK_W, MARK_H, mark_svg(INK, WHITE, "#c8c4bb")))
    write(BRAND / "mark-white.svg", svg_doc(MARK_W, MARK_H, mark_svg(WHITE, BLUE, "#9db4ff")))

    # Square icons
    write(
        BRAND / "icon-color.svg",
        svg_doc(32, 32, mark_svg(BLUE, WHITE, BAR_DIM, 6, 8, 0.5), CREAM),
    )
    write(
        BRAND / "icon-blue.svg",
        svg_doc(32, 32, mark_svg(WHITE, BLUE, "#9db4ff", 6, 8, 0.5), BLUE),
    )
    write(
        BRAND / "icon-ink.svg",
        svg_doc(32, 32, mark_svg(WHITE, INK, "#c8c4bb", 6, 8, 0.5), INK),
    )
    write(
        BRAND / "icon-cream.svg",
        svg_doc(32, 32, mark_svg(BLUE, WHITE, BAR_DIM, 6, 8, 0.5), CREAM),
    )

    # Wide lockups
    word_size = 28
    mark_scale = 1.15
    mark_draw_w = MARK_W * mark_scale
    mark_draw_h = MARK_H * mark_scale
    gap = 16
    word_cmds, word_w = text_paths(fraunces, WORD, word_size, 0, 0)
    lockup_w = int(round(mark_draw_w + gap + word_w + 8))
    lockup_h = 56
    mark_y = (lockup_h - mark_draw_h) / 2
    word_x = mark_draw_w + gap
    word_y = lockup_h / 2 + word_size * 0.36

    def lockup_body(fill: str, bar: str, bar_dim: str, text_fill: str) -> str:
        cmds, _ = text_paths(fraunces, WORD, word_size, word_x, word_y)
        return mark_svg(fill, bar, bar_dim, 0, mark_y, mark_scale) + paths_svg(cmds, text_fill)

    write(BRAND / "lockup-wide-color.svg", svg_doc(lockup_w, lockup_h, lockup_body(BLUE, WHITE, BAR_DIM, INK)))
    write(BRAND / "lockup-wide-black.svg", svg_doc(lockup_w, lockup_h, lockup_body(INK, WHITE, "#c8c4bb", INK)))
    write(BRAND / "lockup-wide-white.svg", svg_doc(lockup_w, lockup_h, lockup_body(WHITE, BLUE, "#9db4ff", WHITE)))

    # Stacked lockups
    stack_word = 26
    stack_cmds, stack_w = text_paths(fraunces, WORD, stack_word, 0, 0)
    stack_mark = 1.6
    stack_w_px = int(round(max(MARK_W * stack_mark, stack_w) + 16))
    stack_h_px = 110
    stack_mark_x = (stack_w_px - MARK_W * stack_mark) / 2
    stack_word_x = (stack_w_px - stack_w) / 2

    def stacked_body(fill: str, bar: str, bar_dim: str, text_fill: str) -> str:
        cmds, _ = text_paths(fraunces, WORD, stack_word, stack_word_x, 96)
        return mark_svg(fill, bar, bar_dim, stack_mark_x, 10, stack_mark) + paths_svg(cmds, text_fill)

    write(BRAND / "lockup-stacked-color.svg", svg_doc(stack_w_px, stack_h_px, stacked_body(BLUE, WHITE, BAR_DIM, INK)))
    write(BRAND / "lockup-stacked-black.svg", svg_doc(stack_w_px, stack_h_px, stacked_body(INK, WHITE, "#c8c4bb", INK)))
    write(BRAND / "lockup-stacked-white.svg", svg_doc(stack_w_px, stack_h_px, stacked_body(WHITE, BLUE, "#9db4ff", WHITE)))

    # Wordmarks
    wm_cmds, wm_w = text_paths(fraunces, WORD, 36, 4, 34)
    wm_w_px = int(round(wm_w + 12))
    write(BRAND / "wordmark-color.svg", svg_doc(wm_w_px, 48, paths_svg(wm_cmds, INK)))
    write(BRAND / "wordmark-black.svg", svg_doc(wm_w_px, 48, paths_svg(text_paths(fraunces, WORD, 36, 4, 34)[0], INK)))
    write(BRAND / "wordmark-white.svg", svg_doc(wm_w_px, 48, paths_svg(text_paths(fraunces, WORD, 36, 4, 34)[0], WHITE)))
    write(BRAND / "wordmark-blue.svg", svg_doc(wm_w_px, 48, paths_svg(text_paths(fraunces, WORD, 36, 4, 34)[0], BLUE)))

    slogan_cmds, slogan_w = text_paths(fraunces, TAGLINE, 14, 4, 28)
    write(BRAND / "slogan-color.svg", svg_doc(int(round(slogan_w + 12)), 40, paths_svg(slogan_cmds, INK)))
    write(
        BRAND / "slogan-white.svg",
        svg_doc(int(round(slogan_w + 12)), 40, paths_svg(text_paths(fraunces, TAGLINE, 14, 4, 28)[0], WHITE)),
    )

    slogan_lockup_w = int(round(max(lockup_w, slogan_w + word_x) + 8))
    slogan_lockup_h = 86
    slogan_line_cmds, _ = text_paths(fraunces, TAGLINE, 12, word_x, 74)
    write(
        BRAND / "lockup-wide-slogan.svg",
        svg_doc(
            slogan_lockup_w,
            slogan_lockup_h,
            lockup_body(BLUE, WHITE, BAR_DIM, INK) + paths_svg(slogan_line_cmds, MUTED),
        ),
    )

    # Social avatar SVG
    write(
        BRAND / "social-avatar.svg",
        svg_doc(1080, 1080, mark_svg(BLUE, WHITE, BAR_DIM, 246, 300, 14.7), CREAM),
    )
    write(
        BRAND / "social-avatar-blue.svg",
        svg_doc(1080, 1080, mark_svg(WHITE, BLUE, "#9db4ff", 246, 300, 14.7), BLUE),
    )

    # Favicon (same geometry as icon-color). ICO wins in Chrome if it is stale.
    favicon = svg_doc(32, 32, mark_svg(BLUE, WHITE, BAR_DIM, 6, 8, 0.5), CREAM)
    write(ROOT / "public" / "favicon.svg", favicon)
    write(ROOT / "marketing-site" / "favicon.svg", favicon)
    ico_src = raster_icon(256, CREAM, BLUE, WHITE, BAR_DIM)
    for dest in (
        ROOT / "src" / "app" / "favicon.ico",
        ROOT / "public" / "favicon.ico",
        ROOT / "marketing-site" / "favicon.ico",
    ):
        dest.parent.mkdir(parents=True, exist_ok=True)
        ico_src.save(dest, format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])

    # Raster marks. Large masters first. Standard sizes come from those.
    for size in (512, 1024, 2048, 4096):
        save_png(raster_mark(size, BLUE, WHITE, BAR_DIM, None), PNG / f"mark-color-{size}.png")
        save_png(raster_mark(size, INK, WHITE, "#c8c4bb", None), PNG / f"mark-black-{size}.png")
        save_png(raster_mark(size, WHITE, BLUE, "#9db4ff", None), PNG / f"mark-white-{size}.png")

    for size in (512, 1024, 2048, 4096):
        save_png(raster_icon(size, CREAM, BLUE, WHITE, BAR_DIM), PNG / f"icon-color-{size}.png")
        save_png(raster_icon(size, BLUE, WHITE, BLUE, "#9db4ff"), PNG / f"icon-blue-{size}.png")
        save_png(raster_icon(size, INK, WHITE, INK, "#c8c4bb"), PNG / f"icon-ink-{size}.png")

    save_png(raster_icon(180, CREAM, BLUE, WHITE, BAR_DIM), PNG / "apple-touch-180.png")
    save_png(raster_icon(32, CREAM, BLUE, WHITE, BAR_DIM), PNG / "favicon-32.png")
    save_png(raster_icon(2048, CREAM, BLUE, WHITE, BAR_DIM), PNG / "social-avatar-2048.png")
    save_png(raster_icon(2048, BLUE, WHITE, BLUE, "#9db4ff"), PNG / "social-avatar-blue-2048.png")
    save_png(raster_icon(2048, INK, WHITE, INK, "#c8c4bb"), PNG / "social-avatar-ink-2048.png")
    save_png(
        raster_icon(2048, CREAM, BLUE, WHITE, BAR_DIM).resize((1080, 1080), Image.Resampling.LANCZOS),
        PNG / "social-avatar-1080.png",
    )
    save_png(
        raster_icon(2048, BLUE, WHITE, BLUE, "#9db4ff").resize((1080, 1080), Image.Resampling.LANCZOS),
        PNG / "social-avatar-blue-1080.png",
    )
    save_png(
        raster_icon(2048, INK, WHITE, INK, "#c8c4bb").resize((1080, 1080), Image.Resampling.LANCZOS),
        PNG / "social-avatar-ink-1080.png",
    )

    def paint_wide(bg: str | None, fill: str, bar: str, bar_dim: str, text: str, pad=160, with_slogan=False) -> Image.Image:
        font = fraunces_font(fraunces_path, 280)
        dummy = Image.new("RGBA", (4, 4), (0, 0, 0, 0))
        box = ImageDraw.Draw(dummy).textbbox((0, 0), WORD, font=font)
        tw, th = box[2] - box[0], box[3] - box[1]
        slogan_font = fraunces_font(fraunces_path, 72)
        sbox = ImageDraw.Draw(dummy).textbbox((0, 0), TAGLINE, font=slogan_font)
        sw, sh = sbox[2] - sbox[0], sbox[3] - sbox[1]
        mark_h = 360
        mark_scale_px = mark_h / MARK_H
        mark_w = MARK_W * mark_scale_px
        gap = 112
        width = int(pad * 2 + max(mark_w + gap + tw, sw if with_slogan else 0))
        height = int(pad * 2 + max(mark_h, th) + (sh + 48 if with_slogan else 0))
        image = Image.new("RGBA", (width, height), (0, 0, 0, 0) if bg is None else bg)
        draw = ImageDraw.Draw(image)
        mx, my = pad, pad + ((max(mark_h, th) - mark_h) / 2)
        paint_mark(draw, mx, my, mark_scale_px, fill, bar, bar_dim)
        tx = mx + mark_w + gap - box[0]
        ty = pad + ((max(mark_h, th) - th) / 2) - box[1]
        draw.text((tx, ty), WORD, font=font, fill=text)
        if with_slogan:
            slogan_fill = WHITE if text == WHITE else MUTED
            draw.text((tx - sbox[0], pad + max(mark_h, th) + 48 - sbox[1]), TAGLINE, font=slogan_font, fill=slogan_fill)
        return image

    save_png(paint_wide(None, BLUE, WHITE, BAR_DIM, INK), PNG / "lockup-wide-color.png")
    save_png(paint_wide(CREAM, BLUE, WHITE, BAR_DIM, INK, 128), PNG / "lockup-wide-color-cream.png")
    save_png(paint_wide(None, INK, WHITE, "#c8c4bb", INK), PNG / "lockup-wide-black.png")
    save_png(paint_wide(INK, WHITE, BLUE, "#9db4ff", WHITE, 128), PNG / "lockup-wide-white-on-ink.png")
    save_png(paint_wide(BLUE, WHITE, BLUE, "#9db4ff", WHITE, 128), PNG / "lockup-wide-white-on-blue.png")
    save_png(paint_wide(None, BLUE, WHITE, BAR_DIM, INK, 160, True), PNG / "lockup-wide-slogan.png")
    save_png(paint_wide(CREAM, BLUE, WHITE, BAR_DIM, INK, 128, True), PNG / "lockup-wide-slogan-cream.png")
    save_png(paint_wide(INK, WHITE, BLUE, "#9db4ff", WHITE, 128, True), PNG / "lockup-wide-slogan-ink.png")

    def paint_stacked(bg: str | None, fill: str, bar: str, bar_dim: str, text: str, with_slogan=False) -> Image.Image:
        font = fraunces_font(fraunces_path, 220)
        dummy = Image.new("RGBA", (4, 4), (0, 0, 0, 0))
        box = ImageDraw.Draw(dummy).textbbox((0, 0), WORD, font=font)
        tw, th = box[2] - box[0], box[3] - box[1]
        slogan_font = fraunces_font(fraunces_path, 64)
        sbox = ImageDraw.Draw(dummy).textbbox((0, 0), TAGLINE, font=slogan_font)
        sw, sh = sbox[2] - sbox[0], sbox[3] - sbox[1]
        mark_h = 420
        mark_scale_px = mark_h / MARK_H
        mark_w = MARK_W * mark_scale_px
        width = int(max(mark_w, tw, sw if with_slogan else 0) + 240)
        height = int(200 + mark_h + 80 + th + (sh + 40 if with_slogan else 0))
        image = Image.new("RGBA", (width, height), (0, 0, 0, 0) if bg is None else bg)
        draw = ImageDraw.Draw(image)
        paint_mark(draw, (width - mark_w) / 2, 120, mark_scale_px, fill, bar, bar_dim)
        draw.text(((width - tw) / 2 - box[0], 120 + mark_h + 80 - box[1]), WORD, font=font, fill=text)
        if with_slogan:
            slogan_fill = WHITE if text == WHITE else MUTED
            draw.text(((width - sw) / 2 - sbox[0], 120 + mark_h + 80 + th + 40 - sbox[1]), TAGLINE, font=slogan_font, fill=slogan_fill)
        return image

    save_png(paint_stacked(None, BLUE, WHITE, BAR_DIM, INK), PNG / "lockup-stacked-color.png")
    save_png(paint_stacked(CREAM, BLUE, WHITE, BAR_DIM, INK), PNG / "lockup-stacked-color-cream.png")
    save_png(paint_stacked(None, INK, WHITE, "#c8c4bb", INK), PNG / "lockup-stacked-black.png")
    save_png(paint_stacked(INK, WHITE, BLUE, "#9db4ff", WHITE), PNG / "lockup-stacked-white-on-ink.png")
    save_png(paint_stacked(CREAM, BLUE, WHITE, BAR_DIM, INK, True), PNG / "lockup-stacked-slogan-cream.png")

    def paint_wordmark(bg: str | None, fill: str, copy: str = WORD, size: int = 320) -> Image.Image:
        font = fraunces_font(fraunces_path, size)
        dummy = Image.new("RGBA", (4, 4), (0, 0, 0, 0))
        box = ImageDraw.Draw(dummy).textbbox((0, 0), copy, font=font)
        image = Image.new(
            "RGBA",
            (int(box[2] - box[0] + 160), int(box[3] - box[1] + 160)),
            (0, 0, 0, 0) if bg is None else bg,
        )
        ImageDraw.Draw(image).text((80 - box[0], 80 - box[1]), copy, font=font, fill=fill)
        return image

    save_png(paint_wordmark(None, INK), PNG / "wordmark-color.png")
    save_png(paint_wordmark(None, BLUE), PNG / "wordmark-blue.png")
    save_png(paint_wordmark(None, WHITE), PNG / "wordmark-white.png")
    save_png(paint_wordmark(CREAM, INK), PNG / "wordmark-color-cream.png")
    save_png(paint_wordmark(None, INK, TAGLINE, 120), PNG / "slogan-color.png")
    save_png(paint_wordmark(CREAM, INK, TAGLINE, 120), PNG / "slogan-color-cream.png")
    save_png(paint_wordmark(INK, WHITE, TAGLINE, 120), PNG / "slogan-white-on-ink.png")

    def social_named(bg: str, fill: str, bar: str, bar_dim: str, text: str, path: Path, size=2048) -> None:
        image = Image.new("RGBA", (size, size), bg)
        draw = ImageDraw.Draw(image)
        mark_h = int(size * 0.28)
        scale = mark_h / MARK_H
        mark_w = MARK_W * scale
        paint_mark(draw, (size - mark_w) / 2, size * 0.24, scale, fill, bar, bar_dim)
        font = fraunces_font(fraunces_path, int(size * 0.07))
        box = draw.textbbox((0, 0), WORD, font=font)
        draw.text(((size - (box[2] - box[0])) / 2 - box[0], size * 0.58 - box[1]), WORD, font=font, fill=text)
        slogan_font = fraunces_font(fraunces_path, int(size * 0.028))
        sbox = draw.textbbox((0, 0), TAGLINE, font=slogan_font)
        slogan_fill = WHITE if text == WHITE else MUTED
        draw.text(((size - (sbox[2] - sbox[0])) / 2 - sbox[0], size * 0.68 - sbox[1]), TAGLINE, font=slogan_font, fill=slogan_fill)
        save_png(image, path)

    social_named(CREAM, BLUE, WHITE, BAR_DIM, INK, PNG / "social-square-color.png")
    social_named(BLUE, WHITE, BLUE, "#9db4ff", WHITE, PNG / "social-square-blue.png")
    social_named(INK, WHITE, INK, "#c8c4bb", WHITE, PNG / "social-square-ink.png")
    for name in ("social-square-color", "social-square-blue", "social-square-ink"):
        Image.open(PNG / f"{name}.png").resize((1080, 1080), Image.Resampling.LANCZOS).save(
            PNG / f"{name}-1080.png", "PNG", optimize=True
        )

    def banner(width: int, height: int, path: Path, align="center") -> None:
        image = Image.new("RGBA", (width, height), CREAM)
        draw = ImageDraw.Draw(image)
        mark_h = int(height * 0.22)
        scale = mark_h / MARK_H
        mark_w = MARK_W * scale
        font = fraunces_font(fraunces_path, int(height * 0.16))
        box = draw.textbbox((0, 0), WORD, font=font)
        tw, th = box[2] - box[0], box[3] - box[1]
        block_w = mark_w + int(width * 0.03) + tw
        x0 = int(width * 0.07) if align == "left" else (width - block_w) / 2
        y0 = (height - mark_h) / 2 - height * 0.04
        paint_mark(draw, x0, y0, scale, BLUE, WHITE, BAR_DIM)
        draw.text((x0 + mark_w + width * 0.03 - box[0], y0 + (mark_h - th) / 2 - box[1]), WORD, font=font, fill=INK)
        small = fraunces_font(fraunces_path, max(28, int(height * 0.045)))
        sbox = draw.textbbox((0, 0), TAGLINE, font=small)
        draw.text(((width - (sbox[2] - sbox[0])) / 2 - sbox[0], y0 + mark_h + height * 0.06 - sbox[1]), TAGLINE, font=small, fill=MUTED)
        save_png(image, path)

    banner(2400, 1260, PNG / "og-2400x1260.png")
    banner(2400, 1260, PNG / "og-1200x630.png")
    Image.open(PNG / "og-2400x1260.png").resize((1200, 630), Image.Resampling.LANCZOS).save(
        PNG / "og-1200x630.png", "PNG", optimize=True
    )
    banner(3000, 1000, PNG / "x-banner-3000x1000.png", align="left")
    Image.open(PNG / "x-banner-3000x1000.png").resize((1500, 500), Image.Resampling.LANCZOS).save(
        PNG / "x-banner-1500x500.png", "PNG", optimize=True
    )
    banner(3200, 800, PNG / "banner-wide-3200x800.png", align="left")
    Image.open(PNG / "banner-wide-3200x800.png").resize((1600, 400), Image.Resampling.LANCZOS).save(
        PNG / "banner-wide-1600x400.png", "PNG", optimize=True
    )
    banner(3840, 2160, PNG / "cover-3840x2160.png")
    Image.open(PNG / "cover-3840x2160.png").resize((1920, 1080), Image.Resampling.LANCZOS).save(
        PNG / "cover-1920x1080.png", "PNG", optimize=True
    )

    email = paint_wide(CREAM, BLUE, WHITE, BAR_DIM, INK, 80)
    email = email.resize((1600, round(email.height * 1600 / email.width)), Image.Resampling.LANCZOS)
    save_png(email, PNG / "email-lockup.png")

    # Compat copies used by mail and older paths
    for dest in (ROOT / "marketing-site" / "img", ROOT / "public" / "img"):
        dest.mkdir(parents=True, exist_ok=True)
        shutil.copy2(PNG / "email-lockup.png", dest / "field-school-lockup.png")
        shutil.copy2(PNG / "mark-color-1024.png", dest / "field-school-mark.png")
        shutil.copy2(PNG / "og-2400x1260.png", dest / "og.png")
        shutil.copy2(PNG / "apple-touch-180.png", dest / "apple-touch-icon.png")

    shutil.copy2(PNG / "apple-touch-180.png", ROOT / "public" / "apple-touch-icon.png")
    shutil.copy2(PNG / "og-2400x1260.png", ROOT / "public" / "og.png")

    if PUBLIC_BRAND.exists():
        shutil.rmtree(PUBLIC_BRAND)
    shutil.copytree(BRAND, PUBLIC_BRAND)

    write(BRAND / "index.html", brand_page or preview_html())
    shutil.copy2(BRAND / "index.html", PUBLIC_BRAND / "index.html")
    print(f"wrote {BRAND}")


def preview_html() -> str:
    cards = [
        ("Mark, color, transparent", "mark-color.svg"),
        ("Mark, black, transparent", "mark-black.svg"),
        ("Mark, white, on blue", "mark-white.svg", BLUE),
        ("Square icon, cream", "icon-color.svg"),
        ("Square icon, blue", "icon-blue.svg"),
        ("Square icon, ink", "icon-ink.svg"),
        ("Wide lockup, color", "lockup-wide-color.svg"),
        ("Wide lockup, black", "lockup-wide-black.svg"),
        ("Wide lockup, white", "lockup-wide-white.svg", INK),
        ("Stacked lockup, color", "lockup-stacked-color.svg"),
        ("Wordmark", "wordmark-color.svg"),
        ("Slogan", "slogan-color.svg"),
        ("Wide lockup with slogan", "lockup-wide-slogan.svg"),
        ("Social avatar", "social-avatar.svg"),
    ]
    items = []
    for card in cards:
        label, src = card[0], card[1]
        bg = card[2] if len(card) > 2 else CREAM
        items.append(
            f'<figure><div class="frame" style="background:{bg}"><img src="{src}" alt="{label}"></div>'
            f"<figcaption>{label}</figcaption></figure>"
        )
    rasters = [
        ("png/lockup-wide-slogan-cream.png", "Wide lockup with slogan"),
        ("png/lockup-stacked-slogan-cream.png", "Stacked lockup with slogan"),
        ("png/social-square-color.png", "Social square 2048"),
        ("png/social-avatar-blue-2048.png", "Social avatar, blue 2048"),
        ("png/og-2400x1260.png", "Open Graph 2400x1260"),
        ("png/x-banner-3000x1000.png", "X / LinkedIn banner"),
        ("png/email-lockup.png", "Email lockup"),
        ("png/cover-3840x2160.png", "Cover 3840x2160"),
    ]
    raster_html = "".join(
        f'<figure class="wide"><div class="frame"><img src="{src}" alt="{label}"></div>'
        f"<figcaption>{label}</figcaption></figure>"
        for src, label in rasters
    )
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Field School logos</title>
  <link rel="icon" href="/brand/icon-color.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&family=IBM+Plex+Sans:wght@400;500&family=IBM+Plex+Mono:wght@400&display=swap" rel="stylesheet">
  <style>
    :root {{ --cream:{CREAM}; --ink:{INK}; --blue:{BLUE}; --border:#d8d2c6; }}
    body {{ margin:0; background:var(--cream); color:var(--ink); font-family:"IBM Plex Sans",Helvetica,Arial,sans-serif; }}
    main {{ width:min(1100px, calc(100% - 2rem)); margin:0 auto; padding:3rem 0 5rem; }}
    h1 {{ font-family:Fraunces,Georgia,serif; font-size:clamp(2rem,5vw,3rem); letter-spacing:-0.03em; margin:0 0 0.5rem; }}
    .lede {{ color:#5c5850; max-width:40rem; }}
    h2 {{ font-family:Fraunces,Georgia,serif; font-size:1.4rem; margin:2.5rem 0 1rem; }}
    .grid {{ display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:1rem; }}
    .grid.wide {{ grid-template-columns:1fr; }}
    figure {{ margin:0; }}
    .frame {{ border:1px solid var(--border); border-radius:12px; min-height:140px; display:grid; place-items:center; padding:1.25rem; }}
    .frame img {{ max-width:100%; max-height:120px; height:auto; }}
        .wide .frame img {{ max-height:420px; }}
    figcaption {{ margin-top:0.5rem; font-size:0.85rem; color:#5c5850; }}
    code {{ font-family:"IBM Plex Mono",ui-monospace,monospace; font-size:0.8rem; }}
    a {{ color:var(--blue); }}
  </style>
</head>
<body>
  <main>
    <p><a href="/">Field School</a></p>
    <h1>Logos</h1>
    <p class="lede">The mark is the blue field note. The name is Field School. Use the square icon for apps and avatars, the wide lockup for headers and mail, and the banners for social. Files live in <code>/brand</code>.</p>
    <h2>SVG</h2>
    <div class="grid">{''.join(items)}</div>
    <h2>PNG</h2>
    <div class="grid wide">{raster_html}</div>
  </main>
</body>
</html>
"""


if __name__ == "__main__":
    build()
