import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import bcrypt from 'bcryptjs';
import path from 'node:path';
import { requireAdmin, requireAuth, signToken, AuthRequest } from './auth';
import { auditLogs, Role, teams, users, vpsRecords } from './data';

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

function publicUser(user: (typeof users)[number]) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    team: user.team,
    marketplace: user.marketplace,
    status: user.status,
    shift: user.shift
  };
}

function addAudit(actor: string, action: string, entity: string): void {
  auditLogs.unshift({
    id: Date.now(),
    actor,
    action,
    entity,
    createdAt: new Date().toISOString()
  });
}

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
    user: publicUser(user)
  });
});

app.get('/api/auth/me', requireAuth, (req: AuthRequest, res) => {
  const user = users.find((item) => item.id === req.user?.id);

  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  res.json(publicUser(user));
});

app.get('/api/dashboard', requireAuth, (_req, res) => {
  res.json({
    activeVps: vpsRecords.filter((item) => item.status === 'online').length,
    totalVps: vpsRecords.length,
    onlineEmployees: users.length,
    sessionsToday: auditLogs.filter((item) => item.action.includes('Launched')).length,
    teams: teams.length,
    marketplaces: [...new Set(teams.map((item) => item.marketplace))].length
  });
});

app.get('/api/vps', requireAuth, (_req, res) => {
  res.json(vpsRecords);
});

app.post('/api/vps/:id/launch', requireAuth, (req, res) => {
  const vps = vpsRecords.find((item) => item.id === Number(req.params.id));
  const actor = users.find((item) => item.id === (req as AuthRequest).user?.id)?.name || 'Unknown';

  if (!vps) {
    res.status(404).json({ message: 'VPS not found' });
    return;
  }

  addAudit(actor, `Launched workspace ${vps.name}`, 'VPS');

  res.json({
    workspaceUrl: `${guacamoleBaseUrl}/#/client/${vps.connectionId}`,
    connectionId: vps.connectionId
  });
});

app.get('/api/teams', requireAuth, (_req, res) => {
  res.json(teams);
});

app.get('/api/admin/employees', requireAuth, requireAdmin, (_req, res) => {
  res.json(users.map(publicUser));
});

app.post('/api/admin/employees', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  const { name, email, password, role, team, marketplace, status, shift } = req.body as {
    name?: string;
    email?: string;
    password?: string;
    role?: Role;
    team?: string;
    marketplace?: string;
    status?: 'active' | 'inactive';
    shift?: string;
  };

  if (!name || !email || !password || !role || !team) {
    res.status(400).json({ message: 'Name, email, password, role, and team are required' });
    return;
  }

  if (users.some((item) => item.email.toLowerCase() === email.toLowerCase())) {
    res.status(409).json({ message: 'Employee email already exists' });
    return;
  }

  const employee = {
    id: Date.now(),
    name,
    email,
    role,
    team,
    marketplace: marketplace || team,
    status: status || 'active',
    shift: shift || 'Day',
    passwordHash: await bcrypt.hash(password, 10)
  };

  users.push(employee);
  addAudit(req.user?.email || 'admin', `Created employee ${employee.name}`, 'Employee');
  res.status(201).json(publicUser(employee));
});

app.put('/api/admin/employees/:id', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  const employee = users.find((item) => item.id === Number(req.params.id));

  if (!employee) {
    res.status(404).json({ message: 'Employee not found' });
    return;
  }

  const { name, email, password, role, team, marketplace, status, shift } = req.body;
  employee.name = name ?? employee.name;
  employee.email = email ?? employee.email;
  employee.role = role ?? employee.role;
  employee.team = team ?? employee.team;
  employee.marketplace = marketplace ?? employee.marketplace;
  employee.status = status ?? employee.status;
  employee.shift = shift ?? employee.shift;

  if (password) {
    employee.passwordHash = await bcrypt.hash(password, 10);
  }

  addAudit(req.user?.email || 'admin', `Updated employee ${employee.name}`, 'Employee');
  res.json(publicUser(employee));
});

