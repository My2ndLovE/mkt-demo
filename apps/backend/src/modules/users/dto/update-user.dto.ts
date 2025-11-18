import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

// Omit password, username, and role from update DTO
// Password: Use separate endpoint for password change
// Username: Immutable after creation
// Role: Prevent privilege escalation (only admin can change roles via separate endpoint)
export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password', 'username', 'role'] as const),
) {}
