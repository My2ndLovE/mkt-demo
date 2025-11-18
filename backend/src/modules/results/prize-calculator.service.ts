import { Injectable } from '@nestjs/common';

interface PrizeStructure {
  category: string;
  amount: number;
}

@Injectable()
export class PrizeCalculator {
  private readonly BIG_PRIZES: PrizeStructure[] = [
    { category: '1ST', amount: 2500 },
    { category: '2ND', amount: 1000 },
    { category: '3RD', amount: 500 },
    { category: 'STARTER', amount: 180 },
    { category: 'CONSOLATION', amount: 60 },
  ];

  private readonly SMALL_PRIZES: PrizeStructure[] = [
    { category: '1ST', amount: 3500 },
    { category: '2ND', amount: 2000 },
    { category: '3RD', amount: 1000 },
  ];

  calculateWinAmount(
    betNumbers: string,
    betType: string,
    result: {
      firstPrize: string;
      secondPrize: string;
      thirdPrize: string;
      starters: string[];
      consolations: string[];
    },
    betAmount: number
  ): { prizeCategory: string; winAmount: number } | null {
    // Check for exact matches
    if (betNumbers === result.firstPrize) {
      const amount = betType === 'BIG' ? this.BIG_PRIZES[0].amount : this.SMALL_PRIZES[0].amount;
      return { prizeCategory: '1ST', winAmount: amount * betAmount };
    }

    if (betNumbers === result.secondPrize) {
      const amount = betType === 'BIG' ? this.BIG_PRIZES[1].amount : this.SMALL_PRIZES[1].amount;
      return { prizeCategory: '2ND', winAmount: amount * betAmount };
    }

    if (betNumbers === result.thirdPrize) {
      const amount = betType === 'BIG' ? this.BIG_PRIZES[2].amount : this.SMALL_PRIZES[2].amount;
      return { prizeCategory: '3RD', winAmount: amount * betAmount };
    }

    // BIG type can win starter and consolation
    if (betType === 'BIG') {
      if (result.starters.includes(betNumbers)) {
        return {
          prizeCategory: 'STARTER',
          winAmount: this.BIG_PRIZES[3].amount * betAmount,
        };
      }

      if (result.consolations.includes(betNumbers)) {
        return {
          prizeCategory: 'CONSOLATION',
          winAmount: this.BIG_PRIZES[4].amount * betAmount,
        };
      }
    }

    return null;
  }

  calculateIBoxWin(
    betNumbers: string,
    result: {
      firstPrize: string;
      secondPrize: string;
      thirdPrize: string;
      starters: string[];
      consolations: string[];
    },
    permutations: string[],
    betAmount: number
  ): { prizeCategory: string; winAmount: number } | null {
    // iBox checks all permutations
    for (const perm of permutations) {
      if (perm === result.firstPrize) {
        return { prizeCategory: '1ST-IBOX', winAmount: 2500 * betAmount };
      }
      if (perm === result.secondPrize) {
        return { prizeCategory: '2ND-IBOX', winAmount: 1000 * betAmount };
      }
      if (perm === result.thirdPrize) {
        return { prizeCategory: '3RD-IBOX', winAmount: 500 * betAmount };
      }
      if (result.starters.includes(perm)) {
        return { prizeCategory: 'STARTER-IBOX', winAmount: 180 * betAmount };
      }
      if (result.consolations.includes(perm)) {
        return { prizeCategory: 'CONSOLATION-IBOX', winAmount: 60 * betAmount };
      }
    }

    return null;
  }
}
