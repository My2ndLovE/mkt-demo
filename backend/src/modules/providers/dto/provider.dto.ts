import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsJSON, IsOptional } from 'class-validator';

export class CreateServiceProviderDto {
  @ApiProperty({ example: 'M', description: 'Provider code (M, P, T, S)' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'Magnum 4D' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'MY', description: 'Country code (MY, SG)' })
  @IsString()
  country: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  active: boolean;

  @ApiProperty({
    example: '["3D", "4D", "5D", "6D"]',
    description: 'JSON array of available games',
  })
  @IsJSON()
  availableGames: string;

  @ApiProperty({
    example: '["BIG", "SMALL", "IBOX"]',
    description: 'JSON array of bet types',
  })
  @IsJSON()
  betTypes: string;

  @ApiProperty({
    example: '{"days": [0,3,6], "time": "19:00"}',
    description: 'Draw schedule JSON',
  })
  @IsJSON()
  drawSchedule: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  apiEndpoint?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  apiKey?: string;
}

export class UpdateServiceProviderDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsJSON()
  availableGames?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsJSON()
  betTypes?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsJSON()
  drawSchedule?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  apiEndpoint?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  apiKey?: string;
}

export class ServiceProviderResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  country: string;

  @ApiProperty()
  active: boolean;

  @ApiProperty()
  availableGames: string[];

  @ApiProperty()
  betTypes: string[];

  @ApiProperty()
  drawSchedule: Record<string, unknown>;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
