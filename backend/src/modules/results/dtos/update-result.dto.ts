import { PartialType } from '@nestjs/swagger';
import { CreateResultDto, ResultStatus } from './create-result.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for updating an existing draw result
 *
 * All fields are optional (partial update)
 * Admin/Moderator only operation (T145)
 * Can only update results that haven't been processed yet
 */
export class UpdateResultDto extends PartialType(CreateResultDto) {
  @ApiPropertyOptional({
    description: 'Result status',
    enum: ResultStatus,
    example: ResultStatus.VERIFIED,
  })
  @IsOptional()
  @IsEnum(ResultStatus)
  status?: ResultStatus;
}
