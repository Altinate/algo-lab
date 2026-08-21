/**
 * Zero-dependency Production Static Web Server for Hash Algorithm Visualizer
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const DIST_DIR = path.resolve(__dirname, '..', 'dist');
const DEFAULT_PORT = parseInt(process.env.PORT || '3002', 10);
const HOST = process.env.HOST || '0.0.0.0';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
};

function serveFile(req, res, filePath) {
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // SPA Fallback to index.html
      const indexPath = path.join(DIST_DIR, 'index.html');
      return fs.readFile(indexPath, (readErr, content) => {
        if (readErr) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('500 Internal Server Error');
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(content);
      });
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Cache immutable assets
    const headers = {
      'Content-Type': contentType,
      'Content-Length': stats.size,
    };
    if (filePath.includes('/assets/')) {
      headers['Cache-Control'] = 'public, max-age=31536000, immutable';
    } else {
      headers['Cache-Control'] = 'no-cache';
    }

    res.writeHead(200, headers);
    fs.createReadStream(filePath).pipe(res);
  });
}

function startServer(port) {
  const server = http.createServer((req, res) => {
    // Security: normalize URL and prevent directory traversal
    const safeUrl = path.normalize(decodeURI(req.url.split('?')[0])).replace(/^(\.\.[\/\\])+/, '');
    const reqPath = safeUrl === '/' ? '/index.html' : safeUrl;
    const targetFile = path.join(DIST_DIR, reqPath);

    serveFile(req, res, targetFile);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`⚠️  Port ${port} is in use, trying ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });

  server.listen(port, HOST, () => {
    console.log('==============================================================================');
    console.log('🚀 Hash Algorithm Visualizer is Running in Background!');
    console.log(`🌐 Local URL:   http://localhost:${port}`);
    console.log(`🌐 Network URL: http://${HOST}:${port}`);
    console.log(`📁 Serving:     ${DIST_DIR}`);
    console.log('==============================================================================');
  });
}

// Ensure dist directory exists
if (!fs.existsSync(DIST_DIR)) {
  console.error(`Error: Production build folder "${DIST_DIR}" not found. Run npm run build first.`);
  process.exit(1);
}

startServer(DEFAULT_PORT);
