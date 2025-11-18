import { IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for transferring an agent to a new upline
 *
 * Admin-only operation to reorganize the agent hierarchy.
 * Used when moving an agent and their entire subtree to a different upline.
 *
 * Business Rules:
 * - Only ADMIN can perform this operation
 * - Target agent must be an AGENT (not ADMIN/MODERATOR)
 * - New upline must exist and be an AGENT
 * - Cannot create circular hierarchy (agent cannot be moved under their own descendant)
 * - ModeratorId is inherited from the new upline
 * - All descendants remain under the transferred agent
 */
export class TransferUplineDto {
  @ApiProperty({
    description: 'ID of the new upline/parent agent',
    example: 8,
  })
  @IsNumber()
  @IsNotEmpty()
  newUplineId: number;
}
