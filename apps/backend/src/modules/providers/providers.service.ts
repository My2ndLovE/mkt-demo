import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionService } from '../../common/services/encryption.service';
import { AuditService } from '../../common/services/audit.service';
import { CreateProviderDto } from './dto/create-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';

@Injectable()
export class ProvidersService {
  private readonly logger = new Logger(ProvidersService.name);

  constructor(
    private prisma: PrismaService,
    private encryption: EncryptionService,
    private auditService: AuditService,
  ) {}

  /**
   * Create a new service provider (ADMIN only)
   */
  async create(userId: number, dto: CreateProviderDto) {
    this.logger.log(`Creating new provider: ${dto.name}`);

    // Check if code already exists
    const existing = await this.prisma.serviceProvider.findUnique({
      where: { code: dto.code },
    });

    if (existing) {
      throw new BadRequestException(`Provider with code "${dto.code}" already exists`);
    }

    // Encrypt API key if provided
    const encryptedApiKey = dto.apiKey ? this.encryption.encrypt(dto.apiKey) : null;

    // Create provider
    const provider = await this.prisma.serviceProvider.create({
      data: {
        name: dto.name,
        code: dto.code,
        apiKey: encryptedApiKey,
        apiEndpoint: dto.apiEndpoint || null,
        active: dto.active ?? true,
      },
    });

    // Audit log
    await this.auditService.logProviderChange(userId, provider.id, 'CREATED', {
      name: provider.name,
      code: provider.code,
    });

    this.logger.log(`✅ Provider ${provider.id} created successfully`);

    // Don't return encrypted API key
    return {
      ...provider,
      apiKey: provider.apiKey ? '[ENCRYPTED]' : null,
    };
  }

  /**
   * Get all providers (paginated)
   */
  async findAll(includeInactive: boolean = false) {
    const providers = await this.prisma.serviceProvider.findMany({
      where: includeInactive ? {} : { active: true },
      orderBy: {
        name: 'asc',
      },
    });

    // Don't return encrypted API keys
    return providers.map((p) => ({
      ...p,
      apiKey: p.apiKey ? '[ENCRYPTED]' : null,
    }));
  }

  /**
   * Get provider by ID
   */
  async findOne(id: number) {
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { id },
    });

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    // Don't return encrypted API key
    return {
      ...provider,
      apiKey: provider.apiKey ? '[ENCRYPTED]' : null,
    };
  }

  /**
   * Update provider (ADMIN only)
   */
  async update(userId: number, id: number, dto: UpdateProviderDto) {
    this.logger.log(`Updating provider ${id}`);

    // Check if provider exists
    const existing = await this.prisma.serviceProvider.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Provider not found');
    }

    // If updating code, check uniqueness
    if (dto.code && dto.code !== existing.code) {
      const codeExists = await this.prisma.serviceProvider.findUnique({
        where: { code: dto.code },
      });

      if (codeExists) {
        throw new BadRequestException(`Provider with code "${dto.code}" already exists`);
      }
    }

    // Encrypt new API key if provided
    const encryptedApiKey = dto.apiKey ? this.encryption.encrypt(dto.apiKey) : undefined;

    // Update provider
    const provider = await this.prisma.serviceProvider.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.code && { code: dto.code }),
        ...(encryptedApiKey && { apiKey: encryptedApiKey }),
        ...(dto.apiEndpoint !== undefined && { apiEndpoint: dto.apiEndpoint }),
        ...(dto.active !== undefined && { active: dto.active }),
      },
    });

    // Audit log
    await this.auditService.logProviderChange(userId, provider.id, 'UPDATED', {
      changes: dto,
    });

    this.logger.log(`✅ Provider ${id} updated successfully`);

    // Don't return encrypted API key
    return {
      ...provider,
      apiKey: provider.apiKey ? '[ENCRYPTED]' : null,
    };
  }

  /**
   * Delete provider (soft delete - set to inactive)
   * ADMIN only
   */
  async remove(userId: number, id: number) {
    this.logger.log(`Deleting provider ${id}`);

    // Check if provider exists
    const existing = await this.prisma.serviceProvider.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Provider not found');
    }

    // Check if there are active bets using this provider
    const activeBets = await this.prisma.bet.count({
      where: {
        providerId: id,
        status: 'PENDING',
      },
    });

    if (activeBets > 0) {
      throw new BadRequestException(
        `Cannot delete provider with ${activeBets} active bets. Deactivate instead.`,
      );
    }

    // Soft delete (set to inactive)
    const provider = await this.prisma.serviceProvider.update({
      where: { id },
      data: {
        active: false,
      },
    });

    // Audit log
    await this.auditService.logProviderChange(userId, provider.id, 'DELETED', {
      name: provider.name,
    });

    this.logger.log(`✅ Provider ${id} deleted (deactivated) successfully`);

    return {
      message: 'Provider deactivated successfully',
    };
  }

  /**
   * Get decrypted API key for internal use (e.g., result sync)
   * INTERNAL USE ONLY - DO NOT EXPOSE VIA API
   */
  async getDecryptedApiKey(id: number): Promise<string | null> {
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { id },
      select: { apiKey: true },
    });

    if (!provider?.apiKey) {
      return null;
    }

    return this.encryption.decrypt(provider.apiKey);
  }
}
