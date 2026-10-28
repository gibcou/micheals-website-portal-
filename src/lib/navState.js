// Next.js's router has no equivalent of react-router's `navigate(path, { state })`
// for handing a plain object to the next page. This is a one-shot
// sessionStorage handoff: the sender sets a key right before navigating,
// the receiver reads and immediately clears it on mount so a refresh (or
// navigating back) never replays stale state.
export function setNavState(key, value) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable (private browsing, etc.) -- the receiving page
    // just won't find anything, same as never having passed state at all.
  }
}

export function takeNavState(key) {
  try {
    const raw = sessionStorage.getItem(key);
    if (raw == null) return null;
    sessionStorage.removeItem(key);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
