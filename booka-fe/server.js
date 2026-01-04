/**
 * Server for the Booka frontend
 * This is a simple server that serves the built client files
 * It is used to serve the client files in production
 * To support the request arictecture of dockerizing the application
 */

import { createServer } from 'http';
import { readFileSync, existsSync, readdirSync, statSync, createReadStream } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 3000;
const BUILD_DIR = join(__dirname, 'build', 'client');

/**
 * Get MIME type for file extension
 */
function getMimeType(path) {
  const ext = path.split('.').pop().toLowerCase();
  const mimeTypes = {
    html: 'text/html',
    js: 'application/javascript',
    css: 'text/css',
    json: 'application/json',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    svg: 'image/svg+xml',
    ico: 'image/x-icon',
    woff: 'font/woff',
    woff2: 'font/woff2',
    ttf: 'font/ttf',
    eot: 'application/vnd.ms-fontobject',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Inject CSS link into HTML if CSS file exists
 */
function injectCSS(html) {
  let modifiedHtml = html;

  // Find CSS file in assets directory
  try {
    const assetsDir = join(BUILD_DIR, 'assets');
    const files = readdirSync(assetsDir);
    const cssFile = files.find((f) => f.endsWith('.css'));

    if (cssFile && !html.includes(cssFile)) {
      const cssPath = `/assets/${cssFile}`;
      const linkTag = `<link rel="stylesheet" href="${cssPath}">`;
      modifiedHtml = html.replace('</head>', `${linkTag}\n</head>`);
    }
  } catch (error) {
    console.warn('Could not inject CSS:', error.message);
  }

  return modifiedHtml;
}

/**
 * Serve static files
 */
const server = createServer((req, res) => {
  let filePath = join(BUILD_DIR, req.url === '/' ? 'index.html' : req.url);

  // Handle SPA routing - serve index.html for non-file requests
  if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
    filePath = join(BUILD_DIR, 'index.html');
  }

  if (!existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
    return;
  }

  const mimeType = getMimeType(filePath);
  const stat = statSync(filePath);

  // Inject CSS into HTML files
  if (mimeType === 'text/html') {
    const html = readFileSync(filePath, 'utf8');
    const modifiedHtml = injectCSS(html);
    res.writeHead(200, {
      'Content-Type': mimeType,
      'Content-Length': Buffer.byteLength(modifiedHtml),
    });
    res.end(modifiedHtml);
    return;
  }

  // Serve other files as streams
  const stream = createReadStream(filePath);
  res.writeHead(200, {
    'Content-Type': mimeType,
    'Content-Length': stat.size,
  });
  stream.pipe(res);

  stream.on('error', (error) => {
    console.error('Stream error:', error);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});

