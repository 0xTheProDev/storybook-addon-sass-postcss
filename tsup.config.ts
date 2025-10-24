import { defineConfig } from "@theprodev/tsup-config";

export default defineConfig({
  entry: ["src/index.ts"],
  format: "esm",
  libOptions: {
    startYear: 2021,
  },
  outDir: "dist",
  sourcemap: true,
});
