import { Test, TestingModule } from '@nestjs/testing';
import { CommissionsService } from './commissions.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('CommissionsService', () => {
  let service: CommissionsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    bet: {
      findUnique: jest.fn(),
    },
    commission: {
      createMany: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    $queryRaw: jest.fn(),
  };

  const mockBet = {
    id: 1,
    agentId: 5,
    gameType: '4D',
    betType: 'BIG',
    numbers: '1234',
    amount: 100,
    drawDate: new Date(),
    status: 'WON',
    winAmount: 300,
    agent: {
      id: 5,
      username: 'agent_level3',
      uplineId: 4,
    },
  };

  const mockUplineChain = [
    { id: 4, commissionRate: 5, level: 1 }, // Direct upline: 5%
    { id: 3, commissionRate: 3, level: 2 }, // Second level: 3%
    { id: 2, commissionRate: 2, level: 3 }, // Third level: 2%
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CommissionsService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<CommissionsService>(CommissionsService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateCommissions', () => {
    it('should calculate commissions for all uplines', async () => {
      mockPrismaService.bet.findUnique.mockResolvedValue(mockBet);
      mockPrismaService.$queryRaw.mockResolvedValue(mockUplineChain);
      mockPrismaService.commission.createMany.mockResolvedValue({ count: 3 });

      // Bet won 300, agent paid 100, so profit/loss = -200 (loss for upline)
      const profitLoss = -200;

      const result = await service.calculateCommissions(1, profitLoss);

      expect(mockPrismaService.bet.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          agent: {
            select: {
              id: true,
              username: true,
              uplineId: true,
            },
          },
        },
      });

      expect(mockPrismaService.$queryRaw).toHaveBeenCalled();
      expect(mockPrismaService.commission.createMany).toHaveBeenCalled();
      expect(result.length).toBe(3);

      // Level 1: -200 * 0.05 = -10
      expect(result[0].agentId).toBe(4);
      expect(result[0].commissionAmt).toBe(-10);
      expect(result[0].level).toBe(1);

      // Level 2: (-200 + 10) * 0.03 = -5.7
      expect(result[1].agentId).toBe(3);
      expect(result[1].commissionAmt).toBe(-5.7);
      expect(result[1].level).toBe(2);

      // Level 3: (-200 + 10 + 5.7) * 0.02 = -3.69 (rounded to -3.69)
      expect(result[2].agentId).toBe(2);
      expect(result[2].level).toBe(3);
    });

    it('should return empty array if bet has no upline', async () => {
      mockPrismaService.bet.findUnique.mockResolvedValue({
        ...mockBet,
        agent: { ...mockBet.agent, uplineId: null },
      });

      const result = await service.calculateCommissions(1, 100);

      expect(result).toEqual([]);
      expect(mockPrismaService.commission.createMany).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if bet not found', async () => {
      mockPrismaService.bet.findUnique.mockResolvedValue(null);

      await expect(service.calculateCommissions(999, 100)).rejects.toThrow(NotFoundException);
    });

    it('should handle positive profit/loss (agent loss)', async () => {
      mockPrismaService.bet.findUnique.mockResolvedValue(mockBet);
      mockPrismaService.$queryRaw.mockResolvedValue(mockUplineChain);
      mockPrismaService.commission.createMany.mockResolvedValue({ count: 3 });

      // Agent lost 100, so profit/loss = +100 (profit for upline)
      const profitLoss = 100;

      const result = await service.calculateCommissions(1, profitLoss);

      expect(result.length).toBe(3);

      // Level 1: 100 * 0.05 = 5
      expect(result[0].commissionAmt).toBe(5);

      // Level 2: (100 - 5) * 0.03 = 2.85
      expect(result[1].commissionAmt).toBe(2.85);

      // All commissions should be positive (upline profit)
      result.forEach((commission) => {
        expect(commission.commissionAmt).toBeGreaterThan(0);
      });
    });

    it('should stop calculation when remaining amount is negligible', async () => {
      mockPrismaService.bet.findUnique.mockResolvedValue(mockBet);
      mockPrismaService.$queryRaw.mockResolvedValue(mockUplineChain);
      mockPrismaService.commission.createMany.mockResolvedValue({ count: 3 });

      // Small profit/loss that will become negligible after few levels
      const profitLoss = 1;

      const result = await service.calculateCommissions(1, profitLoss);

      // Should create fewer commissions as remaining becomes < 0.01
      expect(result.length).toBeLessThanOrEqual(3);
    });
  });

  describe('getMyCommissions', () => {
    it('should return paginated commissions', async () => {
      const mockCommissions = [
        {
          id: 1,
          agentId: 4,
          betId: 1,
          sourceAgentId: 5,
          commissionRate: 5,
          betAmount: 100,
          profitLoss: -200,
          commissionAmt: -10,
          level: 1,
          createdAt: new Date(),
          bet: {
            id: 1,
            gameType: '4D',
            betType: 'BIG',
            numbers: '1234',
            amount: 100,
            status: 'WON',
            drawDate: new Date(),
            receiptNumber: 'REC-001',
          },
          sourceAgent: {
            id: 5,
            username: 'agent_level3',
            fullName: 'Agent Level 3',
          },
        },
      ];

      mockPrismaService.commission.count.mockResolvedValue(1);
      mockPrismaService.commission.findMany.mockResolvedValue(mockCommissions);
      mockPrismaService.commission.aggregate.mockResolvedValue({
        _sum: { commissionAmt: -10 },
        _count: { id: 1 },
      });

      const result = await service.getMyCommissions(4, { page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.summary.totalCommission).toBe(-10);
      expect(result.summary.totalBets).toBe(1);
    });

    it('should filter by date range', async () => {
      mockPrismaService.commission.count.mockResolvedValue(0);
      mockPrismaService.commission.findMany.mockResolvedValue([]);
      mockPrismaService.commission.aggregate.mockResolvedValue({
        _sum: { commissionAmt: null },
        _count: { id: 0 },
      });

      const query = {
        page: 1,
        limit: 20,
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-12-31T23:59:59Z',
      };

      await service.getMyCommissions(4, query);

      expect(mockPrismaService.commission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            agentId: 4,
            createdAt: expect.any(Object),
          }),
        }),
      );
    });
  });

  describe('getDownlineCommissions', () => {
    it('should return commissions from specific downline', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([{ exists: 1 }]);
      mockPrismaService.commission.count.mockResolvedValue(1);
      mockPrismaService.commission.findMany.mockResolvedValue([
        {
          id: 1,
          agentId: 4,
          betId: 1,
          sourceAgentId: 5,
          commissionRate: 5,
          betAmount: 100,
          profitLoss: -200,
          commissionAmt: -10,
          level: 1,
          createdAt: new Date(),
          bet: {
            id: 1,
            gameType: '4D',
            betType: 'BIG',
            numbers: '1234',
            amount: 100,
            status: 'WON',
            drawDate: new Date(),
            receiptNumber: 'REC-001',
          },
          sourceAgent: {
            id: 5,
            username: 'agent_level3',
            fullName: 'Agent Level 3',
          },
        },
      ]);

      const result = await service.getDownlineCommissions(4, 5, { page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].level).toBe(1);
    });

    it('should throw BadRequestException if not a downline', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([{ exists: 0 }]);

      await expect(service.getDownlineCommissions(4, 999, { page: 1, limit: 20 })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getCommissionStats', () => {
    it('should return commission statistics', async () => {
      mockPrismaService.commission.aggregate
        .mockResolvedValueOnce({ _sum: { commissionAmt: 1000 }, _count: { id: 50 } }) // Total
        .mockResolvedValueOnce({ _sum: { commissionAmt: 50 }, _count: { id: 5 } }) // Today
        .mockResolvedValueOnce({ _sum: { commissionAmt: 200 }, _count: { id: 15 } }) // This week
        .mockResolvedValueOnce({ _sum: { commissionAmt: 500 }, _count: { id: 30 } }); // This month

      const result = await service.getCommissionStats();

      expect(result.total.amount).toBe(1000);
      expect(result.total.count).toBe(50);
      expect(result.today.amount).toBe(50);
      expect(result.thisWeek.amount).toBe(200);
      expect(result.thisMonth.amount).toBe(500);
    });
  });
});
