import { Router, Request, Response } from 'express';
import { signToken } from '../lib/jwt.js';
import { v4 as uuidv4 } from 'uuid';

const router: Router = Router();

// Demo credentials (hardcoded for hackathon)
const DEMO_AGENT_USERNAME = 'agent';
const DEMO_AGENT_PASSWORD = 'atomquest2024';

router.post('/agent-login', (req: Request, res: Response): void => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: 'MISSING_FIELDS', message: 'Username and password required' });
    return;
  }

  if (username !== DEMO_AGENT_USERNAME || password !== DEMO_AGENT_PASSWORD) {
    res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Invalid username or password' });
    return;
  }

  const agentId = uuidv4();
  const token = signToken({ id: agentId, role: 'AGENT' }, '8h');

  res.json({ token, agentId });
});

export default router;