const GUEST_KEY = "jfsu-guest";

function store() {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function markGuest() {
  store()?.setItem(GUEST_KEY, "1");
}

export function isGuest() {
  return store()?.getItem(GUEST_KEY) === "1";
}

export function clearGuest() {
  store()?.removeItem(GUEST_KEY);
}
