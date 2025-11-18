import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Hash password helper
  const hashPassword = async (password: string): Promise<string> => {
    return await bcrypt.hash(password, 10);
  };

  // 1. Create Service Providers
  console.log('📦 Creating service providers...');

  const magnum = await prisma.serviceProvider.upsert({
    where: { code: 'M' },
    update: {},
    create: {
      code: 'M',
      name: 'Magnum 4D',
      country: 'MY',
      active: true,
      availableGames: JSON.stringify(['3D', '4D', '5D', '6D']),
      betTypes: JSON.stringify(['BIG', 'SMALL', 'IBOX']),
      drawSchedule: JSON.stringify({
        days: [0, 3, 6], // Sun, Wed, Sat
        time: '19:00',
        timezone: 'Asia/Kuala_Lumpur'
      }),
      apiEndpoint: 'https://api.magayo.com/lottery/results/magnum',
      apiKey: null // Set via admin panel with encryption
    }
  });

  const sportsToto = await prisma.serviceProvider.upsert({
    where: { code: 'P' },
    update: {},
    create: {
      code: 'P',
      name: 'Sports Toto',
      country: 'MY',
      active: true,
      availableGames: JSON.stringify(['3D', '4D', '5D', '6D']),
      betTypes: JSON.stringify(['BIG', 'SMALL', 'IBOX']),
      drawSchedule: JSON.stringify({
        days: [0, 3, 6],
        time: '19:00',
        timezone: 'Asia/Kuala_Lumpur'
      }),
      apiEndpoint: 'https://api.magayo.com/lottery/results/toto',
      apiKey: null
    }
  });

  const damacai = await prisma.serviceProvider.upsert({
    where: { code: 'T' },
    update: {},
    create: {
      code: 'T',
      name: 'Da Ma Cai',
      country: 'MY',
      active: true,
      availableGames: JSON.stringify(['3D', '4D', '5D', '6D']),
      betTypes: JSON.stringify(['BIG', 'SMALL', 'IBOX']),
      drawSchedule: JSON.stringify({
        days: [0, 3, 6],
        time: '19:00',
        timezone: 'Asia/Kuala_Lumpur'
      }),
      apiEndpoint: 'https://api.magayo.com/lottery/results/damacai',
      apiKey: null
    }
  });

  const singaporePools = await prisma.serviceProvider.upsert({
    where: { code: 'S' },
    update: {},
    create: {
      code: 'S',
      name: 'Singapore Pools',
      country: 'SG',
      active: true,
      availableGames: JSON.stringify(['4D']),
      betTypes: JSON.stringify(['BIG', 'SMALL']),
      drawSchedule: JSON.stringify({
        days: [0, 3, 6],
        time: '18:30',
        timezone: 'Asia/Singapore'
      }),
      apiEndpoint: 'https://api.singaporepools.com.sg/lottery/4d',
      apiKey: null
    }
  });

  console.log('✅ Service providers created');

  // 2. Create ADMIN user
  console.log('👑 Creating admin user...');

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: await hashPassword('Admin@123456'),
      role: 'ADMIN',
      fullName: 'System Administrator',
      email: 'admin@lottery-sandbox.com',
      phone: '+60123456789',
      uplineId: null,
      moderatorId: null,
      weeklyLimit: 0, // No limit for admin
      weeklyUsed: 0,
      commissionRate: 0,
      canCreateSubs: true,
      active: true,
      firstLogin: false // Admin already set up
    }
  });

  console.log('✅ Admin created');

  // 3. Create MODERATOR users
  console.log('👔 Creating moderator users...');

  const moderator1 = await prisma.user.upsert({
    where: { username: 'mod_kl' },
    update: {},
    create: {
      username: 'mod_kl',
      passwordHash: await hashPassword('Moderator@123'),
      role: 'MODERATOR',
      fullName: 'Moderator Kuala Lumpur',
      email: 'mod.kl@lottery-sandbox.com',
      phone: '+60121111111',
      uplineId: null,
      moderatorId: null,
      weeklyLimit: 0,
      weeklyUsed: 0,
      commissionRate: 0,
      canCreateSubs: true,
      active: true,
      firstLogin: true
    }
  });

  const moderator2 = await prisma.user.upsert({
    where: { username: 'mod_penang' },
    update: {},
    create: {
      username: 'mod_penang',
      passwordHash: await hashPassword('Moderator@123'),
      role: 'MODERATOR',
      fullName: 'Moderator Penang',
      email: 'mod.penang@lottery-sandbox.com',
      phone: '+60122222222',
      uplineId: null,
      moderatorId: null,
      weeklyLimit: 0,
      weeklyUsed: 0,
      commissionRate: 0,
      canCreateSubs: true,
      active: true,
      firstLogin: true
    }
  });

  console.log('✅ Moderators created');

  // 4. Create Agent Hierarchy (Multi-level MLM structure)
  console.log('🏢 Creating agent hierarchy...');

  // Level 1: Master Agents (direct under moderator)
  const masterAgent1 = await prisma.user.upsert({
    where: { username: 'master001' },
    update: {},
    create: {
      username: 'master001',
      passwordHash: await hashPassword('master001_1234'),
      role: 'AGENT',
      fullName: 'Master Agent Wong',
      phone: '+60123000001',
      uplineId: null,
      moderatorId: moderator1.id,
      weeklyLimit: 100000, // RM 100,000
      weeklyUsed: 0,
      commissionRate: 30, // 30%
      canCreateSubs: true,
      active: true,
      firstLogin: true
    }
  });

  const masterAgent2 = await prisma.user.upsert({
    where: { username: 'master002' },
    update: {},
    create: {
      username: 'master002',
      passwordHash: await hashPassword('master002_1234'),
      role: 'AGENT',
      fullName: 'Master Agent Tan',
      phone: '+60123000002',
      uplineId: null,
      moderatorId: moderator1.id,
      weeklyLimit: 80000, // RM 80,000
      weeklyUsed: 0,
      commissionRate: 28,
      canCreateSubs: true,
      active: true,
      firstLogin: true
    }
  });

  // Level 2: Senior Agents (under master agents)
  const seniorAgent1 = await prisma.user.upsert({
    where: { username: 'senior001' },
    update: {},
    create: {
      username: 'senior001',
      passwordHash: await hashPassword('senior001_5678'),
      role: 'AGENT',
      fullName: 'Senior Agent Lee',
      phone: '+60123100001',
      uplineId: masterAgent1.id,
      moderatorId: moderator1.id,
      weeklyLimit: 50000, // RM 50,000
      weeklyUsed: 0,
      commissionRate: 20, // Lower than master
      canCreateSubs: true,
      active: true,
      firstLogin: true
    }
  });

  const seniorAgent2 = await prisma.user.upsert({
    where: { username: 'senior002' },
    update: {},
    create: {
      username: 'senior002',
      passwordHash: await hashPassword('senior002_5678'),
      role: 'AGENT',
      fullName: 'Senior Agent Lim',
      phone: '+60123100002',
      uplineId: masterAgent1.id,
      moderatorId: moderator1.id,
      weeklyLimit: 40000,
      weeklyUsed: 0,
      commissionRate: 18,
      canCreateSubs: true,
      active: true,
      firstLogin: true
    }
  });

  // Level 3: Regular Agents (under senior agents)
  const agent1 = await prisma.user.upsert({
    where: { username: 'agent001' },
    update: {},
    create: {
      username: 'agent001',
      passwordHash: await hashPassword('agent001_9012'),
      role: 'AGENT',
      fullName: 'Agent Chong',
      phone: '+60123200001',
      uplineId: seniorAgent1.id,
      moderatorId: moderator1.id,
      weeklyLimit: 20000, // RM 20,000
      weeklyUsed: 0,
      commissionRate: 12,
      canCreateSubs: true,
      active: true,
      firstLogin: true
    }
  });

  const agent2 = await prisma.user.upsert({
    where: { username: 'agent002' },
    update: {},
    create: {
      username: 'agent002',
      passwordHash: await hashPassword('agent002_9012'),
      role: 'AGENT',
      fullName: 'Agent Kumar',
      phone: '+60123200002',
      uplineId: seniorAgent1.id,
      moderatorId: moderator1.id,
      weeklyLimit: 15000,
      weeklyUsed: 0,
      commissionRate: 10,
      canCreateSubs: true,
      active: true,
      firstLogin: true
    }
  });

  const agent3 = await prisma.user.upsert({
    where: { username: 'agent003' },
    update: {},
    create: {
      username: 'agent003',
      passwordHash: await hashPassword('agent003_9012'),
      role: 'AGENT',
      fullName: 'Agent Siti',
      phone: '+60123200003',
      uplineId: seniorAgent2.id,
      moderatorId: moderator1.id,
      weeklyLimit: 18000,
      weeklyUsed: 0,
      commissionRate: 11,
      canCreateSubs: true,
      active: true,
      firstLogin: true
    }
  });

  // Level 4: Sub-Agents (under regular agents)
  const subAgent1 = await prisma.user.upsert({
    where: { username: 'subagent001' },
    update: {},
    create: {
      username: 'subagent001',
      passwordHash: await hashPassword('subagent001_3456'),
      role: 'AGENT',
      fullName: 'Sub-Agent Ali',
      phone: '+60123300001',
      uplineId: agent1.id,
      moderatorId: moderator1.id,
      weeklyLimit: 8000, // RM 8,000
      weeklyUsed: 0,
      commissionRate: 8,
      canCreateSubs: false, // Cannot create more sub-agents
      active: true,
      firstLogin: true
    }
  });

  const subAgent2 = await prisma.user.upsert({
    where: { username: 'subagent002' },
    update: {},
    create: {
      username: 'subagent002',
      passwordHash: await hashPassword('subagent002_3456'),
      role: 'AGENT',
      fullName: 'Sub-Agent Muthu',
      phone: '+60123300002',
      uplineId: agent2.id,
      moderatorId: moderator1.id,
      weeklyLimit: 6000,
      weeklyUsed: 0,
      commissionRate: 7,
      canCreateSubs: false,
      active: true,
      firstLogin: true
    }
  });

  console.log('✅ Agent hierarchy created (4 levels deep)');

  // 5. Create sample bets for testing
  console.log('🎲 Creating sample bets...');

  // Get next draw date (next Wednesday)
  const getNextDrawDate = (): Date => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilWednesday = (3 - dayOfWeek + 7) % 7 || 7;
    const nextWednesday = new Date(today);
    nextWednesday.setDate(today.getDate() + daysUntilWednesday);
    nextWednesday.setHours(19, 0, 0, 0);
    return nextWednesday;
  };

  const drawDate = getNextDrawDate();

  const bet1 = await prisma.bet.create({
    data: {
      agentId: agent1.id,
      gameType: '4D',
      betType: 'BIG',
      numbers: '1234',
      amount: 30, // RM 10 × 3 providers
      drawDate,
      status: 'PENDING',
      receiptNumber: `${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${agent1.id.toString().padStart(5, '0')}-0001`,
      winAmount: 0
    }
  });

  // Create bet-provider relationships (multi-provider bet)
  await prisma.betProvider.createMany({
    data: [
      { betId: bet1.id, providerId: magnum.id, status: 'PENDING', winAmount: 0 },
      { betId: bet1.id, providerId: sportsToto.id, status: 'PENDING', winAmount: 0 },
      { betId: bet1.id, providerId: damacai.id, status: 'PENDING', winAmount: 0 }
    ]
  });

  // Update weeklyUsed for agent1
  await prisma.user.update({
    where: { id: agent1.id },
    data: { weeklyUsed: 30 }
  });

  console.log('✅ Sample bets created');

  // 6. Summary
  console.log('\n📊 Seed Summary:');
  console.log('==================');
  console.log(`✅ Service Providers: 4 (Magnum, Sports Toto, Da Ma Cai, Singapore Pools)`);
  console.log(`✅ Admin Users: 1`);
  console.log(`✅ Moderators: 2`);
  console.log(`✅ Agents: 10 (4-level hierarchy)`);
  console.log(`✅ Sample Bets: 1 (multi-provider)`);
  console.log('\n🔑 Default Credentials:');
  console.log('==================');
  console.log('Admin: username=admin, password=Admin@123456');
  console.log('Moderator: username=mod_kl, password=Moderator@123');
  console.log('Agent: username=agent001, password=agent001_9012');
  console.log('\nℹ️  All agents have firstLogin=true (require password change)');
  console.log(`\n🌱 Database seeding completed successfully!\n`);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
