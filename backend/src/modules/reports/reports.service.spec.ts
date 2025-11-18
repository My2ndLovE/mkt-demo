import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('ReportsService', () => {
  let service: ReportsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    bet: {
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    commission: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    serviceProvider: {
      findMany: jest.fn(),
    },
    limitResetLog: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAgentBetSummary', () => {
    it('should return bet summary for agent', async () => {
      const mockBets = [
        {
          id: 1,
          receiptNumber: 'BET001',
          numbers: '1234',
          gameType: '4D',
          betType: 'BIG',
          amount: 10,
          providers: '["SG"]',
          status: 'WON',
          results: '[{"winAmount":100}]',
          createdAt: new Date(),
        },
        {
          id: 2,
          receiptNumber: 'BET002',
          numbers: '5678',
          gameType: '4D',
          betType: 'SMALL',
          amount: 20,
          providers: '["MY"]',
          status: 'LOST',
          results: '[]',
          createdAt: new Date(),
        },
      ];

      mockPrismaService.bet.findMany.mockResolvedValue(mockBets);

      const result = await service.getAgentBetSummary(1, {});

      expect(result.totalBets).toBe(2);
      expect(result.totalAmount).toBe(30);
      expect(result.byStatus.won).toBe(1);
      expect(result.byStatus.lost).toBe(1);
      expect(result.bets).toHaveLength(2);
    });

    it('should filter by date range', async () => {
      mockPrismaService.bet.findMany.mockResolvedValue([]);

      await service.getAgentBetSummary(1, {
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      });

      expect(mockPrismaService.bet.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        }),
      );
    });
  });

  describe('getAgentWinLoss', () => {
    it('should calculate win/loss correctly', async () => {
      const mockBets = [
        {
          id: 1,
          receiptNumber: 'BET001',
          numbers: '1234',
          gameType: '4D',
          betType: 'BIG',
          amount: 10,
          status: 'WON',
          results: '[{"winAmount":100}]',
          createdAt: new Date(),
        },
        {
          id: 2,
          receiptNumber: 'BET002',
          numbers: '5678',
          gameType: '4D',
          betType: 'SMALL',
          amount: 20,
          status: 'LOST',
          results: '[]',
          createdAt: new Date(),
        },
      ];

      mockPrismaService.bet.findMany.mockResolvedValue(mockBets);

      const result = await service.getAgentWinLoss(1, {});

      expect(result.totalBets).toBe(2);
      expect(result.totalBetAmount).toBe(30);
      expect(result.totalWinAmount).toBe(100);
      expect(result.totalProfitLoss).toBe(70); // 100 - 30
      expect(result.winRate).toBe(50); // 1 win out of 2 bets
      expect(result.details).toHaveLength(2);
    });
  });

  describe('getAgentCommission', () => {
    it('should return commission summary by level', async () => {
      const mockCommissions = [
        {
          id: 1,
          betId: 1,
          commissionRate: 5,
          betAmount: 100,
          profitLoss: 50,
          commissionAmt: 2.5,
          level: 1,
          createdAt: new Date(),
          bet: {
            receiptNumber: 'BET001',
            numbers: '1234',
            gameType: '4D',
            amount: 100,
          },
          sourceAgent: {
            username: 'agent1',
            fullName: 'Agent One',
          },
        },
        {
          id: 2,
          betId: 1,
          commissionRate: 3,
          betAmount: 100,
          profitLoss: 50,
          commissionAmt: 1.5,
          level: 2,
          createdAt: new Date(),
          bet: {
            receiptNumber: 'BET001',
            numbers: '1234',
            gameType: '4D',
            amount: 100,
          },
          sourceAgent: {
            username: 'agent1',
            fullName: 'Agent One',
          },
        },
      ];

      mockPrismaService.commission.findMany.mockResolvedValue(mockCommissions);

      const result = await service.getAgentCommission(1, {});

      expect(result.totalCommissions).toBe(2);
      expect(result.totalAmount).toBe(4); // 2.5 + 1.5
      expect(result.averageCommission).toBe(2);
      expect(result.byLevel[1]).toBeDefined();
      expect(result.byLevel[2]).toBeDefined();
      expect(result.byLevel[1].total).toBe(2.5);
      expect(result.byLevel[2].total).toBe(1.5);
    });
  });

  describe('getModeratorHierarchy', () => {
    it('should build hierarchy tree with stats', async () => {
      const mockModerator = {
        id: 1,
        username: 'mod1',
        fullName: 'Moderator One',
        role: 'MODERATOR',
        downlines: [
          {
            id: 2,
            username: 'agent1',
            fullName: 'Agent One',
            role: 'AGENT',
            active: true,
            weeklyLimit: 5000,
            currentLimit: 3000,
            commissionRate: 5,
            createdAt: new Date(),
          },
        ],
      };

      const mockAgent = {
        id: 2,
        username: 'agent1',
        fullName: 'Agent One',
        role: 'AGENT',
        downlines: [],
      };

      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(mockModerator)
        .mockResolvedValueOnce(mockModerator)
        .mockResolvedValueOnce(mockAgent);

      mockPrismaService.bet.findMany.mockResolvedValue([]);
      mockPrismaService.commission.findMany.mockResolvedValue([]);

      const result = await service.getModeratorHierarchy(1, {});

      expect(result.moderator.id).toBe(1);
      expect(result.hierarchy).toBeDefined();
    });
  });

  describe('getModeratorFinancialSummary', () => {
    it('should aggregate financial data for downline', async () => {
      const mockUser = {
        id: 1,
        downlines: [{ id: 2 }, { id: 3 }],
      };

      const mockBets = [
        {
          id: 1,
          agentId: 2,
          amount: 100,
          status: 'WON',
          results: '[{"winAmount":200}]',
        },
        {
          id: 2,
          agentId: 3,
          amount: 50,
          status: 'LOST',
          results: '[]',
        },
      ];

      const mockUsers = [
        { role: 'AGENT', active: true },
        { role: 'AGENT', active: true },
        { role: 'MODERATOR', active: true },
      ];

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.bet.findMany.mockResolvedValue(mockBets);
      mockPrismaService.commission.findMany.mockResolvedValue([]);
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      const result = await service.getModeratorFinancialSummary(1, {});

      expect(result.bets.totalBets).toBe(2);
      expect(result.bets.totalAmount).toBe(150);
      expect(result.winnings.totalWinAmount).toBe(200);
      expect(result.winnings.netProfitLoss).toBe(50); // 200 - 150
      expect(result.users.totalUsers).toBe(3);
      expect(result.users.byRole.agents).toBe(2);
    });
  });

  describe('getAdminSystemOverview', () => {
    it('should return system-wide statistics', async () => {
      mockPrismaService.user.count
        .mockResolvedValueOnce(100) // total users
        .mockResolvedValueOnce(90); // active users

      mockPrismaService.user.groupBy.mockResolvedValue([
        { role: 'AGENT', _count: 80 },
        { role: 'MODERATOR', _count: 15 },
        { role: 'ADMIN', _count: 5 },
      ]);

      mockPrismaService.bet.count.mockResolvedValue(500);
      mockPrismaService.bet.groupBy.mockResolvedValue([
        { status: 'WON', _count: 100, _sum: { amount: 1000 } },
        { status: 'LOST', _count: 200, _sum: { amount: 2000 } },
        { status: 'PENDING', _count: 200, _sum: { amount: 2000 } },
      ]);

      mockPrismaService.bet.findMany.mockResolvedValue([
        { amount: 10, results: '[{"winAmount":20}]' },
        { amount: 20, results: '[]' },
      ]);

      mockPrismaService.commission.count.mockResolvedValue(50);
      mockPrismaService.commission.findMany.mockResolvedValue([
        { commissionAmt: 5 },
        { commissionAmt: 10 },
      ]);

      mockPrismaService.serviceProvider.findMany.mockResolvedValue([
        { code: 'SG', name: 'Singapore', active: true },
        { code: 'MY', name: 'Malaysia', active: true },
      ]);

      mockPrismaService.limitResetLog.findMany.mockResolvedValue([
        {
          resetDate: new Date(),
          success: true,
          usersAffected: 80,
        },
      ]);

      const result = await service.getAdminSystemOverview({});

      expect(result.users.total).toBe(100);
      expect(result.users.active).toBe(90);
      expect(result.bets.total).toBe(500);
      expect(result.commissions.total).toBe(50);
      expect(result.providers.total).toBe(2);
      expect(result.systemHealth.recentResets).toHaveLength(1);
    });
  });

  describe('exportToExcel', () => {
    it('should export array data to Excel buffer', async () => {
      const data = [
        { id: 1, name: 'Test', amount: 100 },
        { id: 2, name: 'Test2', amount: 200 },
      ];

      const buffer = await service.exportToExcel(data, 'Test Report');

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should export object data to Excel buffer', async () => {
      const data = {
        summary: { total: 100 },
        details: [{ id: 1 }],
      };

      const buffer = await service.exportToExcel(data, 'Test Report');

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });
  });
});
