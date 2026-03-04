import * as path from "path";
import * as fs from "fs";
import type { Config, RelaySchedule, ScheduleEvaluationResult, Scheduler, CronExpression } from "./types";

export class RelayScheduler implements Scheduler {
  private readonly config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  evaluate(schedule: RelaySchedule, date: Date): ScheduleEvaluationResult {
    if (!schedule.enabled) {
      return { shouldTrigger: false, nextRun: null };
    }

    if (!this.isValidCron(schedule.cron)) {
      return { shouldTrigger: false, nextRun: null };
    }

    const shouldTrigger = this.evaluateCron(schedule.cron, date);
    const nextRun = shouldTrigger ? date : this.nextRun(schedule, date);

    return { shouldTrigger, nextRun };
  }

  nextRun(schedule: RelaySchedule, fromDate: Date): Date | null {
    if (!schedule.enabled) return null;
    return this.calculateNextRun(schedule.cron, fromDate);
  }

  private isValidCron(expression: string): boolean {
    const parts = expression.split(/\s+/);
    if (parts.length !== 5) return false;
    const ranges = [[0,59],[0,23],[1,31],[1,12],[0,6]];
    for (let i = 0; i < 5; i++) {
      const field = parts[i];
      if (field === "*") continue;
      const nums = field.replace(/[\/*,-]/g, " ").trim().split(/\s+/).map(Number);
      for (const n of nums) {
        if (isNaN(n) || n < ranges[i][0] || n > ranges[i][1]) return false;
      }
    }
    return true;
  }

  private evaluateCron(expression: CronExpression, date: Date): boolean {
    const parts = expression.split(/\s+/);
    if (parts.length !== 5) return false;

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
    const current = {
      minute: date.getMinutes(),
      hour: date.getHours(),
      day: date.getDate(),
      month: date.getMonth() + 1,
      dayWeek: date.getDay()
    };

    return this.matchField(minute, current.minute, 0, 59) &&
           this.matchField(hour, current.hour, 0, 23) &&
           this.matchField(dayOfMonth, current.day, 1, 31) &&
           this.matchField(month, current.month, 1, 12) &&
           this.matchField(dayOfWeek, current.dayWeek, 0, 6);
  }

  private matchField(field: string, value: number, min: number, max: number): boolean {
    if (field === "*") return true;

    if (field.includes(",")) {
      return field.split(",").some(part => this.matchField(part.trim(), value, min, max));
    }

    if (field.includes("-")) {
      const [start, end] = field.split("-").map(Number);
      return value >= start && value <= end;
    }

    if (field.includes("/")) {
      const [base, step] = field.split("/");
      const baseNum = base === "*" ? min : Number(base);
      const stepNum = Number(step);
      return (value - baseNum) % stepNum === 0;
    }

    return Number(field) === value;
  }

  private calculateNextRun(expression: CronExpression, fromDate: Date): Date | null {
    const parts = expression.split(/\s+/);
    if (parts.length !== 5) return null;

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
    let current = new Date(fromDate);
    current.setSeconds(0, 0);

    for (let i = 0; i < 1000; i++) { // Fail-safe against infinite loops
      const next = this.findNextCandidate(current, minute, hour, dayOfMonth, month, dayOfWeek);
      if (next === null) return null;
      if (next.getTime() > current.getTime()) return next;
      current = new Date(current.getTime() + 60000);
    }

    return null;
  }

  private findNextCandidate(base: Date, minute: string, hour: string, dayOfMonth: string, month: string, dayOfWeek: string): Date | null {
    const candidates: Date[] = [];
    
    // Year iteration
    for (let y = base.getFullYear(); y <= base.getFullYear() + 1; y++) {
      // Month iteration
      const months = this.expandField(month, 1, 12, y, base.getMonth() + 1);
      for (const m of months) {
        // Day iteration
        const days = this.expandField(dayOfMonth, 1, new Date(y, m, 0).getDate(), m, base.getDate());
        const weekDays = this.expandField(dayOfWeek, 0, 6, m, base.getDay());
        const validDays = Array.from(new Set([...days, ...weekDays.map(d => this.dayOfWeekToDayOfMonth(y, m, d))]));
        
        for (const d of validDays.sort((a,b) => a - b)) {
          // Hour iteration
          const hours = this.expandField(hour, 0, 23, m, base.getHours());
          for (const h of hours) {
            // Minute iteration
            const minutes = this.expandField(minute, 0, 59, h, base.getMinutes());
            for (const min of minutes) {
              const candidate = new Date(y, m - 1, d, h, min);
              if (candidate.getTime() > base.getTime() && candidate.getMonth() + 1 === m) {
                candidates.push(candidate);
              }
            }
          }
        }
      }
    }

    return candidates.sort((a,b) => a.getTime() - b.getTime())[0] || null;
  }

  private expandField(field: string, min: number, max: number, context: number, current: number): number[] {
    if (field === "*") return Array.from({length: max - min + 1}, (_,i) => i + min);
    
    if (field.includes(",")) {
      return field.split(",").map(x => Number(x.trim()));
    }

    if (field.includes("-")) {
      const [start, end] = field.split("-").map(Number);
      return Array.from({length: end - start + 1}, (_,i) => i + start);
    }

    if (field.includes("/")) {
      const [base, step] = field.split("/");
      const baseNum = base === "*" ? min : Number(base);
      const results = [];
      for (let i = baseNum; i <= max; i += Number(step)) {
        results.push(i);
      }
      return results;
    }

    return [Number(field)];
  }

  private dayOfWeekToDayOfMonth(year: number, month: number, dayOfWeek: number): number {
    const date = new Date(year, month - 1, 1);
    while (date.getDay() !== dayOfWeek && date.getMonth() === month - 1) {
      date.setDate(date.getDate() + 1);
    }
    return date.getDate();
  }
}