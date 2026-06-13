import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { authenticateJWT, requireRole } from '../middleware/auth.js';
import { signToken } from '../lib/jwt.js';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { isMinioAvailable, uploadToMinio, getPresignedDownloadUrl } from '../lib/minio.js';
import { activeSessionsGauge, sessionsTotalCounter, errorsTotalCounter, messagesTotalCounter } from '../lib/metrics.js';
import { AccessToken } from 'livekit-server-sdk';

const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.bin';
    cb(null, `${uuidv4()}${ext}`);
  },
});

const ALLOWED_MIMES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
  },
});

const router: Router = Router();

router.param('id', (req: Request, res: Response, next: any, id: string) => {
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_REGEX.test(id)) {
    res.status(400).json({ error: 'INVALID_SESSION_ID', message: 'Invalid session ID format' });
    return;
  }
  next();
});

// GET /api/sessions — List all sessions (agent only)
router.get('/', authenticateJWT, requireRole('AGENT'), async (req: Request, res: Response): Promise<void> => {
  try {
    const sessions = await prisma.session.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        participants: { select: { id: true, role: true, joinedAt: true, leftAt: true } },
        _count: { select: { messages: true } },
      },
    });
    res.json(sessions);
  } catch (err) {
    console.error('[sessions] list error:', err);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to list sessions' });
  }
});

// POST /api/sessions — Create a new session (agent only)
router.post('/', authenticateJWT, requireRole('AGENT'), async (req: Request, res: Response): Promise<void> => {
  try {
    const agentId = req.user!.id;
    const session = await prisma.session.create({
      data: {
        agentId,
        status: 'ACTIVE',
        inviteToken: uuidv4(),
      },
    });

    // Create a Participant record for the agent
    await prisma.participant.create({
      data: {
        sessionId: session.id,
        role: 'AGENT',
      },
    });

    activeSessionsGauge.inc();
    sessionsTotalCounter.inc({ status: 'created' });

    const WEB_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';
    const inviteUrl = `${WEB_ORIGIN}/join/${session.inviteToken}`;

    res.status(201).json({
      sessionId: session.id,
      inviteToken: session.inviteToken,
      inviteUrl,
    });
  } catch (err: any) {
    console.error('[sessions] create error:', err);
    errorsTotalCounter.inc({ route: '/api/sessions', error_type: err.name || 'Error' });
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to create session' });
  }
});

// GET /api/sessions/by-token/:token — Resolve session by invite token (no auth needed)
router.get('/by-token/:token', async (req: Request, res: Response): Promise<void> => {
  try {
    const session = await prisma.session.findUnique({
      where: { inviteToken: req.params.token },
      select: { id: true, status: true },
    });

    if (!session) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Invite token not found' });
      return;
    }

    if (session.status === 'ENDED') {
      res.status(403).json({ error: 'SESSION_ENDED', message: 'This session has ended' });
      return;
    }

    res.json({ sessionId: session.id });
  } catch (err) {
    console.error('[sessions] by-token error:', err);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to resolve token' });
  }
});

// GET /api/sessions/:id — Get session details
router.get('/:id', authenticateJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    const session = await prisma.session.findUnique({
      where: { id: req.params.id },
      include: { participants: true },
    });

    if (!session) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Session not found' });
      return;
    }

    res.json({
      id: session.id,
      agentId: session.agentId,
      status: session.status,
      inviteToken: session.inviteToken,
      createdAt: session.createdAt,
      endedAt: session.endedAt,
      participants: session.participants,
    });
  } catch (err) {
    console.error('[sessions] get error:', err);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to get session' });
  }
});

// GET /api/sessions/:id/token — Get LiveKit token
router.get('/:id/token', authenticateJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: participantId, role } = req.user!;
    const sessionId = req.params.id;

    if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) {
      res.status(500).json({ error: 'CONFIG_ERROR', message: 'LiveKit credentials not configured' });
      return;
    }

    const at = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, {
      identity: participantId,
      name: role === 'AGENT' ? 'Support Agent' : 'Customer',
    });
    
    at.addGrant({ roomJoin: true, room: sessionId });
    const livekitToken = await at.toJwt();

    res.json({ livekitToken });
  } catch (err) {
    console.error('[sessions] token error:', err);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to generate LiveKit token' });
  }
});

