const GUEST_KEY = "jfsu-guest";

export function markGuest() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(GUEST_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function isGuest() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(GUEST_KEY) === "1";
  } catch {
    return false;
  }
}

export function clearGuest() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(GUEST_KEY);
  } catch {
    /* ignore */
  }
}
