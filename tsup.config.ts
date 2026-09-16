import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  external: ["@genart-dev/core"],
  // tsup externalises anything in dependencies, which left a bare
  // require("@genart-dev/plugin-painting") in the bundle. The compositor
  // inlines this package into a standalone page, where that require cannot
  // resolve, so the ink and watercolour styles lost their strokes. Bundle it.
  noExternal: ["@genart-dev/plugin-painting"],
});