// POST /api/sessions/:id/join — Customer joins via invite token
router.post('/:id/join', async (req: Request, res: Response): Promise<void> => {
  try {
    const { inviteToken } = req.body;
    if (!inviteToken) {
      res.status(400).json({ error: 'MISSING_TOKEN', message: 'inviteToken required' });
      return;
    }

    const session = await prisma.session.findUnique({
      where: { id: req.params.id },
      include: { participants: true },
    });

    if (!session) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Session not found' });
      return;
    }

    if (session.inviteToken !== inviteToken) {
      res.status(403).json({ error: 'INVALID_TOKEN', message: 'Invalid invite token' });
      return;
    }

    if (session.status === 'ENDED') {
      res.status(403).json({ error: 'SESSION_ENDED', message: 'This session has ended' });
      return;
    }

    // Check if a customer already joined (capacity 1)
    const existingCustomer = session.participants.find((p) => p.role === 'CUSTOMER' && !p.leftAt);
    if (existingCustomer) {
      res.status(409).json({ error: 'SESSION_FULL', message: 'Session is already in progress' });
      return;
    }

    // Create customer participant
    const participant = await prisma.participant.create({
      data: {
        sessionId: session.id,
        role: 'CUSTOMER',
      },
    });

    // Generate short-lived JWT for customer
    const token = signToken({ id: participant.id, role: 'CUSTOMER', sessionId: session.id }, '24h');

    // Generate LiveKit token
    if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) {
      res.status(500).json({ error: 'CONFIG_ERROR', message: 'LiveKit credentials not configured' });
      return;
    }

    const at = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, {
      identity: participant.id,
      name: 'Customer',
    });
    
    at.addGrant({ roomJoin: true, room: session.id });
    const livekitToken = await at.toJwt();

    res.json({ token, livekitToken, sessionId: session.id, role: 'CUSTOMER', participantId: participant.id });
  } catch (err) {
    console.error('[sessions] join error:', err);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to join session' });
  }
});

// POST /api/sessions/:id/end — End a session (agent only)
router.post('/:id/end', authenticateJWT, requireRole('AGENT'), async (req: Request, res: Response): Promise<void> => {
  try {
    const session = await prisma.session.findUnique({
      where: { id: req.params.id },
      include: { participants: true },
    });

    if (!session) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Session not found' });
      return;
    }

    if (session.status === 'ENDED') {
      res.status(400).json({ error: 'ALREADY_ENDED', message: 'Session already ended' });
      return;
    }

    // Update session status
    await prisma.session.update({
      where: { id: session.id },
      data: { status: 'ENDED', endedAt: new Date() },
    });

    // Close all open participant records
    await prisma.participant.updateMany({
      where: { sessionId: session.id, leftAt: null },
      data: { leftAt: new Date() },
    });

    activeSessionsGauge.dec();
    sessionsTotalCounter.inc({ status: 'ended' });

    res.json({ ok: true });
  } catch (err: any) {
    console.error('[sessions] end error:', err);
    errorsTotalCounter.inc({ route: '/api/sessions/:id/end', error_type: err.name || 'Error' });
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to end session' });
  }
});

// GET /api/sessions/:id/history — Full session history
router.get('/:id/history', authenticateJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    const session = await prisma.session.findUnique({
      where: { id: req.params.id },
      include: {
        participants: { orderBy: { joinedAt: 'asc' } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!session) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Session not found' });
      return;
    }

    const messages = await mapMessages(session.messages);

    res.json({
      id: session.id,
      status: session.status,
      createdAt: session.createdAt,
      endedAt: session.endedAt,
      participants: session.participants.map((p) => ({
        id: p.id,
        role: p.role,
        joinedAt: p.joinedAt,
        leftAt: p.leftAt,
        duration: p.leftAt ? Math.floor((p.leftAt.getTime() - p.joinedAt.getTime()) / 1000) : null,
      })),
      messages,
    });
  } catch (err) {
    console.error('[sessions] history error:', err);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to get session history' });
  }
});

// GET /api/sessions/:id/messages — Message history
router.get('/:id/messages', authenticateJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    const messages = await prisma.message.findMany({
      where: { sessionId: req.params.id },
      orderBy: { createdAt: 'asc' },
    });
    res.json(await mapMessages(messages));
  } catch (err) {
    console.error('[sessions] messages error:', err);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to get messages' });
  }
});

