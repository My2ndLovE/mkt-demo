export interface ServiceProvider {
  id: string;
  code: string;
  name: string;
  country: string;
  active: boolean;
  availableGames: string[];
  betTypes: string[];
  drawSchedule: {
    days: number[];
    time: string;
  };
  createdAt: string;
  updatedAt: string;
}
