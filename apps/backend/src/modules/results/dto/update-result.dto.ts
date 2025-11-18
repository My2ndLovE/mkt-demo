import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateResultDto } from './create-result.dto';

// Cannot update providerId or drawNumber (unique constraint)
export class UpdateResultDto extends PartialType(
  OmitType(CreateResultDto, ['providerId', 'drawNumber'] as const),
) {}
