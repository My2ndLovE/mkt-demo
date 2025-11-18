import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import {
  CreateUserDto,
  UpdateUserDto,
  TransferUplineDto,
  UserRole,
  QueryUserDto,
  UserSortField,
  SortOrder,
} from './dtos';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;

  // Mock Prisma Service
  const mockPrismaService = {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    $queryRaw: jest.fn(),
  };

  // Mock data
  const mockAdmin = {
    id: 1,
    username: 'admin',
    passwordHash: 'hashed_password',
    role: UserRole.ADMIN,
    fullName: 'Admin User',
    phone: null,
    email: 'admin@example.com',
    uplineId: null,
    moderatorId: null,
    weeklyLimit: 1000000,
    commissionRate: 10,
    canCreateSubs: true,
    active: true,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockModerator = {
    id: 2,
    username: 'moderator001',
    passwordHash: 'hashed_password',
    role: UserRole.MODERATOR,
    fullName: 'Moderator One',
    phone: '+60123456789',
    email: 'moderator@example.com',
    uplineId: null,
    moderatorId: null,
    weeklyLimit: 500000,
    commissionRate: 8,
    canCreateSubs: true,
    active: true,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAgent = {
    id: 3,
    username: 'agent001',
    passwordHash: 'hashed_password',
    role: UserRole.AGENT,
    fullName: 'Agent One',
    phone: '+60123456788',
    email: 'agent@example.com',
    uplineId: null,
    moderatorId: 2,
    weeklyLimit: 100000,
    commissionRate: 5,
    canCreateSubs: true,
    active: true,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSubAgent = {
    id: 4,
    username: 'agent002',
    passwordHash: 'hashed_password',
    role: UserRole.AGENT,
    fullName: 'Agent Two',
    phone: '+60123456787',
    email: 'agent2@example.com',
    uplineId: 3,
    moderatorId: 2,
    weeklyLimit: 50000,
    commissionRate: 3,
    canCreateSubs: true,
    active: true,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);

    // Reset mocks
    jest.clearAllMocks();
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
  });

  describe('create', () => {
    it('should create an ADMIN user successfully', async () => {
      const createDto: CreateUserDto = {
        username: 'newadmin',
        role: UserRole.ADMIN,
        fullName: 'New Admin',
        weeklyLimit: 1000000,
        commissionRate: 10,
        canCreateSubs: true,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null); // Username available
      mockPrismaService.user.create.mockResolvedValue({ ...mockAdmin, username: 'newadmin' });

      const result = await service.create(createDto);

      expect(result.username).toBe('newadmin');
      expect(result.passwordHash).toBeUndefined(); // Should be sanitized
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          username: 'newadmin',
          role: UserRole.ADMIN,
          uplineId: undefined,
          moderatorId: undefined,
        }),
      });
    });

    it('should create a MODERATOR user successfully', async () => {
      const createDto: CreateUserDto = {
        username: 'moderator002',
        role: UserRole.MODERATOR,
        fullName: 'Moderator Two',
        weeklyLimit: 500000,
        commissionRate: 8,
        canCreateSubs: true,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        ...mockModerator,
        username: 'moderator002',
      });

      const result = await service.create(createDto);

      expect(result.username).toBe('moderator002');
      expect(result.role).toBe(UserRole.MODERATOR);
    });

    it('should create an AGENT user with uplineId', async () => {
      const createDto: CreateUserDto = {
        username: 'agent003',
        role: UserRole.AGENT,
        fullName: 'Agent Three',
        uplineId: 3,
        weeklyLimit: 30000,
        commissionRate: 2.5,
        canCreateSubs: false,
      };

      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(null) // Username check
        .mockResolvedValueOnce({ ...mockAgent, id: 3 }); // Upline fetch

      mockPrismaService.user.create.mockResolvedValue({
        ...mockSubAgent,
        username: 'agent003',
      });

      const result = await service.create(createDto, 1);

      expect(result.username).toBe('agent003');
      expect(result.uplineId).toBe(3);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          uplineId: 3,
          moderatorId: 2, // Inherited from upline
        }),
      });
    });

    it('should throw ConflictException if username exists', async () => {
      const createDto: CreateUserDto = {
        username: 'admin',
        role: UserRole.ADMIN,
        fullName: 'Duplicate Admin',
        weeklyLimit: 1000000,
        commissionRate: 10,
        canCreateSubs: true,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockAdmin);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException if ADMIN has uplineId', async () => {
      const createDto: CreateUserDto = {
        username: 'badadmin',
        role: UserRole.ADMIN,
        fullName: 'Bad Admin',
        uplineId: 2,
        weeklyLimit: 1000000,
        commissionRate: 10,
        canCreateSubs: true,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
      await expect(service.create(createDto)).rejects.toThrow('ADMIN users cannot have an upline');
    });

    it('should throw BadRequestException if MODERATOR has uplineId', async () => {
      const createDto: CreateUserDto = {
        username: 'badmod',
        role: UserRole.MODERATOR,
        fullName: 'Bad Moderator',
        uplineId: 2,
        weeklyLimit: 500000,
        commissionRate: 8,
        canCreateSubs: true,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        'MODERATOR users cannot have an upline',
      );
    });

    it('should throw BadRequestException if AGENT missing uplineId', async () => {
      const createDto: CreateUserDto = {
        username: 'badagent',
        role: UserRole.AGENT,
        fullName: 'Bad Agent',
        weeklyLimit: 50000,
        commissionRate: 3,
        canCreateSubs: false,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow('AGENT users must have an uplineId');
    });

    it('should validate sub-agent weeklyLimit <= creator weeklyLimit', async () => {
      const createDto: CreateUserDto = {
        username: 'badsubagent',
        role: UserRole.AGENT,
        fullName: 'Bad Sub Agent',
        uplineId: 3,
        weeklyLimit: 200000, // Exceeds creator's 100000
        commissionRate: 3,
        canCreateSubs: false,
      };

      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(null) // Username check
        .mockResolvedValueOnce({ ...mockAgent, id: 3 }); // Creator/upline

      await expect(service.create(createDto, 3)).rejects.toThrow(BadRequestException);
      await expect(service.create(createDto, 3)).rejects.toThrow(
        /weeklyLimit.*cannot exceed your limit/,
      );
    });

    it('should validate sub-agent commissionRate <= creator commissionRate', async () => {
      const createDto: CreateUserDto = {
        username: 'badsubagent',
        role: UserRole.AGENT,
        fullName: 'Bad Sub Agent',
        uplineId: 3,
        weeklyLimit: 50000,
        commissionRate: 7, // Exceeds creator's 5
        canCreateSubs: false,
      };

      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ ...mockAgent, id: 3 });

      await expect(service.create(createDto, 3)).rejects.toThrow(
        /commissionRate.*cannot exceed your rate/,
      );
    });

    it('should throw ForbiddenException if creator cannot create subs', async () => {
      const createDto: CreateUserDto = {
        username: 'subagent',
        role: UserRole.AGENT,
        fullName: 'Sub Agent',
        uplineId: 3,
        weeklyLimit: 20000,
        commissionRate: 2,
        canCreateSubs: false,
      };

      const creatorWithoutSubs = { ...mockAgent, canCreateSubs: false };
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(creatorWithoutSubs);

      await expect(service.create(createDto, 3)).rejects.toThrow(ForbiddenException);
      await expect(service.create(createDto, 3)).rejects.toThrow(
        'You do not have permission to create sub-agents',
      );
    });

    it('should throw BadRequestException if creator is inactive', async () => {
      const createDto: CreateUserDto = {
        username: 'subagent',
        role: UserRole.AGENT,
        fullName: 'Sub Agent',
        uplineId: 3,
        weeklyLimit: 20000,
        commissionRate: 2,
        canCreateSubs: false,
      };

      const inactiveCreator = { ...mockAgent, active: false };
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(inactiveCreator);

      await expect(service.create(createDto, 3)).rejects.toThrow(BadRequestException);
      await expect(service.create(createDto, 3)).rejects.toThrow(
        'Cannot create sub-agents when your account is inactive',
      );
    });

    it('should allow admin to create agent under different upline', async () => {
      const createDto: CreateUserDto = {
        username: 'agent004',
        role: UserRole.AGENT,
        fullName: 'Agent Four',
        uplineId: 3, // Different from creator (admin ID: 1)
        weeklyLimit: 50000,
        commissionRate: 4,
        canCreateSubs: true,
      };

      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(null) // Username check
        .mockResolvedValueOnce(mockAdmin) // Creator is admin
        .mockResolvedValueOnce(mockAgent); // Upline fetch

      mockPrismaService.user.create.mockResolvedValue({
        ...mockSubAgent,
        username: 'agent004',
      });

      const result = await service.create(createDto, 1); // Admin creating

      expect(result.username).toBe('agent004');
      // Should skip sub-agent validation since creator is admin
    });
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const query: QueryUserDto = {
        page: 1,
        limit: 20,
        sortBy: UserSortField.CREATED_AT,
        sortOrder: SortOrder.DESC,
      };

      const mockUsers = [mockAdmin, mockModerator, mockAgent];
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);
      mockPrismaService.user.count.mockResolvedValue(3);

      const result = await service.findAll(query);

      expect(result.data).toHaveLength(3);
      expect(result.meta.total).toBe(3);
      expect(result.meta.page).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });

    it('should filter by role', async () => {
      const query: QueryUserDto = {
        page: 1,
        limit: 20,
        role: UserRole.AGENT,
      };

      mockPrismaService.user.findMany.mockResolvedValue([mockAgent, mockSubAgent]);
      mockPrismaService.user.count.mockResolvedValue(2);

      const result = await service.findAll(query);

      expect(result.data).toHaveLength(2);
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ role: UserRole.AGENT }),
        }),
      );
    });

    it('should filter by moderatorId', async () => {
      const query: QueryUserDto = {
        page: 1,
        limit: 20,
        moderatorId: 2,
      };

      mockPrismaService.user.findMany.mockResolvedValue([mockAgent, mockSubAgent]);
      mockPrismaService.user.count.mockResolvedValue(2);

      await service.findAll(query);

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ moderatorId: 2 }),
        }),
      );
    });

    it('should filter by uplineId', async () => {
      const query: QueryUserDto = {
        page: 1,
        limit: 20,
        uplineId: 3,
      };

      mockPrismaService.user.findMany.mockResolvedValue([mockSubAgent]);
      mockPrismaService.user.count.mockResolvedValue(1);

      await service.findAll(query);

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ uplineId: 3 }),
        }),
      );
    });

    it('should filter by active status', async () => {
      const query: QueryUserDto = {
        page: 1,
        limit: 20,
        active: false,
      };

      mockPrismaService.user.findMany.mockResolvedValue([]);
      mockPrismaService.user.count.mockResolvedValue(0);

      await service.findAll(query);

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ active: false }),
        }),
      );
    });

    it('should search by username or fullName', async () => {
      const query: QueryUserDto = {
        page: 1,
        limit: 20,
        search: 'agent',
      };

      mockPrismaService.user.findMany.mockResolvedValue([mockAgent, mockSubAgent]);
      mockPrismaService.user.count.mockResolvedValue(2);

      await service.findAll(query);

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { username: { contains: 'agent', mode: 'insensitive' } },
              { fullName: { contains: 'agent', mode: 'insensitive' } },
            ]),
          }),
        }),
      );
    });

    it('should calculate pagination correctly', async () => {
      const query: QueryUserDto = {
        page: 2,
        limit: 10,
      };

      mockPrismaService.user.findMany.mockResolvedValue([]);
      mockPrismaService.user.count.mockResolvedValue(25);

      const result = await service.findAll(query);

      expect(result.meta.page).toBe(2);
      expect(result.meta.limit).toBe(10);
      expect(result.meta.totalPages).toBe(3);
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10, // (page - 1) * limit
          take: 10,
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return user by id', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockAgent);

      const result = await service.findOne(3);

      expect(result.id).toBe(3);
      expect(result.username).toBe('agent001');
      expect(result.passwordHash).toBeUndefined();
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow('User with ID 999 not found');
    });
  });

  describe('update', () => {
    it('should allow user to update own profile', async () => {
      const updateDto: UpdateUserDto = {
        fullName: 'Agent One Updated',
        phone: '+60987654321',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockAgent);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockAgent,
        ...updateDto,
      });

      const result = await service.update(3, updateDto, 3, false);

      expect(result.fullName).toBe('Agent One Updated');
      expect(result.phone).toBe('+60987654321');
    });

    it('should throw ForbiddenException if non-admin updates another user', async () => {
      const updateDto: UpdateUserDto = {
        fullName: 'Updated Name',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockAgent);

      await expect(service.update(3, updateDto, 4, false)).rejects.toThrow(ForbiddenException);
      await expect(service.update(3, updateDto, 4, false)).rejects.toThrow(
        'You can only update your own profile',
      );
    });

    it('should throw ForbiddenException if non-admin tries to update admin-only fields', async () => {
      const updateDto: UpdateUserDto = {
        weeklyLimit: 200000,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockAgent);

      await expect(service.update(3, updateDto, 3, false)).rejects.toThrow(ForbiddenException);
      await expect(service.update(3, updateDto, 3, false)).rejects.toThrow(
        /Only admins can update/,
      );
    });

    it('should allow admin to update all fields', async () => {
      const updateDto: UpdateUserDto = {
        weeklyLimit: 120000,
        commissionRate: 5.5,
        canCreateSubs: false,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockAgent);
      mockPrismaService.user.findMany.mockResolvedValue([]); // No downlines
      mockPrismaService.user.update.mockResolvedValue({
        ...mockAgent,
        ...updateDto,
      });

      const result = await service.update(3, updateDto, 1, true);

      expect(result.weeklyLimit).toBe(120000);
      expect(result.commissionRate).toBe(5.5);
    });

    it('should validate weeklyLimit against upline limit', async () => {
      const updateDto: UpdateUserDto = {
        weeklyLimit: 150000, // Exceeds upline's limit
      };

      const agentWithUpline = { ...mockSubAgent, uplineId: 3 };
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(agentWithUpline) // Target user
        .mockResolvedValueOnce(mockAgent); // Upline

      await expect(service.update(4, updateDto, 1, true)).rejects.toThrow(BadRequestException);
      await expect(service.update(4, updateDto, 1, true)).rejects.toThrow(
        /cannot exceed upline's limit/,
      );
    });

    it('should validate commissionRate against upline rate', async () => {
      const updateDto: UpdateUserDto = {
        commissionRate: 7, // Exceeds upline's 5%
      };

      const agentWithUpline = { ...mockSubAgent, uplineId: 3 };
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(agentWithUpline)
        .mockResolvedValueOnce(mockAgent);

      await expect(service.update(4, updateDto, 1, true)).rejects.toThrow(
        /cannot exceed upline's rate/,
      );
    });

    it('should validate weeklyLimit against downline limits', async () => {
      const updateDto: UpdateUserDto = {
        weeklyLimit: 40000, // Less than downline's 50000
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockAgent);
      mockPrismaService.user.findMany.mockResolvedValue([mockSubAgent]);

      await expect(service.update(3, updateDto, 1, true)).rejects.toThrow(BadRequestException);
      await expect(service.update(3, updateDto, 1, true)).rejects.toThrow(
        /Cannot reduce weeklyLimit below downline/,
      );
    });

    it('should validate commissionRate against downline rates', async () => {
      const updateDto: UpdateUserDto = {
        commissionRate: 2, // Less than downline's 3%
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockAgent);
      mockPrismaService.user.findMany.mockResolvedValue([mockSubAgent]);

      await expect(service.update(3, updateDto, 1, true)).rejects.toThrow(
        /Cannot reduce commissionRate below downline/,
      );
    });
  });

  describe('remove', () => {
    it('should soft delete user by setting active=false', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockAgent);
      mockPrismaService.user.count.mockResolvedValue(0); // No active downlines
      mockPrismaService.user.update.mockResolvedValue({
        ...mockAgent,
        active: false,
      });

      const result = await service.remove(3);

      expect(result.active).toBe(false);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 3 },
        data: { active: false },
      });
    });

    it('should throw BadRequestException if user has active downlines', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockAgent);
      mockPrismaService.user.count.mockResolvedValue(5); // Has active downlines

      await expect(service.remove(3)).rejects.toThrow(BadRequestException);
      await expect(service.remove(3)).rejects.toThrow('Cannot delete user with 5 active downlines');
    });
  });

  describe('getUplineChain', () => {
    it('should return upline chain using recursive CTE', async () => {
      const mockUplineChain = [
        { id: 3, username: 'agent001', level: 1 },
        { id: 2, username: 'moderator001', level: 2 },
        { id: 1, username: 'admin', level: 3 },
      ];

      mockPrismaService.user.findUnique.mockResolvedValue(mockSubAgent);
      mockPrismaService.$queryRaw.mockResolvedValue(mockUplineChain);

      const result = await service.getUplineChain(4);

      expect(result).toHaveLength(3);
      expect(result[0].username).toBe('agent001');
      expect(result[2].username).toBe('admin');
      expect(mockPrismaService.$queryRaw).toHaveBeenCalled();
    });

    it('should return empty array if user has no upline', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockAdmin);
      mockPrismaService.$queryRaw.mockResolvedValue([]);

      const result = await service.getUplineChain(1);

      expect(result).toHaveLength(0);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getUplineChain(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getDownlines', () => {
    it('should return direct children only', async () => {
      const mockDownlines = [mockSubAgent];

      mockPrismaService.user.findUnique.mockResolvedValue(mockAgent);
      mockPrismaService.user.findMany.mockResolvedValue(mockDownlines);

      const result = await service.getDownlines(3);

      expect(result).toHaveLength(1);
      expect(result[0].uplineId).toBe(3);
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { uplineId: 3, active: true },
        }),
      );
    });

    it('should return empty array if no downlines', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockSubAgent);
      mockPrismaService.user.findMany.mockResolvedValue([]);

      const result = await service.getDownlines(4);

      expect(result).toHaveLength(0);
    });
  });

  describe('getDescendants', () => {
    it('should return entire subtree with levels', async () => {
      const mockDescendants = [
        { id: 4, username: 'agent002', level: 1 },
        { id: 5, username: 'agent003', level: 2 },
        { id: 6, username: 'agent004', level: 2 },
        { id: 7, username: 'agent005', level: 3 },
      ];

      mockPrismaService.user.findUnique.mockResolvedValue(mockAgent);
      mockPrismaService.$queryRaw.mockResolvedValue(mockDescendants);

      const result = await service.getDescendants(3);

      expect(result).toHaveLength(4);
      expect(result[0].level).toBe(1);
      expect(result[3].level).toBe(3);
      expect(mockPrismaService.$queryRaw).toHaveBeenCalled();
    });

    it('should return empty array if no descendants', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockSubAgent);
      mockPrismaService.$queryRaw.mockResolvedValue([]);

      const result = await service.getDescendants(4);

      expect(result).toHaveLength(0);
    });
  });

  describe('transferUpline', () => {
    it('should transfer agent to new upline successfully', async () => {
      const transferDto: TransferUplineDto = {
        newUplineId: 5,
      };

      const newUpline = { ...mockAgent, id: 5, username: 'agent_new' };
      const currentAgent = { ...mockSubAgent, id: 4, uplineId: 3 };

      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(currentAgent) // Agent to transfer
        .mockResolvedValueOnce(newUpline); // New upline

      mockPrismaService.$queryRaw.mockResolvedValue([]); // No circular hierarchy

      mockPrismaService.user.update.mockResolvedValue({
        ...currentAgent,
        uplineId: 5,
      });

      const result = await service.transferUpline(4, transferDto);

      expect(result.uplineId).toBe(5);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 4 },
        data: expect.objectContaining({
          uplineId: 5,
        }),
      });
    });

    it('should throw BadRequestException if target is not AGENT', async () => {
      const transferDto: TransferUplineDto = {
        newUplineId: 5,
      };

      mockPrismaService.user.findUnique.mockResolvedValueOnce(mockAdmin);

      await expect(service.transferUpline(1, transferDto)).rejects.toThrow(BadRequestException);
      await expect(service.transferUpline(1, transferDto)).rejects.toThrow(
        'Can only transfer AGENT users',
      );
    });

    it('should throw BadRequestException if new upline is not AGENT', async () => {
      const transferDto: TransferUplineDto = {
        newUplineId: 2, // Moderator
      };

      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(mockAgent)
        .mockResolvedValueOnce(mockModerator);

      await expect(service.transferUpline(3, transferDto)).rejects.toThrow(
        'New upline must be an AGENT',
      );
    });

    it('should prevent agent from being own upline', async () => {
      const transferDto: TransferUplineDto = {
        newUplineId: 3, // Same as agent ID
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockAgent);

      await expect(service.transferUpline(3, transferDto)).rejects.toThrow(BadRequestException);
      await expect(service.transferUpline(3, transferDto)).rejects.toThrow(
        'Agent cannot be their own upline',
      );
    });

    it('should prevent circular hierarchy (upline under descendant)', async () => {
      const transferDto: TransferUplineDto = {
        newUplineId: 4, // Descendant of agent 3
      };

      const mockDescendants = [{ id: 4, username: 'agent002', level: 1 }];

      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(mockAgent) // Agent to transfer
        .mockResolvedValueOnce(mockSubAgent) // New upline (is descendant)
        .mockResolvedValueOnce(mockAgent); // For getDescendants

      mockPrismaService.$queryRaw.mockResolvedValue(mockDescendants);

      await expect(service.transferUpline(3, transferDto)).rejects.toThrow(BadRequestException);
      await expect(service.transferUpline(3, transferDto)).rejects.toThrow(/circular hierarchy/);
    });
  });
});
