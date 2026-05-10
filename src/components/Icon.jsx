// Fluent icons render with width/height = 1em + fill=currentColor.
// Use this helper to size them via fontSize and color them via the
// `color` style prop on the wrapping element.
export const I = ({ as: Cmp, size = 16, color, style = {} }) => (
  <Cmp
    style={{
      fontSize: size,
      color,
      verticalAlign: "middle",
      lineHeight: 0,
      flexShrink: 0,
      ...style,
    }}
  />
);
