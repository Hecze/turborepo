// Starts the LSP from the binary that findInstalledTurboLsp() resolves and sends `initialize`,
// the same way LanguageClient does (cp.spawn without a shell).
// Usage: node --import tsx lsp-initialize.mjs <path to turbo-discovery.ts> <workspace root>
import cp from "node:child_process";
import path from "node:path";
import { pathToFileURL } from "node:url";

const [modulePath, workspaceRoot] = process.argv.slice(2);
const { findInstalledTurboLsp } = await import(pathToFileURL(path.resolve(modulePath)).href);

const bin = await findInstalledTurboLsp({ workspaceRoot, log: () => {} });
if (!bin) {
  console.log("no installed turbo resolved");
  process.exit(1);
}
console.log(`binary: ${path.basename(path.dirname(path.dirname(bin)))}/bin/${path.basename(bin)}`);

const child = cp.spawn(bin, ["__internal_lsp"], { stdio: ["pipe", "pipe", "inherit"] });
const body = JSON.stringify({
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: { processId: null, rootUri: null, capabilities: {} },
});
child.stdin.write(`Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`);

let out = "";
const timer = setTimeout(() => {
  console.log(`timeout; got: ${out.slice(0, 200)}`);
  child.kill();
  process.exit(1);
}, 20000);
child.stdout.on("data", (chunk) => {
  out += chunk;
  if (out.includes('"id":1')) {
    clearTimeout(timer);
    const ok = out.includes('"capabilities"');
    console.log(`initialize answered with capabilities: ${ok}`);
    child.kill();
    process.exit(ok ? 0 : 1);
  }
});
