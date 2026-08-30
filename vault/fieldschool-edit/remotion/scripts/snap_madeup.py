#!/usr/bin/env python3
"""Snap Everything Is Made Up shots to the WhisperX word clock."""
from __future__ import annotations

import json
import os
from pathlib import Path

ROOT = Path(os.environ.get("FS_REMOTION", "/opt/fieldschool-edit/remotion"))
JOB_WORDS = Path(os.environ.get("FS_JOB_WORDS", "/opt/fieldschool-video/edit/jobs/j013r823wx9ecaf/words.json"))
WHISPER = ROOT / "public/episodes/everything-made-up/whisperx"
EPISODE = ROOT / "public/episodes/everything-made-up/episode.json"
CAPTIONS = ROOT / "public/episodes/everything-made-up/captions.json"
FPS = 30
CTA_FRAMES = 720
MIN_DUR = {
    "sting": 60,
    "hook": 90,
    "a-roll": 150,
    "b-roll": 180,
    "vox": 210,
    "cta": 720,
}


def load_words() -> list[dict]:
    for path in sorted(WHISPER.glob("*.json"), reverse=True) if WHISPER.exists() else []:
        raw = json.loads(path.read_text())
        if raw.get("segments"):
            out = []
            for seg in raw["segments"]:
                for word in seg.get("words") or []:
                    text = str(word.get("word") or word.get("text") or "").strip()
                    if not text:
                        continue
                    start = float(word.get("start") or 0)
                    end = float(word.get("end") or start + 0.18)
                    out.append({"text": text, "fromMs": int(round(start * 1000)), "toMs": int(round(end * 1000))})
            if out:
                return out
        if raw.get("words") and isinstance(raw["words"][0], dict) and "fromMs" in raw["words"][0]:
            return raw["words"]
    raw = json.loads(JOB_WORDS.read_text())
    out = []
    for word in raw.get("words") or []:
        text = str(word.get("text") or "").strip()
        if not text:
            continue
        start = int(round(float(word["start"]) * 1000))
        end = int(round(float(word["end"]) * 1000)) if word.get("end") is not None else start + 180
        out.append({"text": text, "fromMs": start, "toMs": end})
    return out


def first_after(words: list[dict], needle: str, after_ms: int) -> int | None:
    key = needle.lower().replace(" ", "")
    for word in words:
        if word["fromMs"] < after_ms:
            continue
        if key in word["text"].lower().replace(" ", "").replace(".", "").replace(",", "").replace('"', ""):
            return word["fromMs"]
    return None


def ms_to_frame(ms: int) -> int:
    return int(round(ms / 1000 * FPS))


def main() -> None:
    words = load_words()
    CAPTIONS.parent.mkdir(parents=True, exist_ok=True)
    CAPTIONS.write_text(json.dumps({"words": words}))
    episode = json.loads(EPISODE.read_text())

    cues = {
        "s00": 0,
        "s01": 60,
        "s03": ms_to_frame(first_after(words, "playbook", 0) or 14992),
        "s02": ms_to_frame(first_after(words, "just", 30000) or 34906),
        "s05": ms_to_frame(first_after(words, "real", 60000) or 65277),
        "s07": ms_to_frame(first_after(words, "authored", 80000) or 86071),
        "s04": ms_to_frame(first_after(words, "gravity", 100000) or 113689),
        "s06": ms_to_frame(first_after(words, "god", 110000) or 115810),
        "s09": ms_to_frame(first_after(words, "stuck", 190000) or 205262),
        "s08": ms_to_frame(first_after(words, "door", 240000) or 251814),
        "s10": ms_to_frame(first_after(words, "five", 250000) or 255077),
        "s11": ms_to_frame(first_after(words, "week", 300000) or first_after(words, "brave", 300000) or 340000),
        "s12": ms_to_frame(first_after(words, "sixty", 360000) or 382351),
        "s13": ms_to_frame(first_after(words, "thirty", 450000) or 467229),
        "s14": ms_to_frame(first_after(words, "reason", 490000) or 497015),
        "s15": ms_to_frame(first_after(words, "intimidated", 500000) or 522258),
        "s16": ms_to_frame(first_after(words, "vandal", 560000) or 575332),
        "s17": ms_to_frame(first_after(words, "why", 610000) or 617809),
        "s18": ms_to_frame(first_after(words, "act", 630000) or 634545),
        "s19": ms_to_frame(first_after(words, "reason", 640000) or 644472),
    }

    by_id = {shot["id"]: shot for shot in episode["shots"]}
    timed = sorted(by_id.values(), key=lambda shot: cues.get(shot["id"], shot["fromFrame"]))
    cursor = 0
    for i, shot in enumerate(timed):
        start = max(cues.get(shot["id"], shot["fromFrame"]), cursor)
        nxt = cues.get(timed[i + 1]["id"], start + MIN_DUR.get(shot["type"], 180)) if i + 1 < len(timed) else start + CTA_FRAMES
        minimum = MIN_DUR.get(shot["type"], 90)
        if nxt < start + minimum and i + 1 < len(timed):
            nxt = start + minimum
            cues[timed[i + 1]["id"]] = max(cues.get(timed[i + 1]["id"], nxt), nxt)
        shot["fromFrame"] = start
        shot["durationInFrames"] = max(minimum, nxt - start)
        cursor = shot["fromFrame"] + shot["durationInFrames"]
        if i + 1 == len(timed):
            shot["durationInFrames"] = CTA_FRAMES
            cursor = shot["fromFrame"] + CTA_FRAMES

    episode["shots"] = timed
    episode.pop("words", None)
    EPISODE.write_text(json.dumps(episode, indent=2) + "\n")
    last = timed[-1]
    print("snapped", [(shot["id"], shot["fromFrame"], shot["durationInFrames"]) for shot in timed])
    print("end_frame", last["fromFrame"] + last["durationInFrames"])


if __name__ == "__main__":
    main()
