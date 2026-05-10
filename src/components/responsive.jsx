// Tiny media-query hook + breakpoint helpers. Inline-style codebases can't
// use CSS @media, so components subscribe to the current viewport and pick
// compact layouts when there isn't room.

import { useEffect, useState } from "react";

export const BP = {
  // Mirror Tailwind's defaults for familiarity.
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
};

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

// Convenience: true when the viewport is at most `px` wide.
export function useMaxWidth(px) {
  return useMediaQuery(`(max-width: ${px}px)`);
}