app.delete('/api/admin/employees/:id', requireAuth, requireAdmin, (req: AuthRequest, res) => {
  const index = users.findIndex((item) => item.id === Number(req.params.id));

  if (index === -1) {
    res.status(404).json({ message: 'Employee not found' });
    return;
  }

  if (users[index].id === req.user?.id) {
    res.status(400).json({ message: 'You cannot delete your own admin account' });
    return;
  }

  const [removed] = users.splice(index, 1);
  addAudit(req.user?.email || 'admin', `Deleted employee ${removed.name}`, 'Employee');
  res.status(204).send();
});

app.post('/api/admin/teams', requireAuth, requireAdmin, (req: AuthRequest, res) => {
  const { name, marketplace, lead, assigned, members } = req.body;

  if (!name || !marketplace || !lead) {
    res.status(400).json({ message: 'Name, marketplace, and lead are required' });
    return;
  }

  const team = {
    id: Date.now(),
    name,
    marketplace,
    lead,
    assigned: Number(assigned || 0),
    members: Number(members || 0)
  };

  teams.push(team);
  addAudit(req.user?.email || 'admin', `Created team ${team.name}`, 'Team');
  res.status(201).json(team);
});

app.put('/api/admin/teams/:id', requireAuth, requireAdmin, (req: AuthRequest, res) => {
  const team = teams.find((item) => item.id === Number(req.params.id));

  if (!team) {
    res.status(404).json({ message: 'Team not found' });
    return;
  }

  Object.assign(team, {
    name: req.body.name ?? team.name,
    marketplace: req.body.marketplace ?? team.marketplace,
    lead: req.body.lead ?? team.lead,
    assigned: Number(req.body.assigned ?? team.assigned),
    members: Number(req.body.members ?? team.members)
  });
  addAudit(req.user?.email || 'admin', `Updated team ${team.name}`, 'Team');
  res.json(team);
});

app.delete('/api/admin/teams/:id', requireAuth, requireAdmin, (req: AuthRequest, res) => {
  const index = teams.findIndex((item) => item.id === Number(req.params.id));

  if (index === -1) {
    res.status(404).json({ message: 'Team not found' });
    return;
  }

  const [removed] = teams.splice(index, 1);
  addAudit(req.user?.email || 'admin', `Deleted team ${removed.name}`, 'Team');
  res.status(204).send();
});

app.post('/api/admin/vps', requireAuth, requireAdmin, (req: AuthRequest, res) => {
  const { name, team, assignedEmployee, status, connectionId, marketplace, region } = req.body;

  if (!name || !team || !assignedEmployee || !connectionId) {
    res.status(400).json({ message: 'Name, team, assigned employee, and connection ID are required' });
    return;
  }

  const vps = {
    id: Date.now(),
    name,
    team,
    assignedEmployee,
    status: status || 'offline',
    connectionId,
    marketplace: marketplace || team,
    region: region || 'US'
  };

  vpsRecords.push(vps);
  addAudit(req.user?.email || 'admin', `Created VPS ${vps.name}`, 'VPS');
  res.status(201).json(vps);
});

app.put('/api/admin/vps/:id', requireAuth, requireAdmin, (req: AuthRequest, res) => {
  const vps = vpsRecords.find((item) => item.id === Number(req.params.id));

  if (!vps) {
    res.status(404).json({ message: 'VPS not found' });
    return;
  }

  Object.assign(vps, {
    name: req.body.name ?? vps.name,
    team: req.body.team ?? vps.team,
    assignedEmployee: req.body.assignedEmployee ?? vps.assignedEmployee,
    status: req.body.status ?? vps.status,
    connectionId: req.body.connectionId ?? vps.connectionId,
    marketplace: req.body.marketplace ?? vps.marketplace,
    region: req.body.region ?? vps.region
  });
  addAudit(req.user?.email || 'admin', `Updated VPS ${vps.name}`, 'VPS');
  res.json(vps);
});

app.delete('/api/admin/vps/:id', requireAuth, requireAdmin, (req: AuthRequest, res) => {
  const index = vpsRecords.findIndex((item) => item.id === Number(req.params.id));

  if (index === -1) {
    res.status(404).json({ message: 'VPS not found' });
    return;
  }

  const [removed] = vpsRecords.splice(index, 1);
  addAudit(req.user?.email || 'admin', `Deleted VPS ${removed.name}`, 'VPS');
  res.status(204).send();
});

app.get('/api/admin/audit-logs', requireAuth, requireAdmin, (_req, res) => {
  res.json(auditLogs.slice(0, 100));
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
