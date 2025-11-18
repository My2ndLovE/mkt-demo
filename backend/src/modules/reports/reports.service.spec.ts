import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('ReportsService', () => {
  let service: ReportsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    bet: {
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
    commission: {
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportsService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSalesReport', () => {
    it('should return sales summary', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([{ id: 5 }]);
      mockPrismaService.bet.aggregate.mockResolvedValue({
        _sum: { amount: 10000, winAmount: 3000 },
        _count: { id: 50 },
      });
      mockPrismaService.bet.groupBy.mockResolvedValue([
        {
          status: 'WON',
          _count: { id: 15 },
          _sum: { amount: 3000, winAmount: 3000 },
        },
        {
          status: 'LOST',
          _count: { id: 35 },
          _sum: { amount: 7000, winAmount: 0 },
        },
      ]);

      const result = await service.getSalesReport(5, {});

      expect(result.summary.totalBets).toBe(50);
      expect(result.summary.totalAmount).toBe(10000);
      expect(result.summary.netRevenue).toBe(7000);
      expect(result.byStatus).toHaveLength(2);
    });
  });

  describe('getCommissionsReport', () => {
    it('should return commissions summary', async () => {
      mockPrismaService.commission.aggregate.mockResolvedValue({
        _sum: { commissionAmt: 500, betAmount: 10000 },
        _count: { id: 50 },
      });
      mockPrismaService.commission.groupBy.mockResolvedValue([
        {
          level: 1,
          _sum: { commissionAmt: 300 },
          _count: { id: 30 },
        },
        {
          level: 2,
          _sum: { commissionAmt: 200 },
          _count: { id: 20 },
        },
      ]);

      const result = await service.getCommissionsReport(5, {});

      expect(result.summary.totalCommission).toBe(500);
      expect(result.summary.totalBets).toBe(50);
      expect(result.byLevel).toHaveLength(2);
    });
  });

  describe('getDownlineReport', () => {
    it('should return downline performance', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([
        {
          id: 6,
          username: 'sub_agent_1',
          fullName: 'Sub Agent 1',
          role: 'AGENT',
        },
      ]);
      mockPrismaService.bet.aggregate.mockResolvedValue({
        _sum: { amount: 5000, winAmount: 1500 },
        _count: { id: 25 },
      });
      mockPrismaService.commission.aggregate.mockResolvedValue({
        _sum: { commissionAmt: 250 },
      });

      const result = await service.getDownlineReport(5, {});

      expect(result.totalDownlines).toBe(1);
      expect(result.downlines).toHaveLength(1);
      expect(result.downlines[0].sales.totalAmount).toBe(5000);
      expect(result.downlines[0].commissions.totalCommission).toBe(250);
    });
  });

  describe('getWinLossReport', () => {
    it('should return win/loss summary', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([{ id: 5 }]);
      mockPrismaService.bet.groupBy
        .mockResolvedValueOnce([
          {
            gameType: '4D',
            status: 'WON',
            _count: { id: 15 },
            _sum: { amount: 3000, winAmount: 7500 },
          },
          {
            gameType: '4D',
            status: 'LOST',
            _count: { id: 35 },
            _sum: { amount: 7000, winAmount: 0 },
          },
        ])
        .mockResolvedValueOnce([
          {
            betType: 'BIG',
            status: 'WON',
            _count: { id: 10 },
            _sum: { amount: 2000, winAmount: 5000 },
          },
          {
            betType: 'BIG',
            status: 'LOST',
            _count: { id: 40 },
            _sum: { amount: 8000, winAmount: 0 },
          },
        ]);

      const result = await service.getWinLossReport(5, {});

      expect(result.summary.totalBets).toBe(50);
      expect(result.summary.wonBets).toBe(15);
      expect(result.byGameType).toHaveLength(1);
      expect(result.byBetType).toHaveLength(1);
    });
  });

  describe('getPopularNumbers', () => {
    it('should return popular numbers', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([
        {
          numbers: '1234',
          totalBets: 50,
          totalAmount: 5000,
        },
        {
          numbers: '5678',
          totalBets: 30,
          totalAmount: 3000,
        },
      ]);

      const result = await service.getPopularNumbers({}, 20);

      expect(result.popularNumbers).toHaveLength(2);
      expect(result.popularNumbers[0].number).toBe('1234');
      expect(result.popularNumbers[0].totalBets).toBe(50);
    });
  });

  describe('getDashboardSummary', () => {
    it('should return dashboard summary', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([{ id: 5 }]);
      mockPrismaService.bet.aggregate.mockResolvedValue({
        _sum: { amount: 1000, winAmount: 300 },
        _count: { id: 10 },
      });
      mockPrismaService.user.findUnique.mockResolvedValue({
        weeklyLimit: 10000,
        weeklyUsed: 5000,
      });

      const result = await service.getDashboardSummary(5);

      expect(result.today).toBeDefined();
      expect(result.thisWeek).toBeDefined();
      expect(result.thisMonth).toBeDefined();
      expect(result.limits).toBeDefined();
      expect(result.limits?.weeklyLimit).toBe(10000);
    });
  });
});
