import cors from 'cors';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import path from 'node:path';
import type { User, Vps } from '@prisma/client';
import { requireAdmin, requireAuth, signToken, AuthRequest } from './auth';
import { prisma } from './db';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '0.0.0.0';
const guacamoleBaseUrl = normalizeGuacamoleUrl(
  process.env.GUACAMOLE_BASE_URL || 'https://guacamole-railway-production-4b08.up.railway.app/guacamole'
);
const corsOrigins = (process.env.CLIENT_ORIGIN || 'http://127.0.0.1:4200')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({ origin: corsOrigins }));
app.use(express.json());

function normalizeGuacamoleUrl(url: string): string {
  return url.replace(/\/#\/?$/, '').replace(/\/$/, '');
}

function publicUser(user: User) {
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

async function currentActor(req: AuthRequest): Promise<string> {
  if (!req.user?.id) {
    return 'Unknown';
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { name: true, email: true }
  });

  return user?.name || user?.email || 'Unknown';
}

async function addAudit(actor: string, action: string, entity: string): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actor,
      action,
      entity
    }
  });
}

function parseId(req: Request): number {
  return Number(req.params.id);
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'trend-wave-workspace-api', database: 'postgresql' });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ message: 'Email and password are required' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  });
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

app.get('/api/auth/me', requireAuth, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user?.id }
  });

  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  res.json(publicUser(user));
});

app.get('/api/dashboard', requireAuth, async (_req, res) => {
  const [activeVps, totalVps, onlineEmployees, launchSessions, teams] = await Promise.all([
    prisma.vps.count({ where: { status: 'online' } }),
    prisma.vps.count(),
    prisma.user.count({ where: { status: 'active' } }),
    prisma.auditLog.count({ where: { action: { contains: 'Launched' } } }),
    prisma.team.findMany({ select: { marketplace: true } })
  ]);

  res.json({
    activeVps,
    totalVps,
    onlineEmployees,
    sessionsToday: launchSessions,
    teams: teams.length,
    marketplaces: new Set(teams.map((item) => item.marketplace)).size
  });
});

app.get('/api/vps', requireAuth, async (_req, res) => {
  res.json(await prisma.vps.findMany({ orderBy: { id: 'asc' } }));
});

app.post('/api/vps/:id/launch', requireAuth, async (req: AuthRequest, res) => {
  const vps = await prisma.vps.findUnique({
    where: { id: parseId(req) }
  });

  if (!vps) {
    res.status(404).json({ message: 'VPS not found' });
    return;
  }

  await addAudit(await currentActor(req), `Launched workspace ${vps.name}`, 'VPS');

  res.json({
    workspaceUrl: `${guacamoleBaseUrl}/#/client/${vps.connectionId}`,
    connectionId: vps.connectionId
  });
});

app.get('/api/teams', requireAuth, async (_req, res) => {
  res.json(await prisma.team.findMany({ orderBy: { id: 'asc' } }));
});

app.get('/api/admin/employees', requireAuth, requireAdmin, async (_req, res) => {
  const users = await prisma.user.findMany({ orderBy: { id: 'asc' } });
  res.json(users.map(publicUser));
});

app.post('/api/admin/employees', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  const { name, email, password, role, team, marketplace, status, shift } = req.body as {
    name?: string;
    email?: string;
    password?: string;
    role?: string;
    team?: string;
    marketplace?: string;
    status?: string;
    shift?: string;
  };

  if (!name || !email || !password || !role || !team) {
    res.status(400).json({ message: 'Name, email, password, role, and team are required' });
    return;
  }

  try {
    const employee = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        role,
        team,
        marketplace: marketplace || team,
        status: status || 'active',
        shift: shift || 'Day',
        passwordHash: await bcrypt.hash(password, 10)
      }
    });

    await addAudit(await currentActor(req), `Created employee ${employee.name}`, 'Employee');
    res.status(201).json(publicUser(employee));
  } catch {
    res.status(409).json({ message: 'Employee email already exists' });
  }
});

app.put('/api/admin/employees/:id', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  const existing = await prisma.user.findUnique({ where: { id: parseId(req) } });

  if (!existing) {
    res.status(404).json({ message: 'Employee not found' });
    return;
  }

  const { name, email, password, role, team, marketplace, status, shift } = req.body;
  const employee = await prisma.user.update({
    where: { id: existing.id },
    data: {
      name: name ?? existing.name,
      email: email ? String(email).toLowerCase() : existing.email,
      role: role ?? existing.role,
      team: team ?? existing.team,
      marketplace: marketplace ?? existing.marketplace,
      status: status ?? existing.status,
      shift: shift ?? existing.shift,
      passwordHash: password ? await bcrypt.hash(password, 10) : existing.passwordHash
    }
  });

  await addAudit(await currentActor(req), `Updated employee ${employee.name}`, 'Employee');
  res.json(publicUser(employee));
});

