import { IsNotEmpty, IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProviderDto {
  @ApiProperty({ example: 'Magnum 4D', description: 'Provider name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'M', description: 'Provider code (unique identifier)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  code: string;

  @ApiPropertyOptional({ example: 'your-api-key-here', description: 'API key for result synchronization' })
  @IsString()
  @IsOptional()
  apiKey?: string;

  @ApiPropertyOptional({ example: 'https://api.provider.com/results', description: 'API endpoint URL' })
  @IsString()
  @IsOptional()
  apiEndpoint?: string;

  @ApiPropertyOptional({ example: true, description: 'Whether provider is active', default: true })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
