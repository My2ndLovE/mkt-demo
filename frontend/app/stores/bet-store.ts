import { create } from 'zustand';
import type { GameType, BetType, ProviderCode } from '../types';

interface BetFormState {
  // Bet form fields
  providers: ProviderCode[];
  gameType: GameType;
  betType: BetType;
  numbers: string[];
  amountPerProvider: number;
  drawDate: string;

  // UI state
  isSubmitting: boolean;
  lastReceipt: string | null;

  // Actions
  setProviders: (providers: ProviderCode[]) => void;
  toggleProvider: (provider: ProviderCode) => void;
  setGameType: (gameType: GameType) => void;
  setBetType: (betType: BetType) => void;
  setNumbers: (numbers: string[]) => void;
  addNumber: (number: string) => void;
  removeNumber: (index: number) => void;
  setAmountPerProvider: (amount: number) => void;
  setDrawDate: (date: string) => void;
  setIsSubmitting: (isSubmitting: boolean) => void;
  setLastReceipt: (receiptNumber: string | null) => void;
  resetForm: () => void;
  getTotalAmount: () => number;
}

const getDefaultDrawDate = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
};

const initialState = {
  providers: [] as ProviderCode[],
  gameType: '4D' as GameType,
  betType: 'BIG' as BetType,
  numbers: [] as string[],
  amountPerProvider: 1,
  drawDate: getDefaultDrawDate(),
  isSubmitting: false,
  lastReceipt: null,
};

export const useBetStore = create<BetFormState>((set, get) => ({
  ...initialState,

  setProviders: (providers) => set({ providers }),

  toggleProvider: (provider) =>
    set((state) => ({
      providers: state.providers.includes(provider)
        ? state.providers.filter((p) => p !== provider)
        : [...state.providers, provider],
    })),

  setGameType: (gameType) => set({ gameType }),

  setBetType: (betType) => set({ betType }),

  setNumbers: (numbers) => set({ numbers }),

  addNumber: (number) =>
    set((state) => ({
      numbers: [...state.numbers, number],
    })),

  removeNumber: (index) =>
    set((state) => ({
      numbers: state.numbers.filter((_, i) => i !== index),
    })),

  setAmountPerProvider: (amount) => set({ amountPerProvider: amount }),

  setDrawDate: (date) => set({ drawDate: date }),

  setIsSubmitting: (isSubmitting) => set({ isSubmitting }),

  setLastReceipt: (receiptNumber) => set({ lastReceipt: receiptNumber }),

  resetForm: () => set({ ...initialState, drawDate: getDefaultDrawDate() }),

  getTotalAmount: () => {
    const { providers, amountPerProvider } = get();
    return providers.length * amountPerProvider;
  },
}));
