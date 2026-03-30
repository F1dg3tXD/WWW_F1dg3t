const http = require("http");
const fs = require("fs/promises");
const path = require("path");

const PORT = Number(process.env.PORT) || 3000;
const ROOT = __dirname;
const DATA_FILE = path.join(ROOT, "data.json");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(body);
}

async function serveStatic(reqPath, res) {
  const rawPath = reqPath === "/" ? "/index.html" : reqPath;
  const safePath = path.normalize(rawPath).replace(/^\.\.(\/|\\|$)/, "");
  const filePath = path.join(ROOT, safePath);

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  try {
    const data = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(data);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not Found");
  }
}

async function handleApi(req, res) {
  if (req.method === "GET") {
    try {
      const raw = await fs.readFile(DATA_FILE, "utf8");
      return sendJson(res, 200, JSON.parse(raw));
    } catch (error) {
      return sendJson(res, 500, { error: `Unable to read data file: ${error.message}` });
    }
  }

  if (req.method === "PUT") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 256000) {
        req.destroy();
      }
    });

    req.on("end", async () => {
      try {
        const parsed = JSON.parse(body || "{}");
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          return sendJson(res, 400, { error: "Body must be a JSON object." });
        }

        const normalized = {
          timezone: String(parsed.timezone ?? ""),
          location: String(parsed.location ?? ""),
          why: String(parsed.why ?? ""),
          what: String(parsed.what ?? ""),
        };

        await fs.writeFile(DATA_FILE, `${JSON.stringify(normalized, null, 4)}\n`, "utf8");
        return sendJson(res, 200, { ok: true, data: normalized });
      } catch (error) {
        return sendJson(res, 500, { error: `Unable to write data file: ${error.message}` });
      }
    });

    return;
  }

  sendJson(res, 405, { error: "Method not allowed." });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  if (url.pathname === "/api/data") {
    await handleApi(req, res);
    return;
  }

  await serveStatic(url.pathname, res);
});

server.listen(PORT, () => {
  console.log(`Profile JSON editor server running on http://localhost:${PORT}`);
});
