import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.user.upsert({
    where: { email: 'admin@trendwave.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@trendwave.com',
      role: 'admin',
      team: 'Operations',
      marketplace: 'All',
      status: 'active',
      shift: 'Day',
      passwordHash: await bcrypt.hash('password123', 10)
    }
  });

  await prisma.user.upsert({
    where: { email: 'ali@trendwave.com' },
    update: {},
    create: {
      name: 'Ali Khan',
      email: 'ali@trendwave.com',
      role: 'employee',
      team: 'Amazon',
      marketplace: 'Amazon',
      status: 'active',
      shift: 'Evening',
      passwordHash: await bcrypt.hash('password123', 10)
    }
  });

  await prisma.user.upsert({
    where: { email: 'usman@trendwave.com' },
    update: {},
    create: {
      name: 'Usman',
      email: 'usman@trendwave.com',
      role: 'employee',
      team: 'eBay',
      marketplace: 'eBay',
      status: 'active',
      shift: 'Night',
      passwordHash: await bcrypt.hash('password123', 10)
    }
  });

  const teams = [
    { name: 'Amazon', marketplace: 'Amazon', lead: 'Ali Khan', assigned: 12, members: 8 },
    { name: 'eBay', marketplace: 'eBay', lead: 'Usman', assigned: 8, members: 5 },
    { name: 'Development', marketplace: 'Internal', lead: 'Admin User', assigned: 5, members: 4 }
  ];

  for (const team of teams) {
    await prisma.team.upsert({
      where: { name: team.name },
      update: team,
      create: team
    });
  }

  const vpsRecords = [
    {
      name: 'Amazon-US-01',
      team: 'Amazon',
      assignedEmployee: 'Ali Khan',
      status: 'online',
      connectionId: 'a-2193',
      marketplace: 'Amazon',
      region: 'US'
    },
    {
      name: 'eBay-UK-04',
      team: 'eBay',
      assignedEmployee: 'Usman',
      status: 'offline',
      connectionId: 'e-9291',
      marketplace: 'eBay',
      region: 'UK'
    },
    {
      name: 'Dev-Lab-02',
      team: 'Development',
      assignedEmployee: 'Admin User',
      status: 'online',
      connectionId: 'd-4420',
      marketplace: 'Internal',
      region: 'US'
    }
  ];

  for (const vps of vpsRecords) {
    await prisma.vps.upsert({
      where: { connectionId: vps.connectionId },
      update: vps,
      create: vps
    });
  }

  const existingAudit = await prisma.auditLog.count();
  if (existingAudit === 0) {
    await prisma.auditLog.create({
      data: {
        actor: 'Admin User',
        action: 'Seeded portal data',
        entity: 'System'
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
