// Runs turbo-vsc's real findInstalledTurboLsp() against real turbo installs.
// Usage: node --import tsx repro.mjs <path to turbo-discovery.ts> <fixtures dir>
import path from "node:path";
import { pathToFileURL } from "node:url";

const [modulePath, fixtures] = process.argv.slice(2);
const { findInstalledTurboLsp } = await import(pathToFileURL(path.resolve(modulePath)).href);

console.log(`node ${process.version} ${process.platform}-${process.arch}`);
console.log(`module: ${path.basename(path.dirname(modulePath))}/${path.basename(modulePath)}`);

for (const ws of ["ws-pnpm", "ws-npm"]) {
  const workspaceRoot = path.join(fixtures, ws);
  const logs = [];
  const found = await findInstalledTurboLsp({ workspaceRoot, log: (m) => logs.push(m) });
  console.log(`\n## ${ws}`);
  for (const line of logs) console.log(`  log: ${line.split(fixtures).join("<fixtures>")}`);
  console.log(`  result: ${found ? found.split(fixtures).join("<fixtures>") : "undefined (falls back to packaged LSP)"}`);
}
