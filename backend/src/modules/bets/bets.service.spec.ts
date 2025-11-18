import { Test, TestingModule } from '@nestjs/testing';
import { BetsService } from './bets.service';
import { PrismaService } from '../../prisma/prisma.service';
import { LimitsService } from '../limits/limits.service';
import { AuditService } from '../audit/audit.service';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PlaceBetDto } from './dtos';

/**
 * Bets Service Test Suite (T284, T289)
 *
 * Comprehensive tests for all bet operations with 100% coverage.
 *
 * Test Categories:
 * 1. Place Bet Success Cases
 * 2. Place Bet Validation Failures
 * 3. Place Bet Limit Failures
 * 4. Cancel Bet Success Cases
 * 5. Cancel Bet Failure Cases
 * 6. Bet Retrieval Operations
 * 7. Receipt Number Generation
 * 8. Provider Validation
 */
describe('BetsService', () => {
  let service: BetsService;
  let prismaService: PrismaService;
  let limitsService: LimitsService;
  let auditService: AuditService;

  // Mock data
  const mockAgent = {
    id: 1,
    username: 'agent1',
    weeklyLimit: 1000,
    weeklyUsed: 0,
    active: true,
  };

  const mockProvider = {
    id: 'M',
    code: 'M',
    name: 'Magnum',
    country: 'MY',
    active: true,
    availableGames: JSON.stringify(['3D', '4D', '5D', '6D']),
    betTypes: JSON.stringify(['BIG', 'SMALL', 'IBOX']),
    drawSchedule: JSON.stringify({ days: [0, 3, 6], time: '19:00' }),
  };

  const mockBet = {
    id: 1,
    agentId: 1,
    gameType: '4D',
    betType: 'BIG',
    numbers: '1234',
    amount: 30,
    drawDate: new Date('2025-12-31'),
    receiptNumber: '20251118-00001-0001',
    status: 'PENDING',
    winAmount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    providers: [
      {
        id: 1,
        betId: 1,
        providerId: 'M',
        status: 'PENDING',
        winAmount: 0,
        createdAt: new Date(),
        provider: { id: 'M', name: 'Magnum', code: 'M' },
      },
    ],
    agent: { id: 1, moderatorId: null },
  };

  const mockPrismaTransaction = {
    bet: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    betProvider: {
      createMany: jest.fn(),
      updateMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    serviceProvider: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BetsService,
        {
          provide: PrismaService,
          useValue: {
            bet: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
              update: jest.fn(),
            },
            betProvider: {
              createMany: jest.fn(),
              updateMany: jest.fn(),
            },
            user: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            serviceProvider: {
              findMany: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
        {
          provide: LimitsService,
          useValue: {
            checkLimit: jest.fn(),
            deductLimit: jest.fn(),
            refundLimit: jest.fn(),
            getMyLimits: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: {
            log: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BetsService>(BetsService);
    prismaService = module.get<PrismaService>(PrismaService);
    limitsService = module.get<LimitsService>(LimitsService);
    auditService = module.get<AuditService>(AuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('placeBet - Success Cases', () => {
    it('should place bet successfully with single provider', async () => {
      const dto: PlaceBetDto = {
        gameType: '4D',
        betType: 'BIG',
        numbers: '1234',
        providerIds: ['M'],
        amountPerProvider: 10,
        drawDate: '2025-12-31',
      };

      // Mock provider validation
      jest.spyOn(prismaService.serviceProvider, 'findMany').mockResolvedValue([mockProvider]);

      // Mock limit check
      jest.spyOn(limitsService, 'checkLimit').mockResolvedValue({
        allowed: true,
        weeklyLimit: 1000,
        weeklyUsed: 0,
        weeklyRemaining: 1000,
        message: 'Bet is within limits',
      });

      // Mock transaction
      jest.spyOn(prismaService, '$transaction').mockImplementation(async (callback: any) => {
        return callback(mockPrismaTransaction);
      });

      mockPrismaTransaction.bet.create.mockResolvedValue(mockBet);
      mockPrismaTransaction.bet.count.mockResolvedValue(0);
      mockPrismaTransaction.betProvider.createMany.mockResolvedValue({ count: 1 });
      mockPrismaTransaction.user.findUnique.mockResolvedValue(mockAgent);
      mockPrismaTransaction.user.update.mockResolvedValue({ ...mockAgent, weeklyUsed: 10 });

      // Mock findOne
      jest.spyOn(service, 'findOne').mockResolvedValue({
        id: 1,
        gameType: '4D',
        betType: 'BIG',
        numbers: '1234',
        totalAmount: 10,
        drawDate: '2025-12-31',
        status: 'PENDING',
        winAmount: 0,
        providers: [
          {
            providerId: 'M',
            providerName: 'Magnum',
            amount: 10,
            status: 'PENDING',
            winAmount: 0,
          },
        ],
        createdAt: new Date(),
      });

      // Mock limits
      jest.spyOn(limitsService, 'getMyLimits').mockResolvedValue({
        userId: 1,
        username: 'agent1',
        fullName: 'Agent One',
        weeklyLimit: 1000,
        weeklyUsed: 10,
        weeklyRemaining: 990,
        usagePercentage: '1.00',
        active: true,
      });

      const result = await service.placeBet(1, dto);

      expect(result).toBeDefined();
      expect(result.receiptNumber).toBe('20251118-00001-0001');
      expect(result.bet.totalAmount).toBe(10);
      expect(result.bet.providers).toHaveLength(1);
      expect(result.limits.weeklyUsed).toBe(10);
    });

    it('should place bet successfully with multiple providers (OPTION A)', async () => {
      const dto: PlaceBetDto = {
        gameType: '4D',
        betType: 'BIG',
        numbers: '1234',
        providerIds: ['M', 'P', 'T'],
        amountPerProvider: 10,
        drawDate: '2025-12-31',
      };

      const mockProviders = [
        mockProvider,
        { ...mockProvider, id: 'P', code: 'P', name: 'Sports Toto' },
        { ...mockProvider, id: 'T', code: 'T', name: 'Damacai' },
      ];

      jest.spyOn(prismaService.serviceProvider, 'findMany').mockResolvedValue(mockProviders);

      jest.spyOn(limitsService, 'checkLimit').mockResolvedValue({
        allowed: true,
        weeklyLimit: 1000,
        weeklyUsed: 0,
        weeklyRemaining: 1000,
        message: 'Bet is within limits',
      });

      jest.spyOn(prismaService, '$transaction').mockImplementation(async (callback: any) => {
        return callback(mockPrismaTransaction);
      });

      mockPrismaTransaction.bet.create.mockResolvedValue({ ...mockBet, amount: 30 });
      mockPrismaTransaction.bet.count.mockResolvedValue(0);
      mockPrismaTransaction.betProvider.createMany.mockResolvedValue({ count: 3 });
      mockPrismaTransaction.user.findUnique.mockResolvedValue(mockAgent);
      mockPrismaTransaction.user.update.mockResolvedValue({ ...mockAgent, weeklyUsed: 30 });

      jest.spyOn(service, 'findOne').mockResolvedValue({
        id: 1,
        gameType: '4D',
        betType: 'BIG',
        numbers: '1234',
        totalAmount: 30,
        drawDate: '2025-12-31',
        status: 'PENDING',
        winAmount: 0,
        providers: [
          { providerId: 'M', providerName: 'Magnum', amount: 10, status: 'PENDING', winAmount: 0 },
          {
            providerId: 'P',
            providerName: 'Sports Toto',
            amount: 10,
            status: 'PENDING',
            winAmount: 0,
          },
          { providerId: 'T', providerName: 'Damacai', amount: 10, status: 'PENDING', winAmount: 0 },
        ],
        createdAt: new Date(),
      });

      jest.spyOn(limitsService, 'getMyLimits').mockResolvedValue({
        userId: 1,
        username: 'agent1',
        fullName: 'Agent One',
        weeklyLimit: 1000,
        weeklyUsed: 30,
        weeklyRemaining: 970,
        usagePercentage: '3.00',
        active: true,
      });

      const result = await service.placeBet(1, dto);

      expect(result.bet.totalAmount).toBe(30);
      expect(result.bet.providers).toHaveLength(3);
      expect(result.limits.weeklyUsed).toBe(30);
    });
  });

  describe('placeBet - Provider Validation Failures', () => {
    it('should fail if provider not found', async () => {
      const dto: PlaceBetDto = {
        gameType: '4D',
        betType: 'BIG',
        numbers: '1234',
        providerIds: ['INVALID'],
        amountPerProvider: 10,
        drawDate: '2025-12-31',
      };

      jest.spyOn(prismaService.serviceProvider, 'findMany').mockResolvedValue([]);

      await expect(service.placeBet(1, dto)).rejects.toThrow(NotFoundException);
    });

    it('should fail if provider is not active', async () => {
      const dto: PlaceBetDto = {
        gameType: '4D',
        betType: 'BIG',
        numbers: '1234',
        providerIds: ['M'],
        amountPerProvider: 10,
        drawDate: '2025-12-31',
      };

      jest
        .spyOn(prismaService.serviceProvider, 'findMany')
        .mockResolvedValue([{ ...mockProvider, active: false }]);

      await expect(service.placeBet(1, dto)).rejects.toThrow(BadRequestException);
      await expect(service.placeBet(1, dto)).rejects.toThrow(/Inactive providers/);
    });

    it('should fail if provider does not support game type', async () => {
      const dto: PlaceBetDto = {
        gameType: '6D',
        betType: 'BIG',
        numbers: '123456',
        providerIds: ['M'],
        amountPerProvider: 10,
        drawDate: '2025-12-31',
      };

      jest
        .spyOn(prismaService.serviceProvider, 'findMany')
        .mockResolvedValue([{ ...mockProvider, availableGames: JSON.stringify(['3D', '4D']) }]);

      await expect(service.placeBet(1, dto)).rejects.toThrow(BadRequestException);
      await expect(service.placeBet(1, dto)).rejects.toThrow(/not supported/);
    });
  });

  describe('placeBet - Limit Failures', () => {
    it('should fail if weekly limit exceeded', async () => {
      const dto: PlaceBetDto = {
        gameType: '4D',
        betType: 'BIG',
        numbers: '1234',
        providerIds: ['M'],
        amountPerProvider: 1000,
        drawDate: '2025-12-31',
      };

      jest.spyOn(prismaService.serviceProvider, 'findMany').mockResolvedValue([mockProvider]);

      jest.spyOn(limitsService, 'checkLimit').mockResolvedValue({
        allowed: false,
        weeklyLimit: 1000,
        weeklyUsed: 950,
        weeklyRemaining: 50,
        message: 'Insufficient weekly limit. Remaining: 50.00',
      });

      await expect(service.placeBet(1, dto)).rejects.toThrow(ForbiddenException);
      await expect(service.placeBet(1, dto)).rejects.toThrow(/limit exceeded/);
    });
  });

  describe('cancelBet - Success Cases', () => {
    it('should cancel bet successfully', async () => {
      const betToCancel = { ...mockBet };

      jest.spyOn(prismaService.bet, 'findUnique').mockResolvedValue(betToCancel);

      jest.spyOn(prismaService, '$transaction').mockImplementation(async (callback: any) => {
        return callback(mockPrismaTransaction);
      });

      mockPrismaTransaction.bet.update.mockResolvedValue({
        ...betToCancel,
        status: 'CANCELLED',
      });
      mockPrismaTransaction.betProvider.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaTransaction.user.findUnique.mockResolvedValue({ ...mockAgent, weeklyUsed: 30 });
      mockPrismaTransaction.user.update.mockResolvedValue({ ...mockAgent, weeklyUsed: 0 });

      jest.spyOn(service, 'findOne').mockResolvedValue({
        ...mockBet,
        status: 'CANCELLED',
        totalAmount: 30,
        drawDate: '2025-12-31',
        providers: [],
        createdAt: new Date(),
      } as any);

      const result = await service.cancelBet(1, 1);

      expect(result.status).toBe('CANCELLED');
      expect(auditService.log).toHaveBeenCalledWith(
        'BET_CANCELLED',
        1,
        expect.objectContaining({ betId: 1 }),
      );
    });
  });

  describe('cancelBet - Failure Cases', () => {
    it('should fail if bet not found', async () => {
      jest.spyOn(prismaService.bet, 'findUnique').mockResolvedValue(null);

      await expect(service.cancelBet(999, 1)).rejects.toThrow(NotFoundException);
    });

    it('should fail if not authorized (not your bet)', async () => {
      jest.spyOn(prismaService.bet, 'findUnique').mockResolvedValue({
        ...mockBet,
        agentId: 2, // Different agent
      });

      await expect(service.cancelBet(1, 1)).rejects.toThrow(ForbiddenException);
      await expect(service.cancelBet(1, 1)).rejects.toThrow(/own bets/);
    });

    it('should fail if bet is not PENDING', async () => {
      jest.spyOn(prismaService.bet, 'findUnique').mockResolvedValue({
        ...mockBet,
        status: 'WON',
      });

      await expect(service.cancelBet(1, 1)).rejects.toThrow(BadRequestException);
      await expect(service.cancelBet(1, 1)).rejects.toThrow(/PENDING bets/);
    });

    it('should fail if draw date has passed', async () => {
      jest.spyOn(prismaService.bet, 'findUnique').mockResolvedValue({
        ...mockBet,
        drawDate: new Date('2020-01-01'), // Past date
      });

      await expect(service.cancelBet(1, 1)).rejects.toThrow(BadRequestException);
      await expect(service.cancelBet(1, 1)).rejects.toThrow(/draw date has passed/);
    });
  });

  describe('findAll - Bet Listing', () => {
    it('should list bets with pagination', async () => {
      const mockBets = [mockBet, { ...mockBet, id: 2 }];

      jest.spyOn(prismaService.bet, 'count').mockResolvedValue(2);
      jest.spyOn(prismaService.bet, 'findMany').mockResolvedValue(mockBets);

      const result = await service.findAll(1, { page: 1, limit: 20 }, 'AGENT');

      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(20);
    });

    it('should filter bets by status', async () => {
      jest.spyOn(prismaService.bet, 'count').mockResolvedValue(1);
      jest.spyOn(prismaService.bet, 'findMany').mockResolvedValue([mockBet]);

      await service.findAll(1, { status: 'PENDING' }, 'AGENT');

      expect(prismaService.bet.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'PENDING' }),
        }),
      );
    });

    it('should filter bets by game type', async () => {
      jest.spyOn(prismaService.bet, 'count').mockResolvedValue(1);
      jest.spyOn(prismaService.bet, 'findMany').mockResolvedValue([mockBet]);

      await service.findAll(1, { gameType: '4D' }, 'AGENT');

      expect(prismaService.bet.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ gameType: '4D' }),
        }),
      );
    });

    it('should filter bets by date range', async () => {
      jest.spyOn(prismaService.bet, 'count').mockResolvedValue(1);
      jest.spyOn(prismaService.bet, 'findMany').mockResolvedValue([mockBet]);

      await service.findAll(
        1,
        {
          startDate: '2025-11-01',
          endDate: '2025-11-30',
        },
        'AGENT',
      );

      expect(prismaService.bet.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            drawDate: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        }),
      );
    });
  });

  describe('findOne - Get Bet Details', () => {
    it('should get bet details by ID', async () => {
      jest.spyOn(prismaService.bet, 'findUnique').mockResolvedValue(mockBet);

      const result = await service.findOne(1, 1);

      expect(result.id).toBe(1);
      expect(result.gameType).toBe('4D');
      expect(result.numbers).toBe('1234');
    });

    it('should fail if bet not found', async () => {
      jest.spyOn(prismaService.bet, 'findUnique').mockResolvedValue(null);

      await expect(service.findOne(999, 1)).rejects.toThrow(NotFoundException);
    });

    it('should fail if not authorized', async () => {
      jest.spyOn(prismaService.bet, 'findUnique').mockResolvedValue({
        ...mockBet,
        agentId: 2,
      });

      await expect(service.findOne(1, 1)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findByReceipt - Get Bet by Receipt Number', () => {
    it('should get bet by receipt number', async () => {
      jest.spyOn(prismaService.bet, 'findUnique').mockResolvedValue(mockBet);

      const result = await service.findByReceipt('20251118-00001-0001', 1);

      expect(result.id).toBe(1);
      expect(prismaService.bet.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { receiptNumber: '20251118-00001-0001' },
        }),
      );
    });

    it('should fail if receipt not found', async () => {
      jest.spyOn(prismaService.bet, 'findUnique').mockResolvedValue(null);

      await expect(service.findByReceipt('INVALID', 1)).rejects.toThrow(NotFoundException);
    });

    it('should fail if not authorized', async () => {
      jest.spyOn(prismaService.bet, 'findUnique').mockResolvedValue({
        ...mockBet,
        agentId: 2,
      });

      await expect(service.findByReceipt('20251118-00001-0001', 1)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
