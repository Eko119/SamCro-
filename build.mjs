#!/usr/bin/env node
/* =============================================================================
   Assembles the deployable site into dist/.

   The source page is named for the design canvas it came from, which is not a
   URL anyone should have to type. The build gives the site a proper root
   document and copies the assets beside it so every relative path in the page
   keeps working untouched.
   ========================================================================== */

import { cp, mkdir, rm, copyFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const dist = resolve(root, "dist");

const PAGE = "Samanthas Crochet Boutique.dc.html";
const ASSETS = ["_ds", "image-slot.js", "support.js"];

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

await copyFile(resolve(root, PAGE), resolve(dist, "index.html"));

for (const asset of ASSETS) {
  await cp(resolve(root, asset), resolve(dist, asset), { recursive: true });
}

console.log(`built dist/ — index.html + ${ASSETS.join(", ")}`);
