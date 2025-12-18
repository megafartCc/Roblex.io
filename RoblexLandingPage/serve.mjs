import express from 'express';
import compression from 'compression';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, 'dist');
const port = Number(process.env.PORT) || 3000;

const app = express();
app.use(compression());

// Serve directory index.html files when hitting extensionless routes like /admin/login
app.use((req, res, next) => {
  if (req.method !== 'GET') {
    return next();
  }

  const requestedPath = decodeURIComponent(req.path || '/');
  if (path.extname(requestedPath)) {
    return next();
  }

  const trimmed = requestedPath.replace(/^\/+/, '');
  const candidate = path.resolve(distDir, trimmed, 'index.html');

  if (!candidate.startsWith(distDir)) {
    return next();
  }

  if (fs.existsSync(candidate)) {
    return res.sendFile(candidate);
  }

  return next();
});

app.use(express.static(distDir, { extensions: ['html'] }));

app.use((req, res) => {
  res.status(404).send('Not Found');
});

app.listen(port, () => {
  console.log(`Landing page server listening on port ${port}`);
});