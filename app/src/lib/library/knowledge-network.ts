/**
 * Positions for the Networks map. One org, the knowledge stored in it, and the
 * units of the piece you open. Pure: no database and no browser.
 */

export type KnowledgeUnitNode = {
  id: string;
  title: string;
  excerpt: string;
  quizCount: number;
};

export type KnowledgePiece = {
  id: string;
  title: string;
  excerpt: string;
  href: string | null;
  generated: boolean;
  sourceKind: string;
  units: KnowledgeUnitNode[];
};

export type RepositoryModel = {
  orgName: string;
  orgSlug: string;
  pieces: KnowledgePiece[];
};

export type MapKind = "org" | "lesson" | "unit";

export type MapNode = {
  id: string;
  kind: MapKind;
  label: string;
  title: string;
  x: number;
  y: number;
  generated: boolean;
  pieceId: string | null;
};

export type MapEdge = { from: string; to: string };

export type KnowledgeMap = {
  nodes: MapNode[];
  edges: MapEdge[];
  shownLessons: number;
  hiddenLessons: number;
  hiddenUnits: number;
};

const MAX_ON_MAP = 18;
const MAX_UNITS = 8;

export function clipLabel(value: string, max = 42): string {
  const text = value.replace(/\s+/g, " ").trim();
  if (!text) return "Untitled";
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function place(angle: number, rx: number, ry: number) {
  return {
    x: round(clamp(50 + Math.cos(angle) * rx, 8, 92)),
    y: round(clamp(48 + Math.sin(angle) * ry, 12, 88)),
  };
}

/** Lessons ring the org. Units appear only for the piece that is open. */
export function layoutRepository(model: RepositoryModel, focusId: string | null): KnowledgeMap {
  const shown = model.pieces.slice(0, MAX_ON_MAP);
  const nodes: MapNode[] = [
    {
      id: "org",
      kind: "org",
      label: clipLabel(model.orgName, 16),
      title: model.orgName.trim() || "This org",
      x: 50,
      y: 48,
      generated: false,
      pieceId: null,
    },
  ];
  const edges: MapEdge[] = [];
  const count = shown.length;
  shown.forEach((piece, index) => {
    const angle = -Math.PI / 2 + (count <= 1 ? 0 : (index / count) * Math.PI * 2);
    const at = place(angle, 30, 24);
    const id = `lesson:${piece.id}`;
    nodes.push({
      id,
      kind: "lesson",
      label: clipLabel(piece.title),
      title: piece.title.trim() || "Untitled",
      x: at.x,
      y: at.y,
      generated: piece.generated,
      pieceId: piece.id,
    });
    edges.push({ from: "org", to: id });
    if (focusId !== piece.id) return;
    const units = piece.units.slice(0, MAX_UNITS);
    const spread = Math.min(1.1, 0.28 * Math.max(units.length - 1, 1));
    units.forEach((unit, unitIndex) => {
      const t = units.length === 1 ? 0 : unitIndex / (units.length - 1) - 0.5;
      const outer = place(angle + t * spread, 44, 38);
      const unitId = `unit:${unit.id}`;
      nodes.push({
        id: unitId,
        kind: "unit",
        label: clipLabel(unit.title, 32),
        title: unit.title.trim() || "Untitled",
        x: outer.x,
        y: outer.y,
        generated: unit.quizCount > 0,
        pieceId: piece.id,
      });
      edges.push({ from: id, to: unitId });
    });
  });
  const focus = model.pieces.find((piece) => piece.id === focusId);
  return {
    nodes,
    edges,
    shownLessons: shown.length,
    hiddenLessons: Math.max(0, model.pieces.length - shown.length),
    hiddenUnits: focus ? Math.max(0, focus.units.length - MAX_UNITS) : 0,
  };
}
