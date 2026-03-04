import type { CronExpression } from './cron';

export interface RelayState {
  readonly id: string;
  readonly state: boolean;
  readonly lastChanged: Date;
}

export interface RelaySchedule {
  readonly id: string;
  readonly name: string;
  readonly cron: CronExpression;
  readonly action: 'on' | 'off';
  readonly enabled: boolean;
}

export interface Config {
  readonly dataDir: string;
  readonly relays: RelayState[];
  readonly schedules: RelaySchedule[];
}

export interface ScheduleEvaluationResult {
  readonly shouldTrigger: boolean;
  readonly nextRun: Date | null;
}

export type ScheduleParser = (expression: string) => CronExpression;
export type ScheduleEvaluator = (expression: CronExpression, date: Date) => boolean;
export type NextRunCalculator = (expression: CronExpression, fromDate: Date) => Date | null;

export interface Scheduler {
  evaluate(schedule: RelaySchedule, date: Date): ScheduleEvaluationResult;
  nextRun(schedule: RelaySchedule, fromDate: Date): Date | null;
}

export interface ConfigParser {
  parse(configPath: string): Config;
  validate(config: unknown): config is Config;
}

export type CronExpression = string;