import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class BetNumberValidator {
  validate(gameType: string, numbers: string): void {
    const requiredLength = this.getRequiredLength(gameType);

    if (numbers.length !== requiredLength) {
      throw new BadRequestException(
        `Invalid number length for ${gameType}. Expected ${requiredLength} digits, got ${numbers.length}`
      );
    }

    if (!/^\d+$/.test(numbers)) {
      throw new BadRequestException('Numbers must contain only digits (0-9)');
    }
  }

  private getRequiredLength(gameType: string): number {
    switch (gameType) {
      case '3D':
        return 3;
      case '4D':
        return 4;
      case '5D':
        return 5;
      case '6D':
        return 6;
      default:
        throw new BadRequestException(`Invalid game type: ${gameType}`);
    }
  }
}
