import React, {useMemo} from "react";
import {interpolate} from "remotion";
import {TYPE_PLAYBOOK, displayFace, ink} from "./tokens";
import {TypewriterWord} from "./TypewriterWord";
import type {MadeWord} from "./schema";

const WAITING = /^waiting\.$/i;
export const PLAYBOOK = /^playbook[,.]?$/i;
const TYPE_MS = 180;

type TypeFieldProps = {
  words: MadeWord[];
  nowMs: number;
};

export const TypeField: React.FC<TypeFieldProps> = ({words, nowMs}) => {
  const waitWord = useMemo(() => words.find((word) => WAITING.test(word.text.trim())) ?? null, [words]);
  const bookWord = useMemo(() => words.find((word) => PLAYBOOK.test(word.text.trim())) ?? null, [words]);
  const bookMs = bookWord?.fromMs ?? null;
  const page = useMemo(() => {
    if (waitWord && nowMs >= waitWord.fromMs && (bookMs === null || nowMs < bookMs)) {
      return {word: waitWord, kind: "waiting" as const};
    }
    if (bookWord && bookMs !== null && nowMs + 34 >= bookMs && nowMs < bookMs + 2400) {
      return {word: bookWord, kind: "playbook" as const};
    }
    return null;
  }, [bookMs, bookWord, nowMs, waitWord]);

  if (!page) {
    return null;
  }

  if (page.kind === "waiting") {
    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            display: "block",
            fontFamily: displayFace,
            fontWeight: 700,
            fontSize: 220,
            letterSpacing: "-0.04em",
            lineHeight: 1.05,
            color: ink,
            textAlign: "center",
          }}
        >
          {page.word.text}
          <span
            style={{
              display: "block",
              width: 420,
              height: 6,
              margin: "12px auto 0",
              backgroundColor: ink,
            }}
          />
        </span>
      </div>
    );
  }

  const active = nowMs >= page.word.fromMs && nowMs < page.word.toMs;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 1920 - 780,
        height: 1080,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        paddingLeft: 88,
        paddingRight: 72,
        boxSizing: "border-box",
      }}
    >
      <TypewriterWord text={page.word.text} shown={page.word.text.length} size={TYPE_PLAYBOOK} active={active} />
    </div>
  );
};

export const letterAtMs = (fromMs: number, index: number, letters: number): number => {
  if (letters <= 0) {
    return fromMs;
  }
  return fromMs + (index / letters) * TYPE_MS;
};

export const waitingOpen = (nowMs: number, words: MadeWord[]): boolean => {
  const waitWord = words.find((word) => WAITING.test(word.text.trim()));
  const bookWord = words.find((word) => PLAYBOOK.test(word.text.trim()));
  if (!waitWord) {
    return false;
  }
  return nowMs >= waitWord.fromMs && (bookWord === undefined || nowMs < bookWord.fromMs);
};
