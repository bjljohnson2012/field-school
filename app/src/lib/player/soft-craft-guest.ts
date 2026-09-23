/** Guest-readable soft notes. These do not flip Cleaning or distribute. */
export const GUEST_SOFT_NOTES = [
  { kind: "caption-cue-drift", label: "A caption cue drifts from spoken timing." },
  { kind: "missing-chapter-boundary", label: "A chapter boundary is missing." },
  { kind: "audio-desync", label: "Audio drifts from the timeline or caption cues." },
  { kind: "missing-use-current-frame", label: "A composition is missing useCurrentFrame." },
  { kind: "css-timer-motion", label: "Motion is driven by a CSS timer." },
  { kind: "duration-band", label: "Length falls outside the practice and for-credit bands." },
  { kind: "flicker", label: "Frame-to-frame flicker or a flash pattern is detected." },
  { kind: "wcag-contrast", label: "On-screen text or a critical mark fails contrast." },
  { kind: "multi-objective", label: "A beat tries to teach more than one objective at once." },
  { kind: "pexels-broll", label: "Cached Pexels b-roll keeps the photographer attribution." },
] as const;
