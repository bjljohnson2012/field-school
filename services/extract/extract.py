"""Extract LessonSpec units from supplied text or a local PDF.

One function, ``extract_units``, is the worker. Celery is not imported.
The queue message shape lives in README.md. No Django. No Qdrant. No pages.
"""

from __future__ import annotations

import argparse
import json
import sys
import uuid
import zlib
from pathlib import Path

KINDS = ("text", "pdf", "stt")
# A vertical move of this many points or more becomes a blank line, which
# splits a unit the same way a blank line splits supplied text.
PARAGRAPH_GAP = 18.0


def extract_units(message: dict) -> dict:
    """Turn one queue message into units ``{id, title, source_unit_id}``.

    ``source_unit_id`` equals ``id``. The extracted unit is the source a
    later quiz item must cite. An empty ``source_unit_id`` is never returned.
    """

    if not isinstance(message, dict):
        raise ValueError("message must be an object")

    org_id = _required(message, "org_id")
    _required(message, "membership_id")
    kind = message.get("kind", "text")
    if kind not in KINDS:
        raise ValueError("kind must be text, pdf, or stt")

    text = message.get("text", None)
    pdf_path = message.get("pdf_path", None)
    has_text = text is not None
    has_pdf = pdf_path is not None
    if has_text and has_pdf:
        raise ValueError("pass text or a pdf path, not both")

    if kind == "pdf":
        if not has_pdf:
            raise ValueError("pdf kind needs pdf_path")
        raw = _pdf_to_text(str(pdf_path))
    else:
        if not has_text:
            raise ValueError(f"{kind} kind needs text")
        if not isinstance(text, str):
            raise ValueError("text must be a string")
        raw = text

    return {"org_id": org_id, "units": _units_from_text(raw)}


def _required(message: dict, key: str) -> str:
    value = message.get(key)
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{key} required")
    return value.strip()


def _units_from_text(text: str) -> list[dict]:
    """Blank lines split units. Title is the first line, capped at 80."""

    units = []
    blocks = _blank_line_blocks(text)
    for body in blocks:
        first = body.split("\n", 1)[0].strip()
        if len(first) > 80:
            title = first[:77] + "…"
        else:
            title = first or f"Unit {len(units) + 1}"
        unit_id = str(uuid.uuid4())
        units.append(
            {
                "id": unit_id,
                "title": title,
                "source_unit_id": unit_id,
            }
        )
    return units


def _blank_line_blocks(text: str) -> list[str]:
    blocks: list[str] = []
    current: list[str] = []
    for line in text.replace("\r\n", "\n").replace("\r", "\n").split("\n"):
        if line.strip():
            current.append(line.strip())
        elif current:
            blocks.append("\n".join(current))
            current = []
    if current:
        blocks.append("\n".join(current))
    return blocks


def _pdf_to_text(pdf_path: str) -> str:
    if "://" in pdf_path:
        raise ValueError("pdf_path must be a local file")
    path = Path(pdf_path)
    if not path.is_file():
        raise FileNotFoundError(f"pdf not found: {pdf_path}")
    data = path.read_bytes()
    if not data.startswith(b"%PDF"):
        raise ValueError("pdf_path is not a PDF")

    pieces: list[str] = []
    for header, stream in _iter_streams(data):
        if _skip_stream(header):
            continue
        text = _content_to_text(_decode_stream(header, stream))
        if text.strip():
            pieces.append(text.strip())
    return "\n\n".join(pieces)


def _skip_stream(header: bytes) -> bool:
    if b"/Image" in header or b"DCTDecode" in header or b"JPXDecode" in header:
        return True
    return False


def _iter_streams(data: bytes):
    index = 0
    while True:
        found = data.find(b"stream", index)
        if found < 0:
            return
        if found > 0 and data[found - 1 : found] not in (b" ", b"\n", b"\r", b"\t"):
            index = found + 6
            continue
        start = found + 6
        if start < len(data) and data[start : start + 1] == b"\r":
            start += 1
        if start < len(data) and data[start : start + 1] == b"\n":
            start += 1
        end = data.find(b"endstream", start)
        if end < 0:
            return
        raw = data[start:end]
        if raw.endswith(b"\r\n"):
            raw = raw[:-2]
        elif raw.endswith(b"\n") or raw.endswith(b"\r"):
            raw = raw[:-1]
        header = data[max(0, found - 800) : found]
        yield header, raw
        index = end + len(b"endstream")


