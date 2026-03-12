/**
 * Style renderer registry — manages available drawing styles.
 */

import type { StyleRenderer, DrawingStyle } from "./types.js";
import { preciseStyle } from "./precise.js";
import { inkSketchStyle } from "./ink-sketch.js";
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
registerStyle(inkSketchStyle);
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
export { inkSketchStyle } from "./ink-sketch.js";
export { silhouetteStyle } from "./silhouette.js";
