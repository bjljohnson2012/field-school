import {
  BEARING_DIMS,
  loadPinnedBank,
  type BearingDim,
  type InstrumentItem,
  type Weights,
} from "./load-bank";

export const INSTRUMENT_SLUG = "fp-50-v1";
export {
  BEARING_DIMS,
  type BearingDim,
  type InstrumentItem,
  type Weights,
} from "./load-bank";

/** Official fp-50-v1 items. Always loaded from the pinned markdown + 0003. */
export function fp50Items(): InstrumentItem[] {
  return loadPinnedBank();
}

export function itemsForSubset(subset: "adult" | "child") {
  const items = fp50Items();
  return subset === "child" ? items.filter((item) => item.child) : items;
}

export function primaryDim(weights: Weights): BearingDim {
  let best: BearingDim = "drive";
  let mag = -1;
  for (const dim of BEARING_DIMS) {
    const abs = Math.abs(weights[dim] ?? 0);
    if (abs > mag) {
      mag = abs;
      best = dim;
    }
  }
  return best;
}