// POST /api/sessions/:id/messages — Send message
router.post('/:id/messages', authenticateJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    const { content } = req.body;
    if (!content) {
      res.status(400).json({ error: 'MISSING_CONTENT', message: 'Content required' });
      return;
    }
    const { id: senderId, role } = req.user!;
    const message = await prisma.message.create({
      data: {
        sessionId: req.params.id,
        senderId,
        role: role as 'AGENT' | 'CUSTOMER',
        content,
      },
    });
    messagesTotalCounter.inc();
    res.json(message);
  } catch (err: any) {
    console.error('[sessions] send message error:', err);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to send message' });
  }
});

// POST /api/sessions/:id/upload — Upload a file for chat (requires JWT)
router.post('/:id/upload', authenticateJWT, upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'NO_FILE', message: 'No file uploaded' });
      return;
    }

    const { id: senderId, role } = req.user!;
    const fileName = Buffer.from(file.originalname, 'latin1')
      .toString('utf8')
      .replace(/<[^>]*>/g, '')
      .trim();

    const minioActive = await isMinioAvailable();
    let fileUrl = `/uploads/${file.filename}`;

    if (minioActive) {
      const ext = path.extname(file.originalname) || '.bin';
      const objectKey = `sessions/${req.params.id}/${uuidv4()}${ext}`;
      try {
        await uploadToMinio('chat-files', objectKey, file.path, file.mimetype);
        fs.unlinkSync(file.path);
        fileUrl = objectKey;
      } catch (err: any) {
        console.warn(`[sessions] MinIO upload failed, using local:`, err.message);
      }
    }

    // Save a Message record with file attachment
    const message = await prisma.message.create({
      data: {
        sessionId: req.params.id,
        senderId,
        role: role as 'AGENT' | 'CUSTOMER',
        content: fileName,
        fileUrl,
        fileType: file.mimetype,
        fileName,
      },
    });

    let broadcastUrl = fileUrl;
    if (minioActive && !fileUrl.startsWith('/uploads/')) {
      try {
        broadcastUrl = await getPresignedDownloadUrl('chat-files', fileUrl, 24 * 60 * 60);
      } catch (err: any) {
        console.warn('[sessions] Failed to presign URL for broadcast:', err.message);
      }
    }

    const broadcastMessage = {
      ...message,
      fileUrl: broadcastUrl,
    };

    messagesTotalCounter.inc();
    res.json(broadcastMessage);
  } catch (err: any) {
    console.error('[sessions] upload error:', err);
    errorsTotalCounter.inc({ route: '/api/sessions/:id/upload', error_type: err.name || 'Error' });
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to upload file' });
  }
});

// GET /api/sessions/:id/recording — Get recording status
router.get('/:id/recording', authenticateJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    const recording = await prisma.recording.findFirst({
      where: { sessionId: req.params.id },
      orderBy: { createdAt: 'desc' },
    });

    if (!recording) {
      res.json({ status: 'NONE' });
      return;
    }

    let fileUrl = recording.fileUrl;

    // Make relative recording URLs absolute to the server host
    if (fileUrl && fileUrl.startsWith('/recordings/')) {
      fileUrl = `http://${req.headers.host}${fileUrl}`;
    }

    if (recording.status === 'READY' && fileUrl && !fileUrl.startsWith('http://') && !fileUrl.startsWith('https://')) {
      const minioActive = await isMinioAvailable();
      if (minioActive) {
        try {
          fileUrl = await getPresignedDownloadUrl('recordings', fileUrl, 15 * 60);
        } catch (err: any) {
          console.warn('[sessions] Failed to presign recording URL:', err.message);
        }
      }
    }

    res.json({
      status: recording.status,
      fileUrl,
      createdAt: recording.createdAt,
    });
  } catch (err) {
    console.error('[sessions] recording status error:', err);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to get recording status' });
  }
});


async function mapMessages(messages: any[]) {
  const minioActive = await isMinioAvailable();
  if (!minioActive) return messages;

  return await Promise.all(messages.map(async (msg) => {
    if (msg.fileUrl && !msg.fileUrl.startsWith('/uploads/')) {
      try {
        const freshUrl = await getPresignedDownloadUrl('chat-files', msg.fileUrl, 24 * 60 * 60);
        return { ...msg, fileUrl: freshUrl };
      } catch (err: any) {
        console.warn(`[sessions] Failed to presign URL for message ${msg.id}:`, err.message);
      }
    }
    return msg;
  }));
}

export default router;
