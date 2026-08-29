import React, {useEffect, useMemo, useState} from "react";
import {interpolate, useDelayRender} from "remotion";
import {waitMadeUpFonts} from "./fonts";
import {pageForClock} from "./pages";
import {
  TYPE_BESIDE,
  TYPE_HEAD_GAP,
  TYPE_PLAYBOOK,
  TYPE_SOLO,
  displayFace,
  gold,
  headReservedPx,
  ink,
} from "./tokens";
import {TypewriterWord} from "./TypewriterWord";
import type {MadeWord} from "./schema";

const WAITING = /^waiting\.$/i;
export const PLAYBOOK = /^playbook[,.]?$/i;
const TYPE_MS = 460;
const ALLOW_HOLD_MS = 2200;
const ALLOWED = /^(just|real|authored|gravity|stuck|five|sixty|60|intimidated|wreck|vandal|act|reason)$/i;

const bare = (text: string): string => text.trim().replace(/[.,!?]+$/g, "");

const isAllowed = (text: string): boolean => ALLOWED.test(bare(text));

type TypeFieldProps = {
  words: MadeWord[];
  nowMs: number;
  solo: number;
  docked: boolean;
};

const typedCount = (nowMs: number, fromMs: number, letters: number): number => {
  if (letters <= 0 || nowMs < fromMs) {
    return 0;
  }
  const t = (nowMs - fromMs) / TYPE_MS;
  if (t >= 1) {
    return letters;
  }
  return Math.max(1, Math.min(letters, Math.ceil(t * letters)));
};

export const TypeField: React.FC<TypeFieldProps> = ({words, nowMs, solo, docked}) => {
  const {delayRender, continueRender} = useDelayRender();
  const [handle] = useState(() => delayRender("type-fonts"));
  const [ready, setReady] = useState(false);
  useEffect(() => {
    waitMadeUpFonts()
      .then(() => {
        setReady(true);
        continueRender(handle);
      })
      .catch(() => {
        setReady(true);
        continueRender(handle);
      });
  }, [continueRender, handle]);

  const waitWord = useMemo(() => words.find((word) => WAITING.test(word.text.trim())) ?? null, [words]);
  const bookWord = useMemo(() => words.find((word) => PLAYBOOK.test(word.text.trim())) ?? null, [words]);
  const lock = waitWord?.fromMs ?? null;
  const bookMs = bookWord?.fromMs ?? null;
  const page = useMemo(() => {
    const held = lock !== null && nowMs >= lock && (bookMs === null || nowMs < bookMs);
    if (held && waitWord) {
      return {words: [waitWord], appearMs: waitWord.fromMs, hideMs: bookMs ?? waitWord.toMs + 8000};
    }
    const bookPage =
      bookWord && bookMs !== null && nowMs >= bookMs && nowMs < bookMs + TYPE_MS + 800
        ? {words: [bookWord], appearMs: bookWord.fromMs, hideMs: bookMs + TYPE_MS + 800}
        : null;
    if (bookPage) {
      return bookPage;
    }
    const hit = [...words]
      .reverse()
      .find((word) => isAllowed(word.text) && nowMs >= word.fromMs && nowMs < word.toMs + ALLOW_HOLD_MS);
    if (hit) {
      return {words: [hit], appearMs: hit.fromMs, hideMs: hit.toMs + ALLOW_HOLD_MS};
    }
    const next = pageForClock(words, nowMs, lock);
    if (!next) {
      return next;
    }
    const keep = next.words.filter((word) => WAITING.test(word.text.trim()) || PLAYBOOK.test(word.text.trim()));
    return keep.length > 0 ? {...next, words: keep} : null;
  }, [bookMs, bookWord, lock, nowMs, waitWord, words]);

  if (!page) {
    return null;
  }

  const openField = interpolate(solo, [0.88, 0.99], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const reserved = docked ? headReservedPx() + TYPE_HEAD_GAP : 0;
  const fieldWidth = interpolate(openField, [0, 1], [1920 - reserved, 1920], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fontSize = interpolate(openField, [0, 1], [docked ? TYPE_BESIDE : TYPE_SOLO, TYPE_SOLO], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const sidePad = interpolate(openField, [0, 1], [docked ? 88 : 140, 160], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const spokenColor = ink;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: fieldWidth,
        height: 1080,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        paddingLeft: sidePad,
        paddingRight: sidePad,
        boxSizing: "border-box",
      }}
    >
      <div style={{textAlign: "center", width: "100%", maxWidth: "100%"}}>
        {page.words.map((word, i) => {
          const active = nowMs >= word.fromMs && nowMs < word.toMs;
          const readyWord = nowMs >= Math.max(word.fromMs, page.appearMs);
          if (WAITING.test(word.text.trim())) {
            return (
              <span
                key={`${word.fromMs}-${word.text}-${i}`}
                style={{
                  display: "block",
                  marginTop: 8,
                  marginBottom: 12,
                  fontFamily: displayFace,
                  fontWeight: 700,
                  fontSize: interpolate(solo, [0, 1], [fontSize, 220], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  }),
                  letterSpacing: "-0.04em",
                  lineHeight: 1.05,
                  color: ink,
                  opacity: readyWord ? 1 : 0,
                  scale: `${interpolate(solo, [0, 1], [1, 1.04], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})}`,
                }}
              >
                {word.text}
                <span
                  style={{
                    display: "block",
                    width: interpolate(solo, [0, 1], [80, 420], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}),
                    height: 6,
                    margin: "12px auto 0",
                    backgroundColor: ink,
                    opacity: readyWord ? 1 : 0,
                  }}
                />
              </span>
            );
          }
          if (PLAYBOOK.test(word.text.trim())) {
            return (
              <TypewriterWord
                key={`${word.fromMs}-${word.text}-${i}`}
                text={word.text}
                shown={typedCount(nowMs, word.fromMs, word.text.length)}
                size={TYPE_PLAYBOOK}
                active={active || typedCount(nowMs, word.fromMs, word.text.length) === word.text.length}
              />
            );
          }
          return (
            <span
              key={`${word.fromMs}-${word.text}-${i}`}
              style={{
                display: "inline-block",
                marginRight: 16,
                marginBottom: 12,
                fontFamily: displayFace,
                fontWeight: 700,
                fontSize,
                letterSpacing: "-0.03em",
                lineHeight: 1.16,
                color: active ? gold : spokenColor,
                opacity: readyWord ? 1 : 0,
              }}
            >
              {word.text}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export const letterAtMs = (fromMs: number, index: number, letters: number): number => {
  if (letters <= 0) {
    return fromMs;
  }
  return fromMs + (index / letters) * TYPE_MS;
};
