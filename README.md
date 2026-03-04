# ⏰ relay-scheduler

**Cron-style relay/GPIO scheduler for time-based automation!** Define schedules to turn outputs on/off with precision. Perfect for home automation, IoT projects, or any time-based control system.

## 🚀 Quick Start

```typescript
import { RelayScheduler } from "relay-scheduler";

const scheduler = new RelayScheduler({
  dataDir: "./data",
  relays: {
    "living-room-light": {
      schedule: "0 30 18 * * *" // Every day at 6:30 PM
    }
  }
});

scheduler.start();
```

## 📦 Installation

```bash
bun add relay-scheduler
# or
npm install relay-scheduler
```

## 📖 API

### `RelayScheduler`

The main scheduler class.

```typescript
const scheduler = new RelayScheduler(config: Config);
```

**Methods:**
- `start()` - Start the scheduler
- `stop()` - Stop the scheduler
- `getState(relayId: string): RelayState` - Get current state of a relay
- `setState(relayId: string, state: boolean)` - Manually override relay state

### `Config`

Configuration interface.

```typescript
interface Config {
  dataDir: string; // Directory for persistent data
  relays: Record<string, RelaySchedule>;
}
```

### `RelaySchedule`

Schedule configuration for a relay.

```typescript
interface RelaySchedule {
  schedule: string; // Cron expression
  initialState?: boolean; // Initial state (default: false)
}
```

### `configParser`

Parse configuration files.

```typescript
import { configParser } from "relay-scheduler";

const config = configParser.parseFile("./config.json");
```

## 🧪 Examples

### Daily Schedule

Turn a relay on at 8 AM and off at 6 PM every day:

```typescript
relays: {
  "office-light": {
    schedule: "0 0 8 * * *" // On at 8:00 AM
  },
  "office-light-off": {
    schedule: "0 0 18 * * *" // Off at 6:00 PM
  }
}
```

### Weekly Schedule

Turn a relay on every Monday at 9 AM:

```typescript
relays: {
  "weekly-meeting-light": {
    schedule: "0 0 9 * * 1" // Every Monday at 9:00 AM
  }
}
```

### Interval Schedule

Turn a relay on every 15 minutes:

```typescript
relays: {
  "frequent-check": {
    schedule: "*/15 * * * * *" // Every 15 minutes
  }
}
```

## 🤝 Contributing

We love contributions! Fork the repo, make your changes, and submit a PR. Let's build something awesome together!

## 📄 License

MIT © [Your Name]