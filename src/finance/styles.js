// Shared style fragments for the finance module.
//
// Kept out of ui.jsx so that file exports components and nothing else — which is
// what Fast Refresh needs to swap a component without reloading the module.

// Tabular figures: a column of amounts should line up on the digit, not on the
// glyph widths of whatever font happens to be loaded.
export const NUM = { fontVariantNumeric: "tabular-nums", fontFeatureSettings: '"tnum"' };

// A button that reads as a link. Used wherever a figure or a record name is the
// way into the next level.
export const linkBtn = {
  background: "none", border: "none", padding: 0,
  fontSize: 12.5, fontWeight: 600, cursor: "pointer",
  fontFamily: "inherit", textAlign: "left", color: "#219CD6",
};
