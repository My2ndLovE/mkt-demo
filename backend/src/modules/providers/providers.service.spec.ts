import { Test, TestingModule } from '@nestjs/testing';
import { ProvidersService } from './providers.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionService } from '../encryption/encryption.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CreateProviderDto, Country, GameType, BetType } from './dtos';

describe('ProvidersService', () => {
  let service: ProvidersService;
  let prismaService: PrismaService;
  let encryptionService: EncryptionService;

  const mockPrismaService = {
    serviceProvider: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockEncryptionService = {
    encrypt: jest.fn(),
    decrypt: jest.fn(),
  };

  const mockProvider = {
    id: 'provider-123',
    code: 'M',
    name: 'Magnum 4D',
    country: 'MY',
    active: true,
    availableGames: JSON.stringify(['3D', '4D']),
    betTypes: JSON.stringify(['BIG', 'SMALL']),
    drawSchedule: JSON.stringify({ days: [0, 3, 6], time: '19:00' }),
    apiEndpoint: 'https://api.magnum.com',
    apiKey: 'encrypted-key-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProvidersService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EncryptionService, useValue: mockEncryptionService },
      ],
    }).compile();

    service = module.get<ProvidersService>(ProvidersService);
    prismaService = module.get<PrismaService>(PrismaService);
    encryptionService = module.get<EncryptionService>(EncryptionService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateProviderDto = {
      code: 'M',
      name: 'Magnum 4D',
      country: Country.MY,
      availableGames: [GameType.THREE_D, GameType.FOUR_D],
      betTypes: [BetType.BIG, BetType.SMALL],
      drawSchedule: { days: [0, 3, 6], time: '19:00' },
      apiEndpoint: 'https://api.magnum.com',
      apiKey: 'test-api-key',
    };

    it('should create a provider with encrypted API key', async () => {
      mockPrismaService.serviceProvider.findUnique.mockResolvedValue(null);
      mockEncryptionService.encrypt.mockResolvedValue('encrypted-key-123');
      mockPrismaService.serviceProvider.create.mockResolvedValue(mockProvider);

      const result = await service.create(createDto);

      expect(mockPrismaService.serviceProvider.findUnique).toHaveBeenCalledWith({
        where: { code: 'M' },
      });
      expect(mockEncryptionService.encrypt).toHaveBeenCalledWith('test-api-key');
      expect(mockPrismaService.serviceProvider.create).toHaveBeenCalled();
      expect(result.code).toBe('M');
      expect(result.name).toBe('Magnum 4D');
    });

    it('should throw ConflictException if provider code exists', async () => {
      mockPrismaService.serviceProvider.findUnique.mockResolvedValue(mockProvider);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
      expect(mockPrismaService.serviceProvider.create).not.toHaveBeenCalled();
    });

    it('should create provider without API key', async () => {
      const dtoWithoutApiKey = { ...createDto, apiKey: undefined };
      mockPrismaService.serviceProvider.findUnique.mockResolvedValue(null);
      mockPrismaService.serviceProvider.create.mockResolvedValue({
        ...mockProvider,
        apiKey: null,
      });

      await service.create(dtoWithoutApiKey);

      expect(mockEncryptionService.encrypt).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all active providers by default', async () => {
      mockPrismaService.serviceProvider.findMany.mockResolvedValue([mockProvider]);

      const result = await service.findAll({ active: true }, false);

      expect(mockPrismaService.serviceProvider.findMany).toHaveBeenCalledWith({
        where: { active: true },
        orderBy: [{ country: 'asc' }, { name: 'asc' }],
      });
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe('M');
    });

    it('should filter by country', async () => {
      mockPrismaService.serviceProvider.findMany.mockResolvedValue([mockProvider]);

      await service.findAll({ country: Country.MY }, false);

      expect(mockPrismaService.serviceProvider.findMany).toHaveBeenCalledWith({
        where: { country: 'MY' },
        orderBy: [{ country: 'asc' }, { name: 'asc' }],
      });
    });

    it('should search by name or code', async () => {
      mockPrismaService.serviceProvider.findMany.mockResolvedValue([mockProvider]);

      await service.findAll({ search: 'Magnum' }, false);

      expect(mockPrismaService.serviceProvider.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: 'Magnum', mode: 'insensitive' } },
            { code: { contains: 'Magnum', mode: 'insensitive' } },
          ],
        },
        orderBy: [{ country: 'asc' }, { name: 'asc' }],
      });
    });

    it('should decrypt API key when includeApiKey is true', async () => {
      mockPrismaService.serviceProvider.findMany.mockResolvedValue([mockProvider]);
      mockEncryptionService.decrypt.mockResolvedValue('decrypted-key');

      const result = await service.findAll({}, true);

      expect(mockEncryptionService.decrypt).toHaveBeenCalledWith('encrypted-key-123');
      expect(result[0].apiKey).toBe('decrypted-key');
    });
  });

  describe('findOne', () => {
    it('should return a provider by ID', async () => {
      mockPrismaService.serviceProvider.findUnique.mockResolvedValue(mockProvider);

      const result = await service.findOne('provider-123', false);

      expect(mockPrismaService.serviceProvider.findUnique).toHaveBeenCalledWith({
        where: { id: 'provider-123' },
      });
      expect(result.code).toBe('M');
    });

    it('should throw NotFoundException if provider not found', async () => {
      mockPrismaService.serviceProvider.findUnique.mockResolvedValue(null);

      await expect(service.findOne('invalid-id', false)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByCode', () => {
    it('should return a provider by code', async () => {
      mockPrismaService.serviceProvider.findUnique.mockResolvedValue(mockProvider);

      const result = await service.findByCode('M', false);

      expect(mockPrismaService.serviceProvider.findUnique).toHaveBeenCalledWith({
        where: { code: 'M' },
      });
      expect(result.name).toBe('Magnum 4D');
    });

    it('should throw NotFoundException if provider not found', async () => {
      mockPrismaService.serviceProvider.findUnique.mockResolvedValue(null);

      await expect(service.findByCode('INVALID', false)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a provider', async () => {
      const updateDto = { name: 'Updated Magnum' };
      mockPrismaService.serviceProvider.findUnique.mockResolvedValue(mockProvider);
      mockPrismaService.serviceProvider.update.mockResolvedValue({
        ...mockProvider,
        name: 'Updated Magnum',
      });

      const result = await service.update('provider-123', updateDto);

      expect(mockPrismaService.serviceProvider.update).toHaveBeenCalledWith({
        where: { id: 'provider-123' },
        data: { name: 'Updated Magnum' },
      });
      expect(result.name).toBe('Updated Magnum');
    });

    it('should throw NotFoundException if provider not found', async () => {
      mockPrismaService.serviceProvider.findUnique.mockResolvedValue(null);

      await expect(service.update('invalid-id', {})).rejects.toThrow(NotFoundException);
    });

    it('should re-encrypt API key if provided', async () => {
      const updateDto = { apiKey: 'new-api-key' };
      mockPrismaService.serviceProvider.findUnique.mockResolvedValue(mockProvider);
      mockEncryptionService.encrypt.mockResolvedValue('new-encrypted-key');
      mockPrismaService.serviceProvider.update.mockResolvedValue({
        ...mockProvider,
        apiKey: 'new-encrypted-key',
      });

      await service.update('provider-123', updateDto);

      expect(mockEncryptionService.encrypt).toHaveBeenCalledWith('new-api-key');
      expect(mockPrismaService.serviceProvider.update).toHaveBeenCalledWith({
        where: { id: 'provider-123' },
        data: { apiKey: 'new-encrypted-key' },
      });
    });

    it('should throw ConflictException if new code already exists', async () => {
      const updateDto = { code: 'P' };
      mockPrismaService.serviceProvider.findUnique
        .mockResolvedValueOnce(mockProvider) // First call: find existing provider
        .mockResolvedValueOnce({ ...mockProvider, id: 'different-id', code: 'P' }); // Second call: check new code

      await expect(service.update('provider-123', updateDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should soft delete a provider', async () => {
      mockPrismaService.serviceProvider.findUnique.mockResolvedValue(mockProvider);
      mockPrismaService.serviceProvider.update.mockResolvedValue({
        ...mockProvider,
        active: false,
      });

      const result = await service.remove('provider-123');

      expect(mockPrismaService.serviceProvider.update).toHaveBeenCalledWith({
        where: { id: 'provider-123' },
        data: { active: false },
      });
      expect(result.active).toBe(false);
    });

    it('should throw NotFoundException if provider not found', async () => {
      mockPrismaService.serviceProvider.findUnique.mockResolvedValue(null);

      await expect(service.remove('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getActiveProviders', () => {
    it('should return only active providers with essential info', async () => {
      mockPrismaService.serviceProvider.findMany.mockResolvedValue([mockProvider]);

      const result = await service.getActiveProviders();

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('code');
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).not.toHaveProperty('apiKey');
    });
  });
});
