import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Set flag to skip RLS during seeding
  process.env.SKIP_RLS = 'true';

  // 1. Create default admin
  const adminPassword = await bcrypt.hash('Admin123!', 12);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: adminPassword,
      role: 'ADMIN',
      fullName: 'System Administrator',
      email: 'admin@lottery.local',
      weeklyLimit: 0,
      weeklyUsed: 0,
      commissionRate: 0,
      active: true,
    },
  });

  console.log('✅ Admin user created:', admin.username);

  // 2. Seed service providers
  const providers = [
    {
      code: 'M',
      name: 'Magnum 4D',
      country: 'MY',
      active: true,
      availableGames: JSON.stringify(['4D']),
      betTypes: JSON.stringify(['BIG', 'SMALL', 'IBOX']),
      drawSchedule: JSON.stringify({ days: [0, 3, 6], time: '19:00' }),
      apiEndpoint: 'https://api.magayo.com/lottery/magnum',
      apiKey: null,
    },
    {
      code: 'P',
      name: 'Sports Toto',
      country: 'MY',
      active: true,
      availableGames: JSON.stringify(['4D', '5D', '6D']),
      betTypes: JSON.stringify(['BIG', 'SMALL', 'IBOX']),
      drawSchedule: JSON.stringify({ days: [0, 3, 6], time: '19:00' }),
      apiEndpoint: 'https://api.magayo.com/lottery/toto',
      apiKey: null,
    },
    {
      code: 'T',
      name: 'Damacai',
      country: 'MY',
      active: true,
      availableGames: JSON.stringify(['3D', '4D']),
      betTypes: JSON.stringify(['BIG', 'SMALL', 'IBOX']),
      drawSchedule: JSON.stringify({ days: [0, 3, 6], time: '19:00' }),
      apiEndpoint: 'https://api.magayo.com/lottery/damacai',
      apiKey: null,
    },
    {
      code: 'S',
      name: 'Singapore Pools',
      country: 'SG',
      active: true,
      availableGames: JSON.stringify(['4D']),
      betTypes: JSON.stringify(['BIG', 'SMALL']),
      drawSchedule: JSON.stringify({ days: [0, 3, 6], time: '18:30' }),
      apiEndpoint: 'https://api.magayo.com/lottery/singapore',
      apiKey: null,
    },
  ];

  for (const provider of providers) {
    await prisma.serviceProvider.upsert({
      where: { code: provider.code },
      update: provider,
      create: provider,
    });
  }

  console.log(`✅ ${providers.length} service providers seeded`);

  // 3. Create sample moderator for testing (optional)
  if (process.env.NODE_ENV === 'development') {
    const modPassword = await bcrypt.hash('Moderator123!', 12);
    const moderator = await prisma.user.upsert({
      where: { username: 'moderator1' },
      update: {},
      create: {
        username: 'moderator1',
        passwordHash: modPassword,
        role: 'MODERATOR',
        fullName: 'Test Moderator',
        email: 'moderator@lottery.local',
        weeklyLimit: 100000,
        weeklyUsed: 0,
        commissionRate: 0,
        active: true,
      },
    });

    console.log('✅ Sample moderator created:', moderator.username);

    // 4. Create sample agent under moderator
    const agentPassword = await bcrypt.hash('Agent123!', 12);
    const agent = await prisma.user.upsert({
      where: { username: 'agent1' },
      update: {},
      create: {
        username: 'agent1',
        passwordHash: agentPassword,
        role: 'AGENT',
        fullName: 'Test Agent',
        email: 'agent@lottery.local',
        weeklyLimit: 1000,
        weeklyUsed: 0,
        commissionRate: 30,
        moderatorId: moderator.id,
        active: true,
      },
    });

    console.log('✅ Sample agent created:', agent.username);
  }

  // Clear RLS skip flag
  delete process.env.SKIP_RLS;

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