app.delete('/api/admin/employees/:id', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  const id = parseId(req);

  if (id === req.user?.id) {
    res.status(400).json({ message: 'You cannot delete your own admin account' });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ message: 'Employee not found' });
    return;
  }

  await prisma.user.delete({ where: { id } });
  await addAudit(await currentActor(req), `Deleted employee ${existing.name}`, 'Employee');
  res.status(204).send();
});

app.post('/api/admin/teams', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  const { name, marketplace, lead, assigned, members } = req.body;

  if (!name || !marketplace || !lead) {
    res.status(400).json({ message: 'Name, marketplace, and lead are required' });
    return;
  }

  try {
    const team = await prisma.team.create({
      data: {
        name,
        marketplace,
        lead,
        assigned: Number(assigned || 0),
        members: Number(members || 0)
      }
    });

    await addAudit(await currentActor(req), `Created team ${team.name}`, 'Team');
    res.status(201).json(team);
  } catch {
    res.status(409).json({ message: 'Team name already exists' });
  }
});

app.put('/api/admin/teams/:id', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  const existing = await prisma.team.findUnique({ where: { id: parseId(req) } });

  if (!existing) {
    res.status(404).json({ message: 'Team not found' });
    return;
  }

  const team = await prisma.team.update({
    where: { id: existing.id },
    data: {
      name: req.body.name ?? existing.name,
      marketplace: req.body.marketplace ?? existing.marketplace,
      lead: req.body.lead ?? existing.lead,
      assigned: Number(req.body.assigned ?? existing.assigned),
      members: Number(req.body.members ?? existing.members)
    }
  });

  await addAudit(await currentActor(req), `Updated team ${team.name}`, 'Team');
  res.json(team);
});

app.delete('/api/admin/teams/:id', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  const id = parseId(req);
  const existing = await prisma.team.findUnique({ where: { id } });

  if (!existing) {
    res.status(404).json({ message: 'Team not found' });
    return;
  }

  await prisma.team.delete({ where: { id } });
  await addAudit(await currentActor(req), `Deleted team ${existing.name}`, 'Team');
  res.status(204).send();
});

app.post('/api/admin/vps', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  const { name, team, assignedEmployee, status, connectionId, marketplace, region } = req.body as Partial<Vps>;

  if (!name || !team || !assignedEmployee || !connectionId) {
    res.status(400).json({ message: 'Name, team, assigned employee, and connection ID are required' });
    return;
  }

  try {
    const vps = await prisma.vps.create({
      data: {
        name,
        team,
        assignedEmployee,
        status: status || 'offline',
        connectionId,
        marketplace: marketplace || team,
        region: region || 'US'
      }
    });

    await addAudit(await currentActor(req), `Created VPS ${vps.name}`, 'VPS');
    res.status(201).json(vps);
  } catch {
    res.status(409).json({ message: 'VPS name or connection ID already exists' });
  }
});

app.put('/api/admin/vps/:id', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  const existing = await prisma.vps.findUnique({ where: { id: parseId(req) } });

  if (!existing) {
    res.status(404).json({ message: 'VPS not found' });
    return;
  }

  const vps = await prisma.vps.update({
    where: { id: existing.id },
    data: {
      name: req.body.name ?? existing.name,
      team: req.body.team ?? existing.team,
      assignedEmployee: req.body.assignedEmployee ?? existing.assignedEmployee,
      status: req.body.status ?? existing.status,
      connectionId: req.body.connectionId ?? existing.connectionId,
      marketplace: req.body.marketplace ?? existing.marketplace,
      region: req.body.region ?? existing.region
    }
  });

  await addAudit(await currentActor(req), `Updated VPS ${vps.name}`, 'VPS');
  res.json(vps);
});

app.delete('/api/admin/vps/:id', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  const id = parseId(req);
  const existing = await prisma.vps.findUnique({ where: { id } });

  if (!existing) {
    res.status(404).json({ message: 'VPS not found' });
    return;
  }

  await prisma.vps.delete({ where: { id } });
  await addAudit(await currentActor(req), `Deleted VPS ${existing.name}`, 'VPS');
  res.status(204).send();
});

app.get('/api/admin/audit-logs', requireAuth, requireAdmin, async (_req, res) => {
  res.json(await prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }));
});

app.get('/api/settings', requireAuth, (_req, res) => {
  res.json({
    companyName: 'Trend Wave Solutions',
    apiUrl: `http://127.0.0.1:${port}/api`,
    guacamoleBaseUrl,
    auth: 'JWT',
    storage: 'Railway PostgreSQL via Prisma'
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
