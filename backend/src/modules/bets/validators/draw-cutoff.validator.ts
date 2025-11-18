import { Injectable, BadRequestException } from '@nestjs/common';

interface DrawSchedule {
  days: number[]; // 0 = Sunday, 1 = Monday, etc.
  time: string; // HH:mm format
}

@Injectable()
export class DrawCutoffValidator {
  validate(drawDate: Date, drawSchedule: string): void {
    const schedule: DrawSchedule = JSON.parse(drawSchedule);
    const now = new Date();

    // Set draw cutoff time
    const cutoffTime = new Date(drawDate);
    const [hours, minutes] = schedule.time.split(':').map(Number);
    cutoffTime.setHours(hours, minutes, 0, 0);

    if (now >= cutoffTime) {
      throw new BadRequestException(
        `Draw closed. Cutoff time was ${schedule.time}. Next draw available after results.`
      );
    }
  }

  getNextDrawDate(drawSchedule: string): Date {
    const schedule: DrawSchedule = JSON.parse(drawSchedule);
    const now = new Date();
    const currentDay = now.getDay();

    // Find next draw day
    let daysToAdd = 0;
    for (let i = 1; i <= 7; i++) {
      const testDay = (currentDay + i) % 7;
      if (schedule.days.includes(testDay)) {
        daysToAdd = i;
        break;
      }
    }

    const nextDraw = new Date(now);
    nextDraw.setDate(now.getDate() + daysToAdd);

    const [hours, minutes] = schedule.time.split(':').map(Number);
    nextDraw.setHours(hours, minutes, 0, 0);

    return nextDraw;
  }
}
