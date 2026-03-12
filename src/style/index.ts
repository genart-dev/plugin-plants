/**
 * Style renderer registry — manages available drawing styles.
 */

import type { StyleRenderer, DrawingStyle } from "./types.js";
import { preciseStyle } from "./precise.js";
import { botanicalStyle } from "./botanical.js";
import { inkSketchStyle } from "./ink-sketch.js";
import { sumiEStyle } from "./sumi-e.js";
import { watercolorStyle } from "./watercolor.js";
import { pencilStyle } from "./pencil.js";
import { engravingStyle } from "./engraving.js";
import { woodcutStyle } from "./woodcut.js";
import { silhouetteStyle } from "./silhouette.js";

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const renderers = new Map<DrawingStyle, StyleRenderer>();

/** Register a style renderer. */
export function registerStyle(renderer: StyleRenderer): void {
  renderers.set(renderer.id, renderer);
}

/** Get a style renderer by ID. Returns precise as fallback. */
export function getStyle(id: DrawingStyle): StyleRenderer {
  return renderers.get(id) ?? preciseStyle;
}

/** List all registered style renderers. */
export function listStyles(): StyleRenderer[] {
  return Array.from(renderers.values());
}

/** List all registered style IDs. */
export function listStyleIds(): DrawingStyle[] {
  return Array.from(renderers.keys());
}

// ---------------------------------------------------------------------------
// Register built-in styles
// ---------------------------------------------------------------------------

registerStyle(preciseStyle);
registerStyle(botanicalStyle);
registerStyle(inkSketchStyle);
registerStyle(sumiEStyle);
registerStyle(watercolorStyle);
registerStyle(pencilStyle);
registerStyle(engravingStyle);
registerStyle(woodcutStyle);
registerStyle(silhouetteStyle);

// Re-exports
export { filterByDetailLevel, extraIterations, clampIterations } from "./detail-filter.js";
export { DEFAULT_STYLE_CONFIG } from "./types.js";
export type {
  StructuralOutput,
  StyleRenderer,
  StyleConfig,
  RenderTransform,
  ResolvedColors,
  DetailLevel,
  DrawingStyle,
  ShapePath,
  StyleRenderHints,
} from "./types.js";
export { preciseStyle } from "./precise.js";
export { botanicalStyle } from "./botanical.js";
export { inkSketchStyle } from "./ink-sketch.js";
export { sumiEStyle } from "./sumi-e.js";
export { watercolorStyle } from "./watercolor.js";
export { pencilStyle } from "./pencil.js";
export { engravingStyle } from "./engraving.js";
export { woodcutStyle } from "./woodcut.js";
export { silhouetteStyle } from "./silhouette.js";
