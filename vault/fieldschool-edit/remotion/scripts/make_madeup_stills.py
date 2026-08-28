#!/usr/bin/env python3
"""Paper cards for Everything Is Made Up. Type only. Photos are copied separately."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

PAPER = (239, 231, 214, 255)
INK = (26, 26, 22, 255)
GOLD = (196, 163, 90, 255)
WINE = (139, 58, 42, 255)
OLIVE = (107, 127, 79, 255)

DEST = Path(__file__).resolve().parents[1] / "public" / "episodes" / "everything-made-up" / "stills"
FONT = Path("/tmp/madeup-fonts/Fraunces-700.ttf")
UI = Path("/tmp/madeup-fonts/IBMPlexSans-SemiBold.ttf")


def face(path: Path, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(path), size=size)


def card(w: int, h: int) -> tuple[Image.Image, ImageDraw.ImageDraw]:
    im = Image.new("RGBA", (w, h), PAPER)
    draw = ImageDraw.Draw(im)
    draw.rectangle((18, 18, w - 19, h - 19), outline=INK, width=6)
    return im, draw


def centered(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont, y: int, fill: tuple[int, ...], w: int) -> None:
    box = draw.textbbox((0, 0), text, font=font)
    tw = box[2] - box[0]
    draw.text(((w - tw) / 2, y), text, font=font, fill=fill)


def stacked(path: Path, lines: list[tuple[str, int, tuple[int, ...]]], sub: str | None = None) -> None:
    w, h = 1200, 800
    im, draw = card(w, h)
    display = face(FONT, 92)
    y = 220 if len(lines) == 1 else 160
    for text, size, color in lines:
        f = face(FONT, size)
        centered(draw, text, f, y, color, w)
        y += size + 18
    if sub:
        ui = face(UI, 28)
        centered(draw, sub, ui, h - 120, OLIVE, w)
    DEST.mkdir(parents=True, exist_ok=True)
    im.save(path)
    print(path)


def main() -> None:
    DEST.mkdir(parents=True, exist_ok=True)
    stacked(DEST / "given.png", [("GIVEN", 140, INK)], "WATER  GRAVITY  GOD")
    stacked(DEST / "authored.png", [("AUTHORED", 120, INK)], "A PERSON WROTE IT")
    questions = [
        ("q1.png", "Q1", "WHY DID THEY MAKE IT UP"),
        ("q2.png", "Q2", "WHAT STARTED IT"),
        ("q3.png", "Q3", "WHAT WENT IN AND WHAT GOT LEFT OUT"),
        ("q4.png", "Q4", "IS THIS STILL THE BEST WAY"),
        ("q5.png", "Q5", "KEEP THE GOOD. DROP THE DRAG"),
    ]
    for name, num, line in questions:
        stacked(DEST / name, [(num, 180, GOLD), (line, 36, INK)])
    stacked(DEST / "sixty.png", [("60", 280, INK), ("DAYS", 90, WINE)])
    stacked(DEST / "refuse-1.png", [("REFUSE", 90, WINE), ("TO BE INTIMIDATED", 48, INK)])
    stacked(DEST / "refuse-2.png", [("REFUSE", 90, WINE), ("TO WRECK IT FIRST", 48, INK)])
    stacked(DEST / "guarantee.png", [("GUARANTEE", 96, INK)], "SAME REASON. FASTER PATH.")

    w, h = 1400, 1100
    im, draw = card(w, h)
    title = face(FONT, 48)
    body = face(FONT, 36)
    draw.text((80, 80), "ASK", font=title, fill=GOLD)
    lines = [
        "Why did they make it up?",
        "What started it?",
        "What went in, and what got left out?",
        "Is this still the best way?",
        "What keeps the good and cuts the wait?",
    ]
    y = 200
    for line in lines:
        draw.text((80, y), line, font=body, fill=INK)
        y += 140
    im.save(DEST / "list.png")
    print(DEST / "list.png")


if __name__ == "__main__":
    main()