def _decode_stream(header: bytes, raw: bytes) -> str:
    if b"FlateDecode" in header or raw.startswith(b"\x78"):
        try:
            raw = zlib.decompress(raw)
        except zlib.error:
            pass
    return raw.decode("latin-1", errors="replace")


def _content_to_text(content: str) -> str:
    assembler = _Assembler()
    index = 0
    length = len(content)
    while index < length:
        char = content[index]
        if char.isspace():
            index += 1
            continue
        if char == "%":
            while index < length and content[index] not in "\r\n":
                index += 1
            continue
        if content.startswith("<<", index):
            index = _skip_dict(content, index)
            continue
        if char == "(":
            literal, index = _read_literal(content, index)
            op, index = _peek_op(content, index)
            if op == "'":
                assembler.break_line(blank=False)
            assembler.add(literal)
            continue
        if char in "'\"":
            if char == "'":
                assembler.break_line(blank=False)
            index += 1
            continue
        if char == "<":
            literal, index = _read_hex(content, index)
            assembler.add(literal)
            continue
        if char == "[":
            literal, index = _read_tj_array(content, index)
            assembler.add(literal)
            _peek_op(content, index)
            continue
        if char in "-+.0123456789":
            index = _take_position(content, index, assembler)
            continue
        if char == "/":
            index = _skip_name(content, index)
            continue
        word, index = _read_word(content, index)
        if word == "T*":
            assembler.break_line(blank=False)
        elif not word:
            index += 1
    return assembler.finish()


class _Assembler:
    def __init__(self) -> None:
        self._parts: list[str] = []
        self._lines: list[str] = []

    def add(self, text: str) -> None:
        if not text:
            return
        normalized = text.replace("\r\n", "\n").replace("\r", "\n")
        chunks = normalized.split("\n")
        for offset, chunk in enumerate(chunks):
            if offset:
                self.break_line(blank=False)
            self._parts.append(chunk)

    def break_line(self, blank: bool) -> None:
        line = "".join(self._parts).strip()
        self._parts = []
        if line:
            self._lines.append(line)
        if blank and (not self._lines or self._lines[-1] != ""):
            self._lines.append("")

    def finish(self) -> str:
        self.break_line(blank=False)
        while self._lines and self._lines[-1] == "":
            self._lines.pop()
        while self._lines and self._lines[0] == "":
            self._lines.pop(0)
        return "\n".join(self._lines)


def _take_position(content: str, index: int, assembler: _Assembler) -> int:
    numbers: list[float] = []
    while True:
        while index < len(content) and content[index].isspace():
            index += 1
        number, next_index = _read_number(content, index)
        if number is None:
            break
        numbers.append(number)
        index = next_index
    while index < len(content) and content[index].isspace():
        index += 1
    word, index = _read_word(content, index)
    if word in ("Td", "TD") and len(numbers) >= 2:
        dy = numbers[-1]
        if abs(dy) >= PARAGRAPH_GAP:
            assembler.break_line(blank=True)
        elif dy != 0:
            assembler.break_line(blank=False)
        elif numbers[-2] != 0 and assembler._parts:
            assembler._parts.append(" ")
    return index


def _peek_op(content: str, index: int) -> tuple[str, int]:
    probe = index
    while probe < len(content) and content[probe].isspace():
        probe += 1
    if probe < len(content) and content[probe] in "'\"":
        return content[probe], probe + 1
    word, after = _read_word(content, probe)
    if word in ("Tj", "TJ"):
        return word, after
    return "", index


def _read_word(content: str, index: int) -> tuple[str, int]:
    start = index
    while index < len(content) and (content[index].isalpha() or content[index] == "*"):
        index += 1
    return content[start:index], index


