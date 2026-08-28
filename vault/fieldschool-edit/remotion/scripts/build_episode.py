#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

WORDS = Path("/opt/fieldschool-video/edit/jobs/j013r823wx9ecaf/words.json")
WHISPERX = Path("/opt/fieldschool-edit/remotion/public/whisperx")
CAPTIONS = Path("/opt/fieldschool-edit/remotion/public/captions.json")
EPISODE = Path("/opt/fieldschool-edit/remotion/public/episode.json")
CUTS = Path("/opt/fieldschool-edit/remotion/public/cuts.json")

CLIP_LO = 2400
CLIP_HI = 22000


def load_stamps() -> list[dict]:
    aligned = sorted(WHISPERX.glob("*.json")) if WHISPERX.exists() else []
    if aligned:
        raw = json.loads(aligned[0].read_text())
        words = []
        for seg in raw.get("segments") or []:
            words.extend(seg.get("words") or [])
        if words:
            stamps = []
            prev = 0
            for word in words:
                text = str(word.get("word") or word.get("text") or "").strip()
                if not text:
                    continue
                start = word.get("start")
                end = word.get("end")
                from_ms = int(round(float(start) * 1000)) if start is not None else prev + 80
                to_ms = int(round(float(end) * 1000)) if end is not None else from_ms + 180
                stamps.append({"text": text.lstrip("-"), "fromMs": from_ms, "toMs": to_ms})
                prev = to_ms
            if stamps:
                return stamps
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
    return stamps


def main() -> None:
    stamps = load_stamps()
    window = [w for w in stamps if CLIP_LO <= w["fromMs"] < CLIP_HI]
    cues: list[dict] = []

    silences = []
    for a, b in zip(stamps, stamps[1:]):
        gap = b["fromMs"] - a["toMs"]
        if gap >= 400 and CLIP_LO <= a["toMs"] <= CLIP_HI:
            silences.append({"afterMs": a["toMs"], "gapMs": gap, "cut": True, "voxEnter": gap >= 800})

    episode = {
        "course": "Field School",
        "module": "Authored processes",
        "title": "You Can Just Do Things",
        "objective": "Separate a memo from a law, then take the next step.",
        "hook": "Most of what blocks you is waiting.",
        "doPrompt": "Name the thing you are waiting on. Then do the next step anyway.",
        "recap": [
            {"kicker": "1", "text": "Waiting is a memo."},
            {"kicker": "2", "text": "You can just do things."},
            {"kicker": "3", "text": "Ask if it is a law."},
        ],
        "nextUp": {"module": "Authored processes", "title": "Made up is not fake"},
        "showSrc": "01-the-waiting-trap.png",
        "src": "a_roll.mp4",
        "voSrc": "vo.wav",
        "durationSec": 25,
        "words": window,
        "cues": cues,
        "silences": silences,
    }
    CAPTIONS.write_text(json.dumps({"words": stamps, "window": window}))
    EPISODE.write_text(json.dumps(episode))
    CUTS.write_text(json.dumps({"cues": cues, "silences": silences}))
    print("words", len(window), "cues", cues, "silences", silences)


if __name__ == "__main__":
    main()
