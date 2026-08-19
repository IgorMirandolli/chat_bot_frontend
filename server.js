import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectDirectory = path.dirname(fileURLToPath(import.meta.url));
const defaultPort = 5500;
const port = Number(process.env.PORT) || defaultPort;
const host = process.env.HOST || "127.0.0.1";
const shouldFindAvailablePort = !process.env.PORT;
const maxPortAttempts = 10;

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};

function getPublicFile(requestUrl) {
  const pathname = decodeURIComponent(
    new URL(requestUrl, "http://localhost").pathname,
  );

  if (pathname === "/") {
    return path.join(projectDirectory, "index.html");
  }

  const isPublicAsset = pathname.startsWith("/css/") || pathname.startsWith("/js/");

  if (!isPublicAsset) {
    return undefined;
  }

  const filePath = path.resolve(projectDirectory, `.${pathname}`);
  const isInsideProject = filePath.startsWith(`${projectDirectory}${path.sep}`);

  return isInsideProject ? filePath : undefined;
}

async function handleRequest(request, response) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" });
    response.end("Metodo nao permitido.");
    return;
  }

  try {
    const filePath = getPublicFile(request.url || "/");

    if (!filePath) {
      response.writeHead(404);
      response.end("Arquivo nao encontrado.");
      return;
    }

    const content = await readFile(filePath);
    const contentType = mimeTypes[path.extname(filePath)] || "application/octet-stream";

    response.writeHead(200, {
      "Cache-Control": "no-cache",
      "Content-Type": contentType,
      "X-Content-Type-Options": "nosniff",
    });

    response.end(request.method === "HEAD" ? undefined : content);
  } catch (error) {
    if (error.code === "ENOENT") {
      response.writeHead(404);
      response.end("Arquivo nao encontrado.");
      return;
    }

    console.error(error);
    response.writeHead(500);
    response.end("Erro interno no servidor.");
  }
}

function startServer(portToUse, attempt = 0) {
  const server = createServer(handleRequest);

  server.once("error", (error) => {
    const canTryNextPort =
      error.code === "EADDRINUSE" &&
      shouldFindAvailablePort &&
      attempt < maxPortAttempts;

    if (canTryNextPort) {
      const nextPort = portToUse + 1;
      console.warn(`Porta ${portToUse} ocupada. Tentando ${nextPort}...`);
      startServer(nextPort, attempt + 1);
      return;
    }

    if (error.code === "EADDRINUSE") {
      console.error(
        `A porta ${portToUse} ja esta em uso. Defina outra porta e execute novamente.`,
      );
      process.exitCode = 1;
      return;
    }

    console.error("Nao foi possivel iniciar o servidor do frontend.", error);
    process.exitCode = 1;
  });

  server.listen(portToUse, host, () => {
    console.log(`CineMatch frontend disponivel em http://${host}:${portToUse}`);
  });
}

startServer(port);
