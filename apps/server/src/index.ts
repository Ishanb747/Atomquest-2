import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import fs from 'fs';
import authRoutes from './routes/auth.js';
import sessionRoutes from './routes/sessions.js';
import adminRoutes from './routes/admin.js';
import { register, errorsTotalCounter } from './lib/metrics.js';

const app = express();
const httpServer = createServer(app);

const PORT = parseInt(process.env.PORT || '4000', 10);
const HOST = process.env.HOST || '0.0.0.0';
const WEB_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

// ── Middleware ──────────────────────────────────────────
app.use(cors({ origin: WEB_ORIGIN }));
app.use(express.json());

// ── Routes ─────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/admin', adminRoutes);

app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err);
  }
});

// Serve uploaded files (for file sharing)
const uploadsDir = path.join(process.cwd(), 'uploads');
if (fs.existsSync(uploadsDir)) {
  app.use('/uploads', express.static(uploadsDir));
}

// Serve recorded files (for call recording downloads)
const recordingsDir = path.join(process.cwd(), 'recordings');
if (!fs.existsSync(recordingsDir)) {
  fs.mkdirSync(recordingsDir, { recursive: true });
}
app.use('/recordings', express.static(recordingsDir, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.mp4')) {
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filePath)}"`);
    } else if (filePath.endsWith('.webm')) {
      res.setHeader('Content-Type', 'video/webm');
      res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filePath)}"`);
    }
  },
}));

// ── Start Server ─────────────────────────────────────────
async function start() {

  httpServer.listen(PORT, () => {
    console.log('');
    console.log('══════════════════════════════════════════');
    console.log('  AtomQuest Backend Server');
    console.log('══════════════════════════════════════════');
    console.log(`  Frontend : ${WEB_ORIGIN}`);
    console.log(`  API      : http://localhost:${PORT}`);
    console.log(`  Health   : http://localhost:${PORT}/api/health`);
    console.log(`  Auth     : POST http://localhost:${PORT}/api/auth/agent-login`);
    console.log(`  Sessions : http://localhost:${PORT}/api/sessions`);
    console.log(`  Metrics  : http://localhost:${PORT}/metrics`);
    console.log('══════════════════════════════════════════');
    console.log('');
  });
}

// Global error handler to catch unhandled errors in route handlers
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  errorsTotalCounter.inc({ route: req.path, error_type: err.name || 'Error' });
  res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message || 'Something went wrong' });
});

start();

export { app, httpServer };