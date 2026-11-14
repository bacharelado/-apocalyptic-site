/**
 * Servidor exclusivamente local para desenvolvimento e testes.
 * Reproduz rotas HTML sem extensão, redirecionamentos e o 404 do Pages.
 * Não publica arquivos nem usa credenciais de hospedagem.
 */
import { createServer as createHttpServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../', import.meta.url)));
const pages = new Set(['index', 'servicos', 'metodologia', 'sobre', 'contato']);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

export async function createPreviewServer() {
  const headersFile = await readFile(resolve(root, '_headers'), 'utf8');
  const publicHeaders = {};
  for (const line of headersFile.split('\n')) {
    const match = line.match(/^\s+([^:]+):\s*(.+)$/);
    if (match) publicHeaders[match[1]] = match[2];
  }

  return createHttpServer(async (request, response) => {
    for (const [name, value] of Object.entries(publicHeaders)) response.setHeader(name, value);
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Robots-Tag', 'noindex');

    if (!['GET', 'HEAD'].includes(request.method)) {
      response.writeHead(405, { Allow: 'GET, HEAD' });
      response.end();
      return;
    }

    try {
      const url = new URL(request.url, 'http://localhost');
      let pathname;
      try {
        pathname = decodeURIComponent(url.pathname);
      } catch {
        response.writeHead(400);
        response.end();
        return;
      }

      let relative;
      let statusCode = 200;
      const htmlPage = pathname.match(/^\/([a-z-]+)\.html$/)?.[1];

      if (htmlPage && pages.has(htmlPage)) {
        const destination = htmlPage === 'index' ? '/' : '/' + htmlPage;
        response.writeHead(308, { Location: destination + url.search });
        response.end();
        return;
      }

      if (pathname === '/') relative = 'index.html';
      else if (pages.has(pathname.slice(1))) relative = pathname.slice(1) + '.html';
      else if (['/robots.txt', '/sitemap.xml'].includes(pathname)) relative = pathname.slice(1);
      else if (/^\/(assets|css|js)\/[a-zA-Z0-9/._-]+\.(svg|css|js)$/.test(pathname)) {
        relative = pathname.slice(1);
      } else {
        relative = '404.html';
        statusCode = 404;
      }

      let filename = resolve(root, relative);
      if (!filename.startsWith(root + sep)) throw new Error('Invalid local path');

      try {
        if (!(await stat(filename)).isFile()) throw new Error('Not a file');
      } catch {
        filename = resolve(root, '404.html');
        statusCode = 404;
      }

      const data = await readFile(filename);
      response.writeHead(statusCode, {
        'Content-Type': types[extname(filename)] || 'application/octet-stream',
        'Content-Length': data.length,
      });
      response.end(request.method === 'HEAD' ? undefined : data);
    } catch {
      response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Falha no servidor de desenvolvimento.');
    }
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const server = await createPreviewServer();
  const port = Number(process.env.PORT || 4174);
  server.listen(port, '127.0.0.1', () => {
    console.log('Prévia local: http://127.0.0.1:' + port);
  });
}
