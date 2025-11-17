export const mockBets = [
  {
    id: '20251116001',
    date: '16#11',
    fullDate: '2025年11月16日',
    numbers: ['1234', '5678', '9012'],
    amount: 30,
    gameType: '4D',
    betType: 'M',
    status: 'pending',
    receipt: '#2323'
  },
  {
    id: '20251115001',
    date: '15#11',
    fullDate: '2025年11月15日',
    numbers: ['4567', '8901'],
    amount: 20,
    gameType: '4D',
    betType: 'P',
    status: 'won',
    winAmount: 120,
    receipt: '#2322'
  },
  {
    id: '20251115002',
    date: '15#11',
    fullDate: '2025年11月15日',
    numbers: ['3456'],
    amount: 10,
    gameType: '3D',
    betType: 'T',
    status: 'lost',
    receipt: '#2321'
  },
  {
    id: '20251114001',
    date: '14#11',
    fullDate: '2025年11月14日',
    numbers: ['1111', '2222', '3333', '4444'],
    amount: 40,
    gameType: '4D',
    betType: 'S',
    status: 'won',
    winAmount: 600,
    receipt: '#2320'
  },
  {
    id: '20251113001',
    date: '13#11',
    fullDate: '2025年11月13日',
    numbers: ['7890', '6543'],
    amount: 20,
    gameType: '4D',
    betType: 'M',
    status: 'lost',
    receipt: '#2319'
  },
];

export const mockPendingBets = mockBets.filter(bet => bet.status === 'pending');

export const mockBetHistory = [
  {
    period: 'D7',
    description: '按D7=今期和7期的單',
    bets: 23,
    totalAmount: 450,
    winAmount: 120,
    profit: -330
  },
  {
    period: 'L2',
    description: '1234=字的號碼',
    bets: 45,
    totalAmount: 890,
    winAmount: 1200,
    profit: 310
  },
];

export const mockUserProfile = {
  name: 'Kgor',
  agentId: 'A2025',
  weeklyLimit: 5000,
  usedAmount: 2350,
  remainingAmount: 2650,
  uplineAgent: 'Agent A1',
  commissionRate: 30,
  currency: 'MYR'
};
