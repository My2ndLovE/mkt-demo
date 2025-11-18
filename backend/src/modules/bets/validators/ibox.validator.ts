import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class IBoxValidator {
  validate(numbers: string): void {
    // iBox requires no repeating digits
    const digits = numbers.split('');
    const uniqueDigits = new Set(digits);

    if (digits.length !== uniqueDigits.size) {
      throw new BadRequestException(
        'iBox bets cannot have repeating digits. Example: "1234" is valid, "1123" is not.'
      );
    }
  }

  calculatePermutations(numbers: string): number {
    const n = numbers.length;
    return this.factorial(n);
  }

  generatePermutations(numbers: string): string[] {
    if (numbers.length === 1) {
      return [numbers];
    }

    const permutations: string[] = [];

    for (let i = 0; i < numbers.length; i++) {
      const char = numbers[i];
      const remaining = numbers.slice(0, i) + numbers.slice(i + 1);
      const subPerms = this.generatePermutations(remaining);

      for (const subPerm of subPerms) {
        permutations.push(char + subPerm);
      }
    }

    return permutations;
  }

  private factorial(n: number): number {
    if (n <= 1) return 1;
    return n * this.factorial(n - 1);
  }
}
