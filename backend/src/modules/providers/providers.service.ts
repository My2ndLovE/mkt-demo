import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateServiceProviderDto, UpdateServiceProviderDto } from './dto/provider.dto';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class ProvidersService {
  private readonly CACHE_KEY = 'providers:all';
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  async findAll(activeOnly = false) {
    const cacheKey = activeOnly ? `${this.CACHE_KEY}:active` : this.CACHE_KEY;

    // Try cache first
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    const providers = await this.prisma.serviceProvider.findMany({
      where: activeOnly ? { active: true } : undefined,
      orderBy: { code: 'asc' },
    });

    const formatted = providers.map((p) => this.formatProvider(p));

    // Cache the result
    await this.cacheManager.set(cacheKey, formatted, this.CACHE_TTL);

    return formatted;
  }

  async findOne(id: string) {
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { id },
    });

    if (!provider) {
      throw new NotFoundException(`Provider with ID ${id} not found`);
    }

    return this.formatProvider(provider);
  }

  async findByCode(code: string) {
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { code },
    });

    if (!provider) {
      throw new NotFoundException(`Provider with code ${code} not found`);
    }

    return this.formatProvider(provider);
  }

  async create(dto: CreateServiceProviderDto) {
    // Validate JSON fields
    this.validateJSON(dto.availableGames, 'availableGames');
    this.validateJSON(dto.betTypes, 'betTypes');
    this.validateJSON(dto.drawSchedule, 'drawSchedule');

    const provider = await this.prisma.serviceProvider.create({
      data: dto,
    });

    // Invalidate cache
    await this.invalidateCache();

    return this.formatProvider(provider);
  }

  async update(id: string, dto: UpdateServiceProviderDto) {
    // Validate JSON fields if provided
    if (dto.availableGames) {
      this.validateJSON(dto.availableGames, 'availableGames');
    }
    if (dto.betTypes) {
      this.validateJSON(dto.betTypes, 'betTypes');
    }
    if (dto.drawSchedule) {
      this.validateJSON(dto.drawSchedule, 'drawSchedule');
    }

    const provider = await this.prisma.serviceProvider.update({
      where: { id },
      data: dto,
    });

    // Invalidate cache
    await this.invalidateCache();

    return this.formatProvider(provider);
  }

  async delete(id: string) {
    await this.prisma.serviceProvider.delete({
      where: { id },
    });

    // Invalidate cache
    await this.invalidateCache();
  }

  private formatProvider(provider: {
    id: string;
    code: string;
    name: string;
    country: string;
    active: boolean;
    availableGames: string;
    betTypes: string;
    drawSchedule: string;
    apiEndpoint: string | null;
    apiKey: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: provider.id,
      code: provider.code,
      name: provider.name,
      country: provider.country,
      active: provider.active,
      availableGames: JSON.parse(provider.availableGames),
      betTypes: JSON.parse(provider.betTypes),
      drawSchedule: JSON.parse(provider.drawSchedule),
      apiEndpoint: provider.apiEndpoint,
      // Don't expose API key in responses
      createdAt: provider.createdAt,
      updatedAt: provider.updatedAt,
    };
  }

  private validateJSON(jsonString: string, fieldName: string) {
    try {
      JSON.parse(jsonString);
    } catch (error) {
      throw new BadRequestException(`Invalid JSON in field: ${fieldName}`);
    }
  }

  private async invalidateCache() {
    await this.cacheManager.del(this.CACHE_KEY);
    await this.cacheManager.del(`${this.CACHE_KEY}:active`);
  }
}
