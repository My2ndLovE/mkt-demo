import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction } from './dtos';

describe('AuditService', () => {
  let service: AuditService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
  };

  const mockAuditLog = {
    id: 1,
    action: AuditAction.BET_PLACED,
    userId: 5,
    metadata: JSON.stringify({ betId: 123, amount: 100 }),
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
    createdAt: new Date(),
    user: {
      id: 5,
      username: 'agent_john',
      fullName: 'John Doe',
      role: 'AGENT',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuditService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<AuditService>(AuditService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('log', () => {
    it('should create an audit log', async () => {
      mockPrismaService.auditLog.create.mockResolvedValue(mockAuditLog);

      const result = await service.log(
        AuditAction.BET_PLACED,
        5,
        { betId: 123, amount: 100 },
        '192.168.1.1',
        'Mozilla/5.0',
      );

      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: AuditAction.BET_PLACED,
          userId: 5,
          metadata: JSON.stringify({ betId: 123, amount: 100 }),
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
      });
      expect(result).toEqual(mockAuditLog);
    });

    it('should handle system actions with null userId', async () => {
      mockPrismaService.auditLog.create.mockResolvedValue({
        ...mockAuditLog,
        userId: null,
      });

      await service.log(AuditAction.WEEKLY_LIMIT_RESET, null, { affectedUsers: 50 });

      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: null,
        }),
      });
    });

    it('should not throw if audit logging fails', async () => {
      mockPrismaService.auditLog.create.mockRejectedValue(new Error('Database error'));

      const result = await service.log(AuditAction.BET_PLACED, 5, { betId: 123 });

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return paginated audit logs', async () => {
      mockPrismaService.auditLog.count.mockResolvedValue(1);
      mockPrismaService.auditLog.findMany.mockResolvedValue([mockAuditLog]);

      const result = await service.findAll({ page: 1, limit: 50 });

      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.data[0].metadata).toEqual({ betId: 123, amount: 100 });
    });

    it('should filter by action', async () => {
      mockPrismaService.auditLog.count.mockResolvedValue(1);
      mockPrismaService.auditLog.findMany.mockResolvedValue([mockAuditLog]);

      await service.findAll({ action: AuditAction.BET_PLACED, page: 1, limit: 50 });

      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            action: AuditAction.BET_PLACED,
          }),
        }),
      );
    });
  });

  describe('findByUser', () => {
    it('should return audit logs for a specific user', async () => {
      mockPrismaService.auditLog.count.mockResolvedValue(1);
      mockPrismaService.auditLog.findMany.mockResolvedValue([mockAuditLog]);

      const result = await service.findByUser(5, { page: 1, limit: 50 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].userId).toBe(5);
    });
  });

  describe('findRecent', () => {
    it('should return recent audit logs', async () => {
      mockPrismaService.auditLog.findMany.mockResolvedValue([mockAuditLog]);

      const result = await service.findRecent(100);

      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: expect.any(Object),
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('getStats', () => {
    it('should return audit statistics', async () => {
      mockPrismaService.auditLog.count
        .mockResolvedValueOnce(1000) // Total
        .mockResolvedValueOnce(50) // Today
        .mockResolvedValueOnce(200) // This week
        .mockResolvedValueOnce(500); // This month

      mockPrismaService.auditLog.groupBy.mockResolvedValue([
        { action: AuditAction.BET_PLACED, _count: { action: 300 } },
        { action: AuditAction.USER_LOGIN, _count: { action: 150 } },
      ]);

      const result = await service.getStats();

      expect(result.total).toBe(1000);
      expect(result.today).toBe(50);
      expect(result.thisWeek).toBe(200);
      expect(result.thisMonth).toBe(500);
      expect(result.topActions).toHaveLength(2);
    });
  });
});
