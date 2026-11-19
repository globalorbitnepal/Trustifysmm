import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const slotFile = path.join(root, ".live-upstream");
const listenPort = 3036;

function readUpstream() {
  try {
    const port = Number(fs.readFileSync(slotFile, "utf8").trim());
    if (port > 0 && port !== listenPort) return port;
  } catch {
    /* keep the last good port */
  }
  return null;
}

let upstream = readUpstream() || 3037;
setInterval(() => {
  const next = readUpstream();
  if (next) upstream = next;
}, 200).unref();

function proxy(req, res) {
  const headers = { ...req.headers, connection: "close" };
  const out = http.request(
    {
      hostname: "127.0.0.1",
      port: upstream,
      path: req.url,
      method: req.method,
      headers,
    },
    (incoming) => {
      const responseHeaders = { ...incoming.headers, "x-trustify-front": "1" };
      res.writeHead(incoming.statusCode || 502, responseHeaders);
      incoming.pipe(res);
    },
  );
  out.on("error", () => {
    if (!res.headersSent) {
      res.writeHead(502, { "content-type": "text/plain", "x-trustify-front": "1" });
    }
    res.end("upstream unavailable");
  });
  req.pipe(out);
}

const server = http.createServer(proxy);
server.listen(listenPort, "127.0.0.1", () => {
  process.stdout.write(`trustify front :${listenPort} -> :${upstream}\n`);
});
