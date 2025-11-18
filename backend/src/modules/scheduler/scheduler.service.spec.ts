import { Test, TestingModule } from '@nestjs/testing';
import { SchedulerService } from './scheduler.service';
import { LimitsService } from '../limits/limits.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('SchedulerService', () => {
  let service: SchedulerService;
  let limitsService: LimitsService;
  let prismaService: PrismaService;

  const mockLimitsService = {
    resetAllLimits: jest.fn(),
  };

  const mockPrismaService = {
    limitResetLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulerService,
        {
          provide: LimitsService,
          useValue: mockLimitsService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SchedulerService>(SchedulerService);
    limitsService = module.get<LimitsService>(LimitsService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleWeeklyLimitReset', () => {
    it('should successfully reset limits on first attempt', async () => {
      const mockResult = { count: 25 };
      mockLimitsService.resetAllLimits.mockResolvedValue(mockResult);
      mockPrismaService.limitResetLog.create.mockResolvedValue({});

      await service.handleWeeklyLimitReset();

      expect(limitsService.resetAllLimits).toHaveBeenCalledTimes(1);
      expect(prismaService.limitResetLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            success: true,
            usersAffected: 25,
            errorMessage: null,
          }),
        }),
      );
    });

    it('should retry on failure and succeed on second attempt', async () => {
      const mockResult = { count: 30 };
      mockLimitsService.resetAllLimits
        .mockRejectedValueOnce(new Error('Database connection failed'))
        .mockResolvedValueOnce(mockResult);

      mockPrismaService.limitResetLog.create.mockResolvedValue({});

      await service.handleWeeklyLimitReset();

      expect(limitsService.resetAllLimits).toHaveBeenCalledTimes(2);
      expect(prismaService.limitResetLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            success: true,
            usersAffected: 30,
            attemptCount: 2,
          }),
        }),
      );
    }, 10000); // Extended timeout for retry delays

    it('should log failure after max retries', async () => {
      const error = new Error('Persistent database failure');
      mockLimitsService.resetAllLimits.mockRejectedValue(error);
      mockPrismaService.limitResetLog.create.mockResolvedValue({});

      await service.handleWeeklyLimitReset();

      expect(limitsService.resetAllLimits).toHaveBeenCalledTimes(3);
      expect(prismaService.limitResetLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            success: false,
            usersAffected: 0,
            errorMessage: 'Persistent database failure',
            attemptCount: 3,
          }),
        }),
      );
    }, 15000); // Extended timeout for multiple retries
  });

  describe('triggerManualReset', () => {
    it('should successfully trigger manual reset and create audit log', async () => {
      const userId = 1;
      const mockResult = { count: 15 };
      mockLimitsService.resetAllLimits.mockResolvedValue(mockResult);
      mockPrismaService.limitResetLog.create.mockResolvedValue({});
      mockPrismaService.auditLog.create.mockResolvedValue({});

      const result = await service.triggerManualReset(userId);

      expect(result).toEqual({ success: true, count: 15 });
      expect(limitsService.resetAllLimits).toHaveBeenCalledTimes(1);
      expect(prismaService.limitResetLog.create).toHaveBeenCalled();
      expect(prismaService.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId,
            action: 'MANUAL_LIMIT_RESET',
          }),
        }),
      );
    });

    it('should handle manual reset failure', async () => {
      const userId = 1;
      const error = new Error('Reset failed');
      mockLimitsService.resetAllLimits.mockRejectedValue(error);
      mockPrismaService.limitResetLog.create.mockResolvedValue({});

      const result = await service.triggerManualReset(userId);

      expect(result).toEqual({
        success: false,
        count: 0,
        error: 'Reset failed',
      });
      expect(prismaService.limitResetLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            success: false,
            errorMessage: 'Reset failed',
          }),
        }),
      );
    });
  });

  describe('getResetHistory', () => {
    it('should retrieve reset history with default limit', async () => {
      const mockHistory = [
        {
          id: 1,
          resetDate: new Date(),
          success: true,
          usersAffected: 20,
          errorMessage: null,
          metadata: '{}',
          createdAt: new Date(),
        },
      ];
      mockPrismaService.limitResetLog.findMany.mockResolvedValue(mockHistory);

      const result = await service.getResetHistory();

      expect(result).toEqual(mockHistory);
      expect(prismaService.limitResetLog.findMany).toHaveBeenCalledWith({
        orderBy: { resetDate: 'desc' },
        take: 50,
      });
    });

    it('should retrieve reset history with custom limit', async () => {
      const mockHistory = [];
      mockPrismaService.limitResetLog.findMany.mockResolvedValue(mockHistory);

      await service.getResetHistory(100);

      expect(prismaService.limitResetLog.findMany).toHaveBeenCalledWith({
        orderBy: { resetDate: 'desc' },
        take: 100,
      });
    });
  });
});
