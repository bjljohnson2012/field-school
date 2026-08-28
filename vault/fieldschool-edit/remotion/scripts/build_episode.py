#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

WORDS = Path("/opt/fieldschool-video/edit/jobs/j013r823wx9ecaf/words.json")
CAPTIONS = Path("/opt/fieldschool-edit/remotion/public/captions.json")
EPISODE = Path("/opt/fieldschool-edit/remotion/public/episode.json")
CUTS = Path("/opt/fieldschool-edit/remotion/public/cuts.json")


def main() -> None:
    raw = json.loads(WORDS.read_text())
    stamps = []
    prev = 0
    for word in raw["words"]:
        text = str(word["text"]).strip()
        start = word.get("start")
        end = word.get("end")
        from_ms = int(round(float(start) * 1000)) if start is not None else prev + 80
        to_ms = int(round(float(end) * 1000)) if end is not None else from_ms + 180
        stamps.append({"text": text, "fromMs": from_ms, "toMs": to_ms})
        prev = to_ms

    pages = []
    bucket = []
    for word in stamps:
        if bucket and word["fromMs"] - bucket[0]["fromMs"] > 1400:
            pages.append(
                {
                    "startMs": bucket[0]["fromMs"],
                    "endMs": bucket[-1]["toMs"] + 80,
                    "words": bucket,
                }
            )
            bucket = []
        bucket.append(word)
    if bucket:
        pages.append({"startMs": bucket[0]["fromMs"], "endMs": bucket[-1]["toMs"] + 80, "words": bucket})

    preview_lo = 2400
    preview_hi = 5200
    preview_pages = [p for p in pages if p["endMs"] > preview_lo and p["startMs"] < preview_hi]
    window = [w for w in stamps if preview_lo <= w["fromMs"] < preview_hi]
    prefer = ("things", "reasons", "main", "people", "one")
    cue_word = None
    for name in prefer:
        cue_word = next((w for w in window if w["text"].lower().rstrip(".,!?") == name), None)
        if cue_word is not None:
            break
    if cue_word is None:
        cue_word = window[2] if len(window) > 2 else stamps[0]
    episode = {
        "course": "Field School",
        "module": "Authored processes",
        "title": "You Can Just Do Things",
        "objective": "Separate a memo from a law, then take the next step.",
        "src": "a_roll.mp4",
        "durationSec": 5,
        "captions": preview_pages,
        "cues": [{"word": cue_word["text"], "fromMs": cue_word["fromMs"], "kind": "vox"}],
    }
    CAPTIONS.write_text(json.dumps({"pages": pages, "words": stamps}))
    EPISODE.write_text(json.dumps(episode))
    silences = []
    for a, b in zip(stamps, stamps[1:]):
        gap = b["fromMs"] - a["toMs"]
        if gap >= 400:
            silences.append({"afterMs": a["toMs"], "gapMs": gap, "cut": True, "voxEnter": gap >= 800})
    CUTS.write_text(json.dumps({"cues": episode["cues"], "silences": silences[:40]}))
    print("pages", len(pages), "cue", episode["cues"][0])


if __name__ == "__main__":
    main()
