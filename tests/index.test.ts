import { describe, it, expect } from "bun:test";
import { RelayScheduler, configParser } from "../src/index";
import type { Config, RelaySchedule, ScheduleEvaluationResult } from "../src/index";

describe("RelayScheduler", () => {
  const mockConfig: Config = {
    dataDir: "/tmp/relay-scheduler",
    relays: [],
    schedules: [],
  };

  it("should return false for disabled schedules", () => {
    const scheduler = new RelayScheduler(mockConfig);
    const disabledSchedule: RelaySchedule = {
      id: "test-1",
      name: "Disabled Test",
      cron: "* * * * * *",
      action: "on",
      enabled: false,
    };
    const result = scheduler.evaluate(disabledSchedule, new Date());
    expect(result.shouldTrigger).toBeFalse();
    expect(result.nextRun).toBeNull();
  });

  it("should evaluate cron expression correctly for exact minute match", () => {
    const scheduler = new RelayScheduler(mockConfig);
    const schedule: RelaySchedule = {
      id: "test-2",
      name: "Minute Match",
      cron: "0 30 14 * * *",
      action: "on",
      enabled: true,
    };
    const testDate = new Date("2023-01-01T14:30:00Z");
    const result = scheduler.evaluate(schedule, testDate);
    expect(result.shouldTrigger).toBeTrue();
    expect(result.nextRun).toEqual(testDate);
  });

  it("should return null nextRun for invalid cron expressions", () => {
    const scheduler = new RelayScheduler(mockConfig);
    const schedule: RelaySchedule = {
      id: "test-3",
      name: "Invalid Cron",
      cron: "99 * * * * *",
      action: "off",
      enabled: true,
    };
    const testDate = new Date("2023-01-01T12:00:00Z");
    const result = scheduler.evaluate(schedule, testDate);
    expect(result.shouldTrigger).toBeFalse();
    expect(result.nextRun).toBeNull();
  });

  it("should handle wildcard cron expressions", () => {
    const scheduler = new RelayScheduler(mockConfig);
    const schedule: RelaySchedule = {
      id: "test-4",
      name: "Wildcard Test",
      cron: "0 * * * * *",
      action: "on",
      enabled: true,
    };
    const testDate = new Date("2023-01-01T00:00:00Z");
    const result = scheduler.evaluate(schedule, testDate);
    expect(result.shouldTrigger).toBeTrue();
    expect(result.nextRun).toEqual(testDate);
  });

  it("should calculate next run correctly for future time", () => {
    const scheduler = new RelayScheduler(mockConfig);
    const schedule: RelaySchedule = {
      id: "test-5",
      name: "Future Run",
      cron: "0 0 15 * * *",
      action: "off",
      enabled: true,
    };
    const testDate = new Date("2023-01-01T10:00:00Z");
    const result = scheduler.nextRun(schedule, testDate);
    expect(result).not.toBeNull();
    expect(result?.getUTCHours()).toBe(15);
    expect(result?.getUTCMinutes()).toBe(0);
  });
});

describe("configParser", () => {
  it("should validate correct config structure", () => {
    const validConfig = {
      dataDir: "/tmp/test",
      relays: [
        { id: "relay1", state: false, lastChanged: new Date() },
      ],
      schedules: [
        { id: "schedule1", name: "Test", cron: "* * * * * *", action: "on", enabled: true },
      ],
    };
    expect(configParser.validate(validConfig)).toBeTrue();
  });

  it("should reject invalid config structure", () => {
    const invalidConfig = {
      dataDir: "/tmp/test",
      relays: "not-an-array",
      schedules: [],
    };
    expect(configParser.validate(invalidConfig)).toBeFalse();
  });
});