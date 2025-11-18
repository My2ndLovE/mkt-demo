import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionService } from '../encryption/encryption.service';
import { CreateProviderDto, UpdateProviderDto, QueryProviderDto } from './dtos';

/**
 * Providers Service
 *
 * Handles service provider CRUD operations (T090-T096)
 * Manages lottery operators (Magnum, Sports Toto, Damacai, Singapore Pools)
 *
 * Business Rules:
 * 1. Provider code must be unique
 * 2. API keys are encrypted at rest using EncryptionService (T237)
 * 3. Soft delete (active=false)
 * 4. Draw schedule, availableGames, and betTypes stored as JSON
 * 5. Only active providers shown to public endpoints
 *
 * Security:
 * - Create/Update/Delete: Admin only
 * - List active providers: Public (for bet placement)
 * - Get provider details: Authenticated users
 */
@Injectable()
export class ProvidersService {
  private readonly logger = new Logger(ProvidersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService,
  ) {}

  /**
   * Create a new service provider (T090)
   *
   * @param createProviderDto - Provider creation data
   * @returns Created provider (with decrypted apiKey for confirmation)
   * @throws ConflictException if provider code already exists
   */
  async create(createProviderDto: CreateProviderDto) {
    // Check if provider code already exists
    const existingProvider = await this.prisma.serviceProvider.findUnique({
      where: { code: createProviderDto.code },
    });

    if (existingProvider) {
      throw new ConflictException(`Provider with code '${createProviderDto.code}' already exists`);
    }

    // Encrypt API key if provided (T237)
    let encryptedApiKey: string | undefined;
    if (createProviderDto.apiKey) {
      encryptedApiKey = await this.encryptionService.encrypt(createProviderDto.apiKey);
      this.logger.log(`API key encrypted for provider: ${createProviderDto.code}`);
    }

    // Create provider
    const provider = await this.prisma.serviceProvider.create({
      data: {
        code: createProviderDto.code,
        name: createProviderDto.name,
        country: createProviderDto.country,
        availableGames: JSON.stringify(createProviderDto.availableGames),
        betTypes: JSON.stringify(createProviderDto.betTypes),
        drawSchedule: JSON.stringify(createProviderDto.drawSchedule),
        apiEndpoint: createProviderDto.apiEndpoint,
        apiKey: encryptedApiKey,
        active: true,
      },
    });

    this.logger.log(`Provider created: ${provider.code} - ${provider.name}`);

    return this.transformProvider(provider, false); // Don't decrypt for response
  }

  /**
   * Get all service providers with optional filtering (T091)
   *
   * @param query - Query parameters for filtering
   * @param includeApiKey - Whether to include decrypted API key (admin only)
   * @returns List of providers
   */
  async findAll(query: QueryProviderDto, includeApiKey = false) {
    const where: any = {};

    // Filter by active status
    if (query.active !== undefined) {
      where.active = query.active;
    }

    // Filter by country
    if (query.country) {
      where.country = query.country;
    }

    // Search by name or code
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const providers = await this.prisma.serviceProvider.findMany({
      where,
      orderBy: [{ country: 'asc' }, { name: 'asc' }],
    });

    return Promise.all(
      providers.map((provider) => this.transformProvider(provider, includeApiKey)),
    );
  }

