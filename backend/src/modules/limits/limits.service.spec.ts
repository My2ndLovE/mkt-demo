import { Test, TestingModule } from '@nestjs/testing';
import { LimitsService } from './limits.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('LimitsService', () => {
  let service: LimitsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    limitResetLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockUser = {
    id: 1,
    username: 'agent_john',
    fullName: 'John Doe',
    role: 'AGENT',
    weeklyLimit: 10000,
    weeklyUsed: 5000,
    active: true,
    upline: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LimitsService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<LimitsService>(LimitsService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkLimit', () => {
    it('should return allowed=true when bet is within limits', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.checkLimit(1, 2000);

      expect(result.allowed).toBe(true);
      expect(result.weeklyLimit).toBe(10000);
      expect(result.weeklyUsed).toBe(5000);
      expect(result.weeklyRemaining).toBe(5000);
      expect(result.message).toBe('Bet is within limits');
    });

    it('should return allowed=false when bet exceeds limits', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.checkLimit(1, 6000);

      expect(result.allowed).toBe(false);
      expect(result.message).toContain('Insufficient weekly limit');
    });

    it('should return allowed=false for inactive user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        active: false,
      });

      const result = await service.checkLimit(1, 1000);

      expect(result.allowed).toBe(false);
      expect(result.message).toBe('User account is inactive');
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.checkLimit(999, 1000)).rejects.toThrow(NotFoundException);
    });
  });

  describe('deductLimit', () => {
    it('should deduct amount from weeklyUsed', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        weeklyUsed: 6000,
      });

      await service.deductLimit(1, 1000);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { weeklyUsed: 6000 },
      });
    });

    it('should throw BadRequestException if amount exceeds limit', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.deductLimit(1, 6000)).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.deductLimit(999, 1000)).rejects.toThrow(NotFoundException);
    });
  });

  describe('refundLimit', () => {
    it('should refund amount to weeklyUsed', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        weeklyUsed: 4000,
      });

      await service.refundLimit(1, 1000);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { weeklyUsed: 4000 },
      });
    });

    it('should not allow negative weeklyUsed', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        weeklyUsed: 100,
      });
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        weeklyUsed: 0,
      });

      await service.refundLimit(1, 500);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { weeklyUsed: 0 },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.refundLimit(999, 1000)).rejects.toThrow(NotFoundException);
    });
  });

  describe('resetWeeklyLimits', () => {
    it('should reset all users weeklyUsed to 0', async () => {
      mockPrismaService.user.count.mockResolvedValue(50);
      mockPrismaService.user.aggregate.mockResolvedValue({
        _sum: { weeklyLimit: 500000 },
      });
      mockPrismaService.user.updateMany.mockResolvedValue({ count: 50 });
      mockPrismaService.limitResetLog.create.mockResolvedValue({});

      await service.resetWeeklyLimits();

      expect(mockPrismaService.user.updateMany).toHaveBeenCalledWith({
        where: { weeklyUsed: { gt: 0 } },
        data: { weeklyUsed: 0 },
      });

      expect(mockPrismaService.limitResetLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          affectedUsers: 50,
          totalLimit: 500000,
          status: 'SUCCESS',
        }),
      });
    });

    it('should log error if reset fails', async () => {
      const error = new Error('Database error');
      mockPrismaService.user.count.mockRejectedValue(error);
      mockPrismaService.limitResetLog.create.mockResolvedValue({});

      await expect(service.resetWeeklyLimits()).rejects.toThrow('Database error');

      expect(mockPrismaService.limitResetLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: 'FAILED',
          errorMessage: 'Database error',
        }),
      });
    });
  });

  describe('getMyLimits', () => {
    it('should return user limits with calculated fields', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getMyLimits(1);

      expect(result.userId).toBe(1);
      expect(result.username).toBe('agent_john');
      expect(result.weeklyLimit).toBe(10000);
      expect(result.weeklyUsed).toBe(5000);
      expect(result.weeklyRemaining).toBe(5000);
      expect(result.usagePercentage).toBe('50.00');
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getMyLimits(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateLimits', () => {
    it('should update user limits', async () => {
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce({ ...mockUser, upline: null })
        .mockResolvedValueOnce({ ...mockUser, weeklyLimit: 12000 });
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        weeklyLimit: 12000,
      });

      const result = await service.updateLimits(1, { weeklyLimit: 12000 }, 2);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { weeklyLimit: 12000 },
      });
      expect(result.weeklyLimit).toBe(12000);
    });

    it('should throw BadRequestException if sub-agent limit exceeds parent', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        upline: { weeklyLimit: 10000 },
      });

      await expect(service.updateLimits(1, { weeklyLimit: 15000 }, 2)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if weeklyUsed exceeds weeklyLimit', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.updateLimits(1, { weeklyLimit: 5000, weeklyUsed: 6000 }, 2),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.updateLimits(999, { weeklyLimit: 10000 }, 2)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getAllLimits', () => {
    it('should return all users limits', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([mockUser]);

      const result = await service.getAllLimits({});

      expect(mockPrismaService.user.findMany).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].username).toBe('agent_john');
    });

    it('should filter by search query', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([mockUser]);

      await service.getAllLimits({ search: 'john' });

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        }),
      );
    });
  });

  describe('getResetLogs', () => {
    it('should return recent reset logs', async () => {
      const mockLogs = [
        {
          id: 1,
          resetDate: new Date(),
          affectedUsers: 50,
          totalLimit: 500000,
          status: 'SUCCESS',
          errorMessage: null,
          createdAt: new Date(),
        },
      ];
      mockPrismaService.limitResetLog.findMany.mockResolvedValue(mockLogs);

      const result = await service.getResetLogs(10);

      expect(mockPrismaService.limitResetLog.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
      expect(result).toHaveLength(1);
    });
  });
});
