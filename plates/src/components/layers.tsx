import { AbsoluteFill, Img, staticFile } from "remotion";
import { loadFont as loadFraunces } from "@remotion/google-fonts/Fraunces";
import { loadFont as loadPlex } from "@remotion/google-fonts/IBMPlexSans";
import { loadFont as loadSerif } from "@remotion/google-fonts/SourceSerif4";
import { brand, DOCK_PCT, HEIGHT, WIDTH } from "../brand/tokens";

const { fontFamily: fraunces } = loadFraunces("normal", {
  weights: ["600", "700"],
  subsets: ["latin"],
});
const { fontFamily: serif } = loadSerif("normal", {
  weights: ["400", "600"],
  subsets: ["latin"],
});
const { fontFamily: plex } = loadPlex("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export const fonts = { fraunces, serif, plex };

export function Bed() {
  return <AbsoluteFill style={{ backgroundColor: brand.paper }} />;
}

export function FieldSchoolMark({
  width = 320,
}: {
  width?: number;
}) {
  return (
    <Img
      src={staticFile("brand/lockup-wide-black.svg")}
      alt="Field School"
      style={{ width, height: "auto" }}
    />
  );
}

export function Screen({ children }: { children: React.ReactNode }) {
  return (
    <AbsoluteFill
      style={{
        padding: "88px 120px 96px",
        justifyContent: "center",
      }}
    >
      {children}
    </AbsoluteFill>
  );
}

export function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: plex,
        fontSize: 26,
        letterSpacing: 5,
        textTransform: "uppercase",
        color: brand.olive,
        marginBottom: 20,
        whiteSpace: "pre-wrap",
      }}
    >
      {children}
    </div>
  );
}

export function Title({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: fraunces,
        fontSize: 84,
        lineHeight: 1.08,
        color: brand.ink,
        whiteSpace: "pre-wrap",
        wordSpacing: "0.12em",
        maxWidth: 1480,
      }}
    >
      {children}
    </div>
  );
}

export function Body({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: serif,
        fontSize: 44,
        lineHeight: 1.35,
        color: brand.ink,
        whiteSpace: "pre-wrap",
        wordSpacing: "0.12em",
        maxWidth: 1320,
      }}
    >
      {children}
    </div>
  );
}

export function Rule() {
  return (
    <div
      style={{
        width: 96,
        height: 3,
        backgroundColor: brand.ink,
        margin: "28px 0",
      }}
    />
  );
}

export function MarkHeader() {
  return (
    <div style={{ position: "absolute", top: 48, left: 120 }}>
      <FieldSchoolMark width={280} />
    </div>
  );
}

export function LowerThird({ label }: { label: string }) {
  return (
    <div
      style={{
        position: "absolute",
        left: 120,
        bottom: 48,
        display: "flex",
        alignItems: "center",
        gap: 20,
        fontFamily: plex,
        fontSize: 24,
        letterSpacing: 3,
        textTransform: "uppercase",
        color: brand.ink,
      }}
    >
      <Img
        src={staticFile("brand/mark-black.svg")}
        alt="Field School mark"
        style={{ width: 40, height: 32 }}
      />
      <span>{label}</span>
    </div>
  );
}

export function Captions({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 120,
        right: 120,
        bottom: 100,
        fontFamily: plex,
        fontSize: 28,
        color: brand.ink,
        whiteSpace: "pre-wrap",
      }}
    >
      {text}
    </div>
  );
}

export function Letterbox() {
  return (
    <>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          backgroundColor: brand.ink,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 2,
          backgroundColor: brand.ink,
        }}
      />
    </>
  );
}

export function TalkingHeadDock({
  dock,
  name,
  role,
}: {
  dock: "dock-right" | "dock-left";
  name: string;
  role: string;
}) {
  const width = Math.round(WIDTH * DOCK_PCT);
  const left = dock === "dock-left" ? 120 : WIDTH - width - 120;
  return (
    <div
      style={{
        position: "absolute",
        top: 200,
        left,
        width,
        height: HEIGHT - 360,
        backgroundColor: brand.paper,
        border: `2px solid ${brand.ink}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
      }}
    >
      <div
        style={{
          width: 200,
          height: 200,
          borderRadius: 200,
          border: `2px solid ${brand.ink}`,
          backgroundColor: brand.paper,
          marginBottom: 24,
        }}
      />
      <div style={{ fontFamily: fraunces, fontSize: 40, color: brand.ink }}>
        {name}
      </div>
      <div
        style={{
          fontFamily: plex,
          fontSize: 24,
          color: brand.olive,
          marginTop: 8,
          letterSpacing: 2,
          textTransform: "uppercase",
        }}
      >
        {role}
      </div>
    </div>
  );
}
