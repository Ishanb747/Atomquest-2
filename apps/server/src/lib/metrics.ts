import { Registry, Gauge, Counter } from 'prom-client';

export const register = new Registry();

// Add default metrics (optional but good practice)
import * as promClient from 'prom-client';
promClient.collectDefaultMetrics({ register });

export const activeSessionsGauge = new Gauge({
  name: 'video_support_active_sessions',
  help: 'Number of active video support sessions',
  registers: [register],
});

export const connectedParticipantsGauge = new Gauge({
  name: 'video_support_connected_participants',
  help: 'Number of currently connected participants (sockets)',
  registers: [register],
});

export const sessionsTotalCounter = new Counter({
  name: 'video_support_sessions_total',
  help: 'Total number of sessions created or ended',
  labelNames: ['status'],
  registers: [register],
});

export const messagesTotalCounter = new Counter({
  name: 'video_support_messages_total',
  help: 'Total number of chat messages sent',
  registers: [register],
});

export const errorsTotalCounter = new Counter({
  name: 'video_support_errors_total',
  help: 'Total number of errors caught in request handlers',
  labelNames: ['route', 'error_type'],
  registers: [register],
});

export const producersActiveGauge = new Gauge({
  name: 'video_support_mediasoup_producers_active',
  help: 'Number of active mediasoup producers',
  registers: [register],
});