def _read_number(content: str, index: int) -> tuple[float | None, int]:
    start = index
    if index < len(content) and content[index] in "+-":
        index += 1
    saw_digit = False
    saw_dot = False
    while index < len(content) and (content[index].isdigit() or content[index] == "."):
        if content[index] == ".":
            if saw_dot:
                break
            saw_dot = True
        else:
            saw_digit = True
        index += 1
    if not saw_digit:
        return None, start
    try:
        return float(content[start:index]), index
    except ValueError:
        return None, start


def _read_literal(content: str, index: int) -> tuple[str, int]:
    index += 1
    chars: list[str] = []
    depth = 1
    while index < len(content) and depth:
        char = content[index]
        if char == "\\":
            index += 1
            if index >= len(content):
                break
            escaped = content[index]
            named = {"n": "\n", "r": "\r", "t": "\t", "b": "\b", "f": "\f", "(": "(", ")": ")", "\\": "\\"}
            if escaped in named:
                chars.append(named[escaped])
                index += 1
            elif escaped.isdigit():
                octal = escaped
                index += 1
                for _ in range(2):
                    if index < len(content) and content[index].isdigit():
                        octal += content[index]
                        index += 1
                    else:
                        break
                chars.append(chr(int(octal, 8)))
            else:
                chars.append(escaped)
                index += 1
            continue
        if char == "(":
            depth += 1
            chars.append("(")
            index += 1
            continue
        if char == ")":
            depth -= 1
            if depth:
                chars.append(")")
            index += 1
            continue
        chars.append(char)
        index += 1
    return "".join(chars), index


def _read_hex(content: str, index: int) -> tuple[str, int]:
    end = content.find(">", index + 1)
    if end < 0:
        return "", len(content)
    body = "".join(content[index + 1 : end].split())
    if len(body) % 2:
        body += "0"
    try:
        raw = bytes.fromhex(body)
    except ValueError:
        raw = b""
    if raw.startswith(b"\xfe\xff"):
        return raw[2:].decode("utf-16-be", errors="replace"), end + 1
    if raw.startswith(b"\xff\xfe"):
        return raw[2:].decode("utf-16-le", errors="replace"), end + 1
    return raw.decode("latin-1", errors="replace"), end + 1


def _read_tj_array(content: str, index: int) -> tuple[str, int]:
    index += 1
    parts: list[str] = []
    while index < len(content):
        while index < len(content) and content[index].isspace():
            index += 1
        if index >= len(content):
            break
        if content[index] == "]":
            return "".join(parts), index + 1
        if content[index] == "(":
            literal, index = _read_literal(content, index)
            parts.append(literal)
            continue
        if content[index] == "<":
            literal, index = _read_hex(content, index)
            parts.append(literal)
            continue
        number, next_index = _read_number(content, index)
        if number is not None:
            if number < -150 and parts and not parts[-1].endswith(" "):
                parts.append(" ")
            index = next_index
            continue
        index += 1
    return "".join(parts), index


def _skip_dict(content: str, index: int) -> int:
    depth = 0
    while index < len(content):
        if content.startswith("<<", index):
            depth += 1
            index += 2
        elif content.startswith(">>", index):
            depth -= 1
            index += 2
            if depth == 0:
                return index
        else:
            index += 1
    return index


def _skip_name(content: str, index: int) -> int:
    index += 1
    while index < len(content) and content[index] not in " \t\r\n\f\v()<>[]{}/%":
        index += 1
    return index


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Extract units from supplied text, an STT transcript, or a local PDF."
    )
    parser.add_argument("--org-id", required=True)
    parser.add_argument("--membership-id", required=True)
    parser.add_argument("--kind", choices=KINDS, default="text")
    parser.add_argument("--text", default=None)
    parser.add_argument("--pdf-path", default=None)
    args = parser.parse_args(argv)
    message: dict = {
        "org_id": args.org_id,
        "membership_id": args.membership_id,
        "kind": args.kind,
    }
    if args.text is not None:
        message["text"] = args.text
    if args.pdf_path is not None:
        message["pdf_path"] = args.pdf_path
    try:
        result = extract_units(message)
    except (ValueError, FileNotFoundError) as exc:
        print(str(exc), file=sys.stderr)
        return 2
    json.dump(result, sys.stdout, indent=2)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
