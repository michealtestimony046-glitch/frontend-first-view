import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [png, png192, ico, manifestText, rootRoute, logo, serviceWorker] = await Promise.all([
  readFile(path.join(root, "public/matrixqa-favicon.png")),
  readFile(path.join(root, "public/matrixqa-favicon-192.png")),
  readFile(path.join(root, "public/favicon.ico")),
  readFile(path.join(root, "public/manifest.webmanifest"), "utf8"),
  readFile(path.join(root, "src/routes/__root.tsx"), "utf8"),
  readFile(path.join(root, "src/components/logo.tsx"), "utf8"),
  readFile(path.join(root, "public/sw.js"), "utf8"),
]);

const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
assert.ok(png.subarray(0, 8).equals(pngSignature));
assert.ok(png192.subarray(0, 8).equals(pngSignature));
assert.ok(png.length > 10_000);
assert.ok(png192.length > 5_000);
assert.equal(ico.readUInt16LE(0), 0);
assert.equal(ico.readUInt16LE(2), 1);
assert.ok(ico.readUInt16LE(4) >= 1);
assert.ok(ico.includes(pngSignature));

const manifest = JSON.parse(manifestText);
assert.ok(
  manifest.icons.some((icon) => icon.src === "/matrixqa-favicon.png" && icon.sizes === "512x512"),
);
assert.ok(
  manifest.icons.some(
    (icon) => icon.src === "/matrixqa-favicon-192.png" && icon.sizes === "192x192",
  ),
);
assert.ok(manifest.icons.some((icon) => icon.src === "/favicon.ico"));
assert.match(rootRoute, /href: "\/matrixqa-icon\.svg"/);
assert.match(rootRoute, /href: "\/favicon\.ico"/);
assert.match(logo, /src="\/matrixqa-icon\.svg"/);
assert.match(serviceWorker, /icon: "\/matrixqa-favicon\.png"/);
assert.match(serviceWorker, /badge: "\/matrixqa-favicon-192\.png"/);
assert.doesNotMatch(manifestText, /matrixqa-icon\.svg/);
assert.match(rootRoute, /matrixqa-icon\.svg/);
assert.match(logo, /matrixqa-icon\.svg/);
assert.doesNotMatch(logo, /matrixqa-mark|lovable/);
assert.doesNotMatch(serviceWorker, /matrixqa-icon\.svg/);

console.log("Matrix QA supplied-brand favicon verification passed.");
