/**
 * AgentDB mark: the "A" monogram with a database stack.
 * - variant "tile" (default): white mark on a black rounded tile, for the light app.
 * - variant "light": white mark on a transparent background, for dark surfaces (landing page).
 * Raster assets live in /public/brand and are generated from the master artwork.
 */
const SOURCES = {
  tile: 'agentdb-logo',
  light: 'agentdb-mark-white',
};

export default function Logo({ collapsed = false, size = 26, variant = 'tile' }) {
  const base = `/brand/${SOURCES[variant] || SOURCES.tile}`;
  return (
    <span className="ag-logo">
      <img
        className={`ag-logo-mark is-${variant}`}
        src={`${base}-64.png`}
        srcSet={`${base}-64.png 1x, ${base}-128.png 2x, ${base}-256.png 4x`}
        width={size}
        height={size}
        alt=""
        aria-hidden="true"
        decoding="async"
      />
      {!collapsed && <span className="ag-logo-word">AgentDB</span>}
    </span>
  );
}