  /**
   * Get a single service provider by ID (T092)
   *
   * @param id - Provider ID
   * @param includeApiKey - Whether to include decrypted API key (admin only)
   * @returns Provider details
   * @throws NotFoundException if provider not found
   */
  async findOne(id: string, includeApiKey = false) {
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { id },
    });

    if (!provider) {
      throw new NotFoundException(`Provider with ID '${id}' not found`);
    }

    return this.transformProvider(provider, includeApiKey);
  }

  /**
   * Get a service provider by code
   *
   * @param code - Provider code (e.g., M, P, T, S)
   * @param includeApiKey - Whether to include decrypted API key (admin only)
   * @returns Provider details
   * @throws NotFoundException if provider not found
   */
  async findByCode(code: string, includeApiKey = false) {
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { code },
    });

    if (!provider) {
      throw new NotFoundException(`Provider with code '${code}' not found`);
    }

    return this.transformProvider(provider, includeApiKey);
  }

  /**
   * Update a service provider (T093)
   *
   * @param id - Provider ID
   * @param updateProviderDto - Provider update data
   * @returns Updated provider
   * @throws NotFoundException if provider not found
   */
  async update(id: string, updateProviderDto: UpdateProviderDto) {
    // Check if provider exists
    const existingProvider = await this.prisma.serviceProvider.findUnique({
      where: { id },
    });

    if (!existingProvider) {
      throw new NotFoundException(`Provider with ID '${id}' not found`);
    }

    // Check if code is being changed and new code already exists
    if (updateProviderDto.code && updateProviderDto.code !== existingProvider.code) {
      const codeExists = await this.prisma.serviceProvider.findUnique({
        where: { code: updateProviderDto.code },
      });

      if (codeExists) {
        throw new ConflictException(
          `Provider with code '${updateProviderDto.code}' already exists`,
        );
      }
    }

    // Encrypt API key if provided (T237)
    let encryptedApiKey: string | undefined;
    if (updateProviderDto.apiKey) {
      encryptedApiKey = await this.encryptionService.encrypt(updateProviderDto.apiKey);
      this.logger.log(`API key re-encrypted for provider: ${existingProvider.code}`);
    }

    // Build update data
    const updateData: any = {};

    if (updateProviderDto.code) updateData.code = updateProviderDto.code;
    if (updateProviderDto.name) updateData.name = updateProviderDto.name;
    if (updateProviderDto.country) updateData.country = updateProviderDto.country;
    if (updateProviderDto.availableGames) {
      updateData.availableGames = JSON.stringify(updateProviderDto.availableGames);
    }
    if (updateProviderDto.betTypes) {
      updateData.betTypes = JSON.stringify(updateProviderDto.betTypes);
    }
    if (updateProviderDto.drawSchedule) {
      updateData.drawSchedule = JSON.stringify(updateProviderDto.drawSchedule);
    }
    if (updateProviderDto.apiEndpoint !== undefined) {
      updateData.apiEndpoint = updateProviderDto.apiEndpoint;
    }
    if (encryptedApiKey) {
      updateData.apiKey = encryptedApiKey;
    }
    if (updateProviderDto.active !== undefined) {
      updateData.active = updateProviderDto.active;
    }

    // Update provider
    const provider = await this.prisma.serviceProvider.update({
      where: { id },
      data: updateData,
    });

    this.logger.log(`Provider updated: ${provider.code} - ${provider.name}`);

    return this.transformProvider(provider, false);
  }

  /**
   * Soft delete a service provider (T094)
   *
   * Sets active=false instead of deleting from database
   *
   * @param id - Provider ID
   * @returns Deleted provider
   * @throws NotFoundException if provider not found
   */
  async remove(id: string) {
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { id },
    });

    if (!provider) {
      throw new NotFoundException(`Provider with ID '${id}' not found`);
    }

    // Soft delete
    const deletedProvider = await this.prisma.serviceProvider.update({
      where: { id },
      data: { active: false },
    });

    this.logger.log(`Provider soft deleted: ${deletedProvider.code} - ${deletedProvider.name}`);

    return this.transformProvider(deletedProvider, false);
  }

  /**
   * Transform provider data from database format to API format
   *
   * @param provider - Provider from database
   * @param includeApiKey - Whether to decrypt and include API key
   * @returns Transformed provider object
   * @private
   */
  private async transformProvider(provider: any, includeApiKey: boolean) {
    const transformed: any = {
      id: provider.id,
      code: provider.code,
      name: provider.name,
      country: provider.country,
      active: provider.active,
      availableGames: JSON.parse(provider.availableGames),
      betTypes: JSON.parse(provider.betTypes),
      drawSchedule: JSON.parse(provider.drawSchedule),
      apiEndpoint: provider.apiEndpoint,
      createdAt: provider.createdAt,
      updatedAt: provider.updatedAt,
    };

    // Decrypt API key if requested and available
    if (includeApiKey && provider.apiKey) {
      try {
        transformed.apiKey = await this.encryptionService.decrypt(provider.apiKey);
      } catch (error) {
        this.logger.error(
          `Failed to decrypt API key for provider ${provider.code}`,
          error instanceof Error ? error.stack : String(error),
        );
        transformed.apiKey = null; // Don't expose encrypted value
      }
    }

    return transformed;
  }

  /**
   * Get active providers suitable for bet placement
   *
   * Public endpoint - returns only essential information
   *
   * @returns List of active providers
   */
  async getActiveProviders() {
    const providers = await this.findAll({ active: true }, false);

    // Return only essential information for public use
    return providers.map((provider) => ({
      id: provider.id,
      code: provider.code,
      name: provider.name,
      country: provider.country,
      availableGames: provider.availableGames,
      betTypes: provider.betTypes,
      drawSchedule: provider.drawSchedule,
    }));
  }
}
