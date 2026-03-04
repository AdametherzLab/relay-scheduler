import * as path from "path";
import * as fs from "fs";
import type { Config, ConfigParser, RelayState, RelaySchedule } from "./types";

const DEFAULT_DATA_DIR = path.join(require("os").homedir(), ".relay-scheduler");

function isRelayState(obj: unknown): obj is RelayState {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "id" in obj &&
    typeof obj.id === "string" &&
    "state" in obj &&
    typeof obj.state === "boolean" &&
    "lastChanged" in obj &&
    obj.lastChanged instanceof Date
  );
}

function isRelaySchedule(obj: unknown): obj is RelaySchedule {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "id" in obj &&
    typeof obj.id === "string" &&
    "name" in obj &&
    typeof obj.name === "string" &&
    "cron" in obj &&
    typeof obj.cron === "string" &&
    "action" in obj &&
    (obj.action === "on" || obj.action === "off") &&
    "enabled" in obj &&
    typeof obj.enabled === "boolean"
  );
}

function isConfig(obj: unknown): obj is Config {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "dataDir" in obj &&
    typeof obj.dataDir === "string" &&
    "relays" in obj &&
    Array.isArray(obj.relays) &&
    obj.relays.every(isRelayState) &&
    "schedules" in obj &&
    Array.isArray(obj.schedules) &&
    obj.schedules.every(isRelaySchedule)
  );
}

function loadJsonFile(filePath: string): unknown {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    throw new Error(`Failed to load or parse config: ${e instanceof Error ? e.message : String(e)}`);
  }
}

export const configParser: ConfigParser = {
  parse(configPath: string): Config {
    const parsed = loadJsonFile(configPath);
    if (!this.validate(parsed)) {
      throw new Error("Invalid config structure");
    }
    return {
      ...parsed,
      dataDir: parsed.dataDir || DEFAULT_DATA_DIR,
    };
  },

  validate(config: unknown): config is Config {
    return isConfig(config);
  },
};