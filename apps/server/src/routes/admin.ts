import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { authenticateJWT, requireRole } from '../middleware/auth.js';
import { activeSessionsGauge, sessionsTotalCounter, errorsTotalCounter } from '../lib/metrics.js';
import { isMinioAvailable, getPresignedDownloadUrl } from '../lib/minio.js';

const router: Router = Router();

// GET /api/admin/sessions
router.get('/sessions', authenticateJWT, requireRole('AGENT'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    const filter: any = {};
    if (status) {
      filter.status = status;
    }

    const sessions = await prisma.session.findMany({
      where: filter,
      orderBy: { createdAt: 'desc' },
      include: {
        participants: {
          select: { id: true, role: true, joinedAt: true, leftAt: true },
        },
        _count: { select: { messages: true } },
        recordings: {
          select: { status: true, fileUrl: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
    const minioActive = await isMinioAvailable();
    const mappedSessions = await Promise.all(sessions.map(async (session) => {
      let recordingUrl = session.recordings[0]?.fileUrl;
      const recStatus = session.recordings[0]?.status;

      if (recordingUrl && recStatus === 'READY' && !recordingUrl.startsWith('http://') && !recordingUrl.startsWith('https://')) {
        if (recordingUrl.startsWith('/recordings/')) {
          recordingUrl = `http://${req.headers.host}${recordingUrl}`;
        } else if (minioActive) {
          try {
            recordingUrl = await getPresignedDownloadUrl('recordings', recordingUrl, 24 * 60 * 60);
          } catch (err) {
            console.warn('[admin] Failed to presign URL', err);
          }
        }
      }
      
      const { recordings, ...rest } = session;
      return {
        ...rest,
        recording: recordings.length > 0 ? [{ ...recordings[0], fileUrl: recordingUrl }] : [],
      };
    }));

    res.json(mappedSessions);
  } catch (err) {
    console.error('[admin] sessions list error:', err);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to list admin sessions' });
  }
});

// POST /api/admin/sessions/:id/force-end
router.post('/sessions/:id/force-end', authenticateJWT, requireRole('AGENT'), async (req: Request, res: Response): Promise<void> => {
  try {
    const session = await prisma.session.findUnique({
      where: { id: req.params.id },
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
    console.error('[admin] force-end error:', err);
    errorsTotalCounter.inc({ route: '/api/admin/sessions/:id/force-end', error_type: err.name || 'Error' });
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to force-end session' });
  }
});

export default router;
