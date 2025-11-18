import { z } from 'zod';

const PROVIDER_CODES = ['M', 'P', 'T', 'S'] as const;
const GAME_TYPES = ['3D', '4D', '5D', '6D'] as const;
const BET_TYPES = ['BIG', 'SMALL', 'IBOX'] as const;

/**
 * Bet placement form validation schema
 */
export const betSchema = z.object({
  providers: z
    .array(z.enum(PROVIDER_CODES))
    .min(1, 'Please select at least one provider')
    .max(4, 'Maximum 4 providers allowed'),

  gameType: z.enum(GAME_TYPES, {
    errorMap: () => ({ message: 'Please select a valid game type' }),
  }),

  betType: z.enum(BET_TYPES, {
    errorMap: () => ({ message: 'Please select a valid bet type' }),
  }),

  numbers: z
    .array(z.string())
    .min(1, 'Please add at least one number')
    .refine(
      (numbers) => {
        // Check for duplicates
        const uniqueNumbers = new Set(numbers);
        return uniqueNumbers.size === numbers.length;
      },
      {
        message: 'Duplicate numbers are not allowed',
      }
    ),

  amountPerProvider: z
    .number()
    .min(1, 'Minimum bet amount is $1')
    .max(10000, 'Maximum bet amount per provider is $10,000')
    .int('Amount must be a whole number'),

  drawDate: z
    .string()
    .min(1, 'Please select a draw date')
    .refine(
      (date) => {
        const selectedDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return selectedDate > today;
      },
      {
        message: 'Draw date must be in the future',
      }
    ),
});

export type BetFormData = z.infer<typeof betSchema>;

/**
 * Single number validation based on game type
 */
export const createNumberValidator = (gameType: '3D' | '4D' | '5D' | '6D') => {
  const length = parseInt(gameType[0]);
  const pattern = new RegExp(`^\\d{${length}}$`);

  return z
    .string()
    .regex(pattern, `Number must be exactly ${length} digits`)
    .refine(
      (num) => {
        // Ensure it's a valid number (no leading zeros unless it's all zeros)
        const numValue = parseInt(num, 10);
        return numValue >= 0 && numValue < Math.pow(10, length);
      },
      {
        message: `Invalid ${gameType} number`,
      }
    );
};

/**
 * Quick bet schema (simplified, single number)
 */
export const quickBetSchema = z.object({
  provider: z.enum(PROVIDER_CODES),
  gameType: z.enum(GAME_TYPES),
  number: z.string().min(3).max(6),
  amount: z.number().min(1).max(1000),
});

export type QuickBetFormData = z.infer<typeof quickBetSchema>;
