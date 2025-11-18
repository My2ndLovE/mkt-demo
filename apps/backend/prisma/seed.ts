import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data (development only!)
  if (process.env.NODE_ENV === 'development') {
    console.log('🗑️  Clearing existing data...');
    await prisma.auditLog.deleteMany({});
    await prisma.commission.deleteMany({});
    await prisma.bet.deleteMany({});
    await prisma.drawResult.deleteMany({});
    await prisma.refreshToken.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.serviceProvider.deleteMany({});
    await prisma.limitResetLog.deleteMany({});
  }

  // 1. Create Service Providers
  console.log('📦 Creating service providers...');
  const providers = await Promise.all([
    prisma.serviceProvider.create({
      data: {
        code: 'M',
        name: 'Magnum 4D',
        country: 'MY',
        active: true,
        availableGames: JSON.stringify(['4D']),
        betTypes: JSON.stringify(['BIG', 'SMALL', 'IBOX']),
        drawSchedule: JSON.stringify({
          days: [0, 3, 6],
          time: '19:00',
          timezone: 'Asia/Kuala_Lumpur',
        }),
        apiEndpoint: 'https://api.magayo.com/lottery/results/magnum',
        apiKey: null, // To be configured by admin
      },
    }),
    prisma.serviceProvider.create({
      data: {
        code: 'P',
        name: 'Sports Toto',
        country: 'MY',
        active: true,
        availableGames: JSON.stringify(['4D', '5D', '6D']),
        betTypes: JSON.stringify(['BIG', 'SMALL', 'IBOX']),
        drawSchedule: JSON.stringify({
          days: [0, 3, 6],
          time: '19:00',
          timezone: 'Asia/Kuala_Lumpur',
        }),
        apiEndpoint: 'https://api.magayo.com/lottery/results/toto',
      },
    }),
    prisma.serviceProvider.create({
      data: {
        code: 'T',
        name: 'Da Ma Cai',
        country: 'MY',
        active: true,
        availableGames: JSON.stringify(['3D', '4D']),
        betTypes: JSON.stringify(['BIG', 'SMALL', 'IBOX']),
        drawSchedule: JSON.stringify({
          days: [0, 3, 6],
          time: '19:00',
          timezone: 'Asia/Kuala_Lumpur',
        }),
        apiEndpoint: 'https://api.magayo.com/lottery/results/damacai',
      },
    }),
    prisma.serviceProvider.create({
      data: {
        code: 'S',
        name: 'Singapore Pools',
        country: 'SG',
        active: true,
        availableGames: JSON.stringify(['4D']),
        betTypes: JSON.stringify(['BIG', 'SMALL']),
        drawSchedule: JSON.stringify({
          days: [0, 3, 6],
          time: '18:30',
          timezone: 'Asia/Singapore',
        }),
        apiEndpoint: 'https://api.magayo.com/lottery/results/singapore',
      },
    }),
  ]);
  console.log(`✅ Created ${providers.length} service providers`);

  // 2. Create Admin User
  console.log('👤 Creating admin user...');
  const adminPassword = await bcrypt.hash('Admin@123456', 12);
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      passwordHash: adminPassword,
      role: 'ADMIN',
      fullName: 'System Administrator',
      email: 'admin@lottery-sandbox.com',
      phone: '+60123456789',
      weeklyLimit: 0,
      weeklyUsed: 0,
      commissionRate: 0,
      canCreateSubs: true,
      active: true,
    },
  });
  console.log('✅ Admin user created (username: admin, password: Admin@123456)');

  // 3. Create Moderators
  console.log('👥 Creating moderators...');
  const moderator1Password = await bcrypt.hash('Moderator@123', 12);
  const moderator2Password = await bcrypt.hash('Moderator@456', 12);

  const moderator1 = await prisma.user.create({
    data: {
      username: 'moderator01',
      passwordHash: moderator1Password,
      role: 'MODERATOR',
      fullName: 'Moderator One',
      email: 'mod1@lottery-sandbox.com',
      phone: '+60123456701',
      weeklyLimit: 1000000, // RM 1,000,000
      weeklyUsed: 0,
      commissionRate: 10,
      canCreateSubs: true,
      active: true,
    },
  });

  const moderator2 = await prisma.user.create({
    data: {
      username: 'moderator02',
      passwordHash: moderator2Password,
      role: 'MODERATOR',
      fullName: 'Moderator Two',
      email: 'mod2@lottery-sandbox.com',
      phone: '+60123456702',
      weeklyLimit: 500000, // RM 500,000
      weeklyUsed: 0,
      commissionRate: 10,
      canCreateSubs: true,
      active: true,
    },
  });
  console.log('✅ Created 2 moderators');

  // 4. Create Agent Hierarchy under Moderator 1
  console.log('🌳 Creating agent hierarchy (Moderator 1)...');
  const agentPassword = await bcrypt.hash('Agent@123', 12);

  // Level 1 Agents (Direct downlines of Moderator 1)
  const agent1 = await prisma.user.create({
    data: {
      username: 'agent001',
      passwordHash: agentPassword,
      role: 'AGENT',
      fullName: 'Agent Level 1-1',
      phone: '+60123456801',
      uplineId: moderator1.id,
      moderatorId: moderator1.id,
      weeklyLimit: 100000, // RM 100,000
      weeklyUsed: 0,
      commissionRate: 30,
      canCreateSubs: true,
      active: true,
    },
  });

  const agent2 = await prisma.user.create({
    data: {
      username: 'agent002',
      passwordHash: agentPassword,
      role: 'AGENT',
      fullName: 'Agent Level 1-2',
      phone: '+60123456802',
      uplineId: moderator1.id,
      moderatorId: moderator1.id,
      weeklyLimit: 50000,
      weeklyUsed: 0,
      commissionRate: 25,
      canCreateSubs: true,
      active: true,
    },
  });

  // Level 2 Agents (Sub-agents under agent1)
  const agent3 = await prisma.user.create({
    data: {
      username: 'agent003',
      passwordHash: agentPassword,
      role: 'AGENT',
      fullName: 'Agent Level 2-1',
      phone: '+60123456803',
      uplineId: agent1.id,
      moderatorId: moderator1.id,
      weeklyLimit: 30000,
      weeklyUsed: 0,
      commissionRate: 35,
      canCreateSubs: true,
      active: true,
    },
  });

  const agent4 = await prisma.user.create({
    data: {
      username: 'agent004',
      passwordHash: agentPassword,
      role: 'AGENT',
      fullName: 'Agent Level 2-2',
      phone: '+60123456804',
      uplineId: agent1.id,
      moderatorId: moderator1.id,
      weeklyLimit: 20000,
      weeklyUsed: 0,
      commissionRate: 40,
      canCreateSubs: true,
      active: true,
    },
  });

  // Level 3 Agents (Sub-agents under agent3)
  const agent5 = await prisma.user.create({
    data: {
      username: 'agent005',
      passwordHash: agentPassword,
      role: 'AGENT',
      fullName: 'Agent Level 3-1',
      phone: '+60123456805',
      uplineId: agent3.id,
      moderatorId: moderator1.id,
      weeklyLimit: 10000,
      weeklyUsed: 0,
      commissionRate: 45,
      canCreateSubs: true,
      active: true,
    },
  });

  console.log('✅ Created 5-level agent hierarchy under Moderator 1');

  // 5. Create Agents under Moderator 2
  console.log('🌳 Creating agent hierarchy (Moderator 2)...');
  const agent6 = await prisma.user.create({
    data: {
      username: 'agent006',
      passwordHash: agentPassword,
      role: 'AGENT',
      fullName: 'Agent Mod2 Level 1',
      phone: '+60123456806',
      uplineId: moderator2.id,
      moderatorId: moderator2.id,
      weeklyLimit: 75000,
      weeklyUsed: 0,
      commissionRate: 28,
      canCreateSubs: true,
      active: true,
    },
  });

  const agent7 = await prisma.user.create({
    data: {
      username: 'agent007',
      passwordHash: agentPassword,
      role: 'AGENT',
      fullName: 'Agent Mod2 Level 2',
      phone: '+60123456807',
      uplineId: agent6.id,
      moderatorId: moderator2.id,
      weeklyLimit: 25000,
      weeklyUsed: 0,
      commissionRate: 32,
      canCreateSubs: true,
      active: true,
    },
  });

  console.log('✅ Created 2-level agent hierarchy under Moderator 2');

  // Summary
  console.log('\n🎉 Seeding completed successfully!\n');
  console.log('📊 Summary:');
  console.log('   - Service Providers: 4 (Magnum, Toto, DaMaCai, Singapore)');
  console.log('   - Admin: 1 (username: admin)');
  console.log('   - Moderators: 2 (moderator01, moderator02)');
  console.log('   - Agents: 7 total');
  console.log('     └─ Moderator 1 org: 5 agents (3-level hierarchy)');
  console.log('     └─ Moderator 2 org: 2 agents (2-level hierarchy)');
  console.log('\n🔐 Default Login Credentials:');
  console.log('   Admin: admin / Admin@123456');
  console.log('   Moderator: moderator01 / Moderator@123');
  console.log('   Agent: agent001 / Agent@123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
