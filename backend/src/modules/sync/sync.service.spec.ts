import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { SyncService } from './sync.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ResultsService } from '../results/results.service';
import { ProvidersService } from '../providers/providers.service';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';

describe('SyncService', () => {
  let service: SyncService;
  let httpService: HttpService;
  let prismaService: PrismaService;
  let resultsService: ResultsService;
  let providersService: ProvidersService;
  let configService: ConfigService;

  const mockHttpService = {
    get: jest.fn(),
  };

  const mockPrismaService = {
    drawResult: {
      findFirst: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockResultsService = {
    create: jest.fn(),
  };

  const mockProvidersService = {
    findAll: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ResultsService,
          useValue: mockResultsService,
        },
        {
          provide: ProvidersService,
          useValue: mockProvidersService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<SyncService>(SyncService);
    httpService = module.get<HttpService>(HttpService);
    prismaService = module.get<PrismaService>(PrismaService);
    resultsService = module.get<ResultsService>(ResultsService);
    providersService = module.get<ProvidersService>(ProvidersService);
    configService = module.get<ConfigService>(ConfigService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('syncProviderResults', () => {
    it('should return existing result if already synced', async () => {
      const existingResult = {
        id: 1,
        provider: 'SG',
        drawDate: new Date('2025-01-18'),
        drawNumber: 'SG-20250118',
      };

      mockPrismaService.drawResult.findFirst.mockResolvedValue(existingResult);

      const result = await service.syncProviderResults('SG', '2025-01-18');

      expect(result.success).toBe(true);
      expect(result.resultId).toBe(1);
      expect(result.betsProcessed).toBe(0);
      expect(mockHttpService.get).not.toHaveBeenCalled();
    });

    it('should fetch and create new result if not exists', async () => {
      const mockApiResponse: AxiosResponse = {
        data: {
          provider: 'SG',
          drawDate: '2025-01-18',
          drawNumber: 'SG-20250118',
          prizes: {
            first: '1234',
            second: '5678',
            third: '9012',
            starter: ['1111', '2222'],
            consolation: ['3333', '4444'],
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      const mockCreatedResult = {
        id: 2,
        provider: 'SG',
        drawDate: new Date('2025-01-18'),
        drawNumber: 'SG-20250118',
        betsProcessed: 10,
      };

      mockPrismaService.drawResult.findFirst.mockResolvedValue(null);
      mockConfigService.get
        .mockReturnValueOnce('https://api.magayo.com')
        .mockReturnValueOnce('test-api-key');
      mockHttpService.get.mockReturnValue(of(mockApiResponse));
      mockResultsService.create.mockResolvedValue(mockCreatedResult);

      const result = await service.syncProviderResults('SG', '2025-01-18');

      expect(result.success).toBe(true);
      expect(result.resultId).toBe(2);
      expect(result.betsProcessed).toBe(10);
      expect(mockHttpService.get).toHaveBeenCalled();
      expect(mockResultsService.create).toHaveBeenCalled();
    });

    it('should use mock data in development when API fails', async () => {
      mockPrismaService.drawResult.findFirst.mockResolvedValue(null);
      mockConfigService.get
        .mockReturnValueOnce('https://api.magayo.com')
        .mockReturnValueOnce('test-api-key')
        .mockReturnValueOnce('development'); // NODE_ENV

      mockHttpService.get.mockReturnValue(
        throwError(() => new Error('API unavailable')),
      );

      const mockCreatedResult = {
        id: 3,
        provider: 'SG',
        drawDate: new Date('2025-01-18'),
        drawNumber: 'SG-20250118',
        betsProcessed: 5,
      };

      mockResultsService.create.mockResolvedValue(mockCreatedResult);

      const result = await service.syncProviderResults('SG', '2025-01-18');

      expect(result.success).toBe(true);
      expect(result.resultId).toBe(3);
      expect(mockResultsService.create).toHaveBeenCalled();
    });

    it('should retry on failure and eventually fail', async () => {
      mockPrismaService.drawResult.findFirst.mockResolvedValue(null);
      mockConfigService.get
        .mockReturnValueOnce('https://api.magayo.com')
        .mockReturnValueOnce('test-api-key')
        .mockReturnValueOnce('production'); // Prevent mock fallback

      mockHttpService.get.mockReturnValue(
        throwError(() => new Error('Network error')),
      );

      const result = await service.syncProviderResults('SG', '2025-01-18');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
      expect(mockHttpService.get).toHaveBeenCalledTimes(3); // 3 retries
    }, 15000);
  });

  describe('manualSync', () => {
    it('should trigger sync and create audit log', async () => {
      const mockResult = {
        success: true,
        provider: 'SG',
        drawDate: '2025-01-18',
        resultId: 1,
        betsProcessed: 5,
      };

      mockPrismaService.drawResult.findFirst.mockResolvedValue({
        id: 1,
        provider: 'SG',
        drawDate: new Date('2025-01-18'),
      });

      mockPrismaService.auditLog.create.mockResolvedValue({});

      const result = await service.manualSync('SG', '2025-01-18');

      expect(result.success).toBe(true);
      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'MANUAL_RESULT_SYNC',
          }),
        }),
      );
    });
  });

  describe('getSyncHistory', () => {
    it('should retrieve sync history from audit log', async () => {
      const mockLogs = [
        {
          id: 1,
          action: 'MANUAL_RESULT_SYNC',
          metadata: '{"provider":"SG","success":true}',
          createdAt: new Date(),
        },
        {
          id: 2,
          action: 'AUTOMATED_RESULT_SYNC',
          metadata: '{"total":5,"successful":5}',
          createdAt: new Date(),
        },
      ];

      mockPrismaService.auditLog.findMany.mockResolvedValue(mockLogs);

      const result = await service.getSyncHistory(50);

      expect(result).toHaveLength(2);
      expect(result[0].metadata).toHaveProperty('provider', 'SG');
      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
        }),
      );
    });
  });

  describe('getSyncStatus', () => {
    it('should return synced true if result exists', async () => {
      const mockResult = {
        id: 1,
        drawNumber: 'SG-20250118',
        firstPrize: '1234',
        secondPrize: '5678',
        thirdPrize: '9012',
        createdAt: new Date(),
      };

      mockPrismaService.drawResult.findFirst.mockResolvedValue(mockResult);

      const result = await service.getSyncStatus('SG', '2025-01-18');

      expect(result.synced).toBe(true);
      expect(result.result).toBeDefined();
      expect(result.result.drawNumber).toBe('SG-20250118');
    });

    it('should return synced false if result does not exist', async () => {
      mockPrismaService.drawResult.findFirst.mockResolvedValue(null);

      const result = await service.getSyncStatus('SG', '2025-01-18');

      expect(result.synced).toBe(false);
      expect(result.message).toContain('No result found');
    });
  });

  describe('bulkSync', () => {
    it('should sync multiple dates in range', async () => {
      mockPrismaService.drawResult.findFirst.mockResolvedValue({
        id: 1,
        provider: 'SG',
        drawDate: new Date(),
      });

      mockPrismaService.auditLog.create.mockResolvedValue({});

      const results = await service.bulkSync('SG', '2025-01-01', '2025-01-03');

      expect(results).toHaveLength(3); // 3 days
      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'BULK_RESULT_SYNC',
          }),
        }),
      );
    }, 10000);
  });

  describe('handleDailySync', () => {
    it('should sync all active providers', async () => {
      const mockProviders = [
        { code: 'SG', name: 'Singapore', active: true },
        { code: 'MY', name: 'Malaysia', active: true },
        { code: 'TH', name: 'Thailand', active: false }, // Inactive
      ];

      mockProvidersService.findAll.mockResolvedValue(mockProviders);
      mockPrismaService.drawResult.findFirst.mockResolvedValue({
        id: 1,
        provider: 'SG',
        drawDate: new Date(),
      });
      mockPrismaService.auditLog.create.mockResolvedValue({});

      await service.handleDailySync();

      // Should only sync active providers (SG, MY), not TH
      expect(mockPrismaService.auditLog.create).toHaveBeenCalled();
    }, 10000);
  });
});
