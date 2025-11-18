import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

// Omit password from update DTO (use separate endpoint for password change)
export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password', 'username'] as const),
) {}
