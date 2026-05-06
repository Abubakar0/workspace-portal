import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import bcrypt from 'bcryptjs';
import path from 'node:path';
import { requireAuth, signToken, AuthRequest } from './auth';
import { teams, users, vpsRecords } from './data';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '0.0.0.0';
const guacamoleBaseUrl =
  process.env.GUACAMOLE_BASE_URL || 'https://workspace-api.up.railway.app/guac';
const corsOrigins = (process.env.CLIENT_ORIGIN || 'http://127.0.0.1:4200')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: corsOrigins
  })
);
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'trend-wave-workspace-api' });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ message: 'Email and password are required' });
    return;
  }

  const user = users.find((item) => item.email.toLowerCase() === email.toLowerCase());
  const validPassword = user ? await bcrypt.compare(password, user.passwordHash) : false;

  if (!user || !validPassword) {
    res.status(401).json({ message: 'Invalid email or password' });
    return;
  }

  const token = signToken(user);

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      team: user.team
    }
  });
});

app.get('/api/auth/me', requireAuth, (req: AuthRequest, res) => {
  const user = users.find((item) => item.id === req.user?.id);

  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    team: user.team
  });
});

app.get('/api/dashboard', requireAuth, (_req, res) => {
  res.json({
    activeVps: vpsRecords.filter((item) => item.status === 'online').length,
    totalVps: vpsRecords.length,
    onlineEmployees: users.length,
    sessionsToday: 148
  });
});

app.get('/api/vps', requireAuth, (_req, res) => {
  res.json(vpsRecords);
});

app.post('/api/vps/:id/launch', requireAuth, (req, res) => {
  const vps = vpsRecords.find((item) => item.id === Number(req.params.id));

  if (!vps) {
    res.status(404).json({ message: 'VPS not found' });
    return;
  }

  res.json({
    workspaceUrl: `${guacamoleBaseUrl}/#/client/${vps.connectionId}`,
    connectionId: vps.connectionId
  });
});

app.get('/api/teams', requireAuth, (_req, res) => {
  res.json(teams);
});

app.get('/api/settings', requireAuth, (_req, res) => {
  res.json({
    companyName: 'Trend Wave Solutions',
    apiUrl: `http://127.0.0.1:${port}/api`,
    guacamoleBaseUrl,
    auth: 'JWT',
    storage: 'Seeded local backend data'
  });
});

const browserDistPath = path.resolve(__dirname, '../../dist/workspace-portal/browser');
app.use(express.static(browserDistPath));

app.get(/^(?!\/api).*/, (_req, res) => {
  res.sendFile(path.join(browserDistPath, 'index.html'));
});

app.listen(port, host, () => {
  console.log(`Trend Wave Workspace API running on http://${host}:${port}`);
});
