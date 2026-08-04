import { cp, mkdir } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const source = path.join(projectRoot, "dist", "public");
const target = path.join(projectRoot, "public");

await mkdir(target, { recursive: true });
await cp(source, target, { recursive: true, force: true });
console.log(`[Build] Copied frontend assets to ${target}`);
