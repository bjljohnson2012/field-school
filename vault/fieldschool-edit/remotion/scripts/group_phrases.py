#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
from pathlib import Path

ENDERS = {".", "?", "!", ",", ";", ":"}


def group(words: list[dict]) -> list[dict]:
    out: list[dict] = []
    bucket: list[dict] = []

    def flush() -> None:
        if not bucket:
            return
        out.append(
            {
                "start": float(bucket[0]["start"]),
                "end": float(bucket[-1]["end"]),
                "words": [
                    {"text": w["text"], "start": float(w["start"]), "end": float(w["end"])}
                    for w in bucket
                ],
            }
        )
        bucket.clear()

    for i, word in enumerate(words):
        bucket.append(word)
        nxt = words[i + 1] if i + 1 < len(words) else None
        gap = max(0.0, float(nxt["start"]) - float(word["end"])) if nxt else 1.0
        last = str(word["text"]).strip()[-1:] 
        if last in ENDERS or len(bucket) >= 8 or gap >= 0.45 or nxt is None:
            flush()
    return out


def main() -> None:
    words_path = Path(sys.argv[1])
    dest = Path(sys.argv[2])
    payload = json.loads(words_path.read_text())
    words = payload["words"] if isinstance(payload, dict) else payload
    dest.write_text(json.dumps(group(words)))
    print(dest, "phrases", len(json.loads(dest.read_text())))


if __name__ == "__main__":
    main()
