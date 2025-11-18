import { Test, TestingModule } from '@nestjs/testing';
import { ResultsService } from './results.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { GameType, ResultStatus } from './dtos';

describe('ResultsService', () => {
  let service: ResultsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    drawResult: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    serviceProvider: {
      findUnique: jest.fn(),
    },
    bet: {
      findMany: jest.fn(),
    },
    betProvider: {
      update: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockResult = {
    id: 1,
    providerId: 'provider-123',
    gameType: '4D',
    drawDate: new Date('2025-11-20'),
    drawNumber: 'M-4D-20251120',
    firstPrize: '1234',
    secondPrize: '5678',
    thirdPrize: '9012',
    starters: JSON.stringify([
      '1111',
      '2222',
      '3333',
      '4444',
      '5555',
      '6666',
      '7777',
      '8888',
      '9999',
      '0000',
    ]),
    consolations: JSON.stringify([
      '1357',
      '2468',
      '1122',
      '3344',
      '5566',
      '7788',
      '9900',
      '1234',
      '5678',
      '9012',
    ]),
    syncMethod: 'MANUAL',
    syncedBy: 1,
    syncedAt: new Date(),
    status: 'PENDING',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ResultsService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<ResultsService>(ResultsService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto = {
      providerId: 'provider-123',
      gameType: GameType.FOUR_D,
      drawDate: '2025-11-20T19:00:00Z',
      drawNumber: 'M-4D-20251120',
      firstPrize: '1234',
      secondPrize: '5678',
      thirdPrize: '9012',
      starters: ['1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999', '0000'],
      consolations: [
        '1357',
        '2468',
        '1122',
        '3344',
        '5566',
        '7788',
        '9900',
        '1234',
        '5678',
        '9012',
      ],
    };

    it('should create a result', async () => {
      mockPrismaService.drawResult.findUnique.mockResolvedValue(null);
      mockPrismaService.serviceProvider.findUnique.mockResolvedValue({ id: 'provider-123' });
      mockPrismaService.drawResult.create.mockResolvedValue(mockResult);

      const result = await service.create(createDto, 1);

      expect(result.drawNumber).toBe('M-4D-20251120');
      expect(result.firstPrize).toBe('1234');
    });

    it('should throw ConflictException if result already exists', async () => {
      mockPrismaService.drawResult.findUnique.mockResolvedValue(mockResult);

      await expect(service.create(createDto, 1)).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if provider not found', async () => {
      mockPrismaService.drawResult.findUnique.mockResolvedValue(null);
      mockPrismaService.serviceProvider.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto, 1)).rejects.toThrow(NotFoundException);
    });

    it('should validate number format', async () => {
      const invalidDto = { ...createDto, firstPrize: '123' }; // 3 digits for 4D
      mockPrismaService.drawResult.findUnique.mockResolvedValue(null);
      mockPrismaService.serviceProvider.findUnique.mockResolvedValue({ id: 'provider-123' });

      await expect(service.create(invalidDto, 1)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return paginated results', async () => {
      mockPrismaService.drawResult.count.mockResolvedValue(1);
      mockPrismaService.drawResult.findMany.mockResolvedValue([mockResult]);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return a result by ID', async () => {
      mockPrismaService.drawResult.findUnique.mockResolvedValue(mockResult);

      const result = await service.findOne(1);

      expect(result.id).toBe(1);
      expect(result.drawNumber).toBe('M-4D-20251120');
    });

    it('should throw NotFoundException if result not found', async () => {
      mockPrismaService.drawResult.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a result', async () => {
      mockPrismaService.drawResult.findUnique.mockResolvedValue(mockResult);
      mockPrismaService.drawResult.update.mockResolvedValue({
        ...mockResult,
        status: 'VERIFIED',
      });

      const result = await service.update(1, { status: ResultStatus.VERIFIED });

      expect(result.status).toBe('VERIFIED');
    });

    it('should throw BadRequestException if result is FINAL', async () => {
      mockPrismaService.drawResult.findUnique.mockResolvedValue({
        ...mockResult,
        status: 'FINAL',
      });

      await expect(service.update(1, { status: ResultStatus.VERIFIED })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('processBets', () => {
    it('should process all pending bets', async () => {
      mockPrismaService.drawResult.findUnique.mockResolvedValue({
        ...mockResult,
        provider: { id: 'provider-123', code: 'M' },
      });
      mockPrismaService.bet.findMany.mockResolvedValue([
        {
          id: 1,
          agentId: 5,
          gameType: '4D',
          betType: 'BIG',
          numbers: '1234', // Matches first prize
          amount: 100,
          status: 'PENDING',
          providers: [{ id: 1, providerId: 'provider-123' }],
        },
      ]);
      mockPrismaService.$transaction.mockImplementation((cb) => cb(mockPrismaService));
      mockPrismaService.betProvider.update.mockResolvedValue({});
      mockPrismaService.betProvider.findMany.mockResolvedValue([
        { id: 1, status: 'WON', winAmount: 250000 },
      ]);
      mockPrismaService.drawResult.update.mockResolvedValue({});

      const result = await service.processBets(1);

      expect(result.processedBets).toBe(1);
      expect(result.wonBets).toBe(1);
    });

    it('should throw NotFoundException if result not found', async () => {
      mockPrismaService.drawResult.findUnique.mockResolvedValue(null);

      await expect(service.processBets(999)).rejects.toThrow(NotFoundException);
    });
  });
});
