# QMX Hook Extension Guide

## Overview

The QMX Hook Extension System allows you to extend QMX functionality with custom plugins that respond to lifecycle events.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    QMX Core                              │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Event Dispatcher                     │   │
│  └──────────────────────────────────────────────────┘   │
│                          │                               │
│          ┌───────────────┼───────────────┐              │
│          ▼               ▼               ▼              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
│  │ session-start│ │turn-complete │ │ session-end  │   │
│  └──────────────┘ └──────────────┘ └──────────────┘   │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Plugin Directory (.qmx/hooks/)              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
│  │  plugin-1.mjs│ │  plugin-2.mjs│ │  plugin-3.mjs│   │
│  └──────────────┘ └──────────────┘ └──────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Available Events

| Event | Trigger | Context |
|-------|---------|---------|
| `session-start` | QMX session launches | Session ID, project info |
| `session-end` | Session terminates | Session summary, duration |
| `session-idle` | Idle timeout reached | Idle duration, last activity |
| `turn-complete` | Agent turn completes | Turn result, agent info |
| `team-created` | New team launched | Team config, worker count |
| `team-completed` | Team finishes work | Results, duration |
| `task-claimed` | Worker claims task | Task ID, worker ID |
| `task-completed` | Worker completes task | Task result |

## Creating a Plugin

### 1. Create Plugin File

Create `.qmx/hooks/my-plugin.mjs`:

```javascript
// .qmx/hooks/my-plugin.mjs

export const events = ['session-start', 'turn-complete'];

export async function sessionStart(sdk) {
  // Called when session starts
  sdk.log.info('Session started!');
  
  // Access state
  await sdk.state.set('sessionStartTime', Date.now());
  
  // Send notification
  await sdk.notify('info', 'QMX session started');
}

export async function turnComplete(sdk) {
  // Called after each agent turn
  const state = await sdk.state.get();
  sdk.log.info(`Turn completed. Active tasks: ${state.activeTasks?.length || 0}`);
}
```

### 2. Plugin Structure

```javascript
export const events = ['event1', 'event2']; // Required: events to handle

export async function eventName(sdk) {
  // Event handler
}

export const metadata = {
  name: 'my-plugin',
  version: '1.0.0',
  description: 'My custom QMX plugin',
};
```

## SDK API

### `sdk.log`

Logging utilities:

```javascript
sdk.log.info('Information message');
sdk.log.warn('Warning message');
sdk.log.error('Error message');
sdk.log.debug('Debug message');
```

### `sdk.state`

State management:

```javascript
// Get entire state
const state = await sdk.state.get();

// Get specific key
const value = await sdk.state.get('key');

// Set value
await sdk.state.set('key', 'value');

// Delete key
await sdk.state.delete('key');

// Watch for changes
await sdk.state.watch('key', (newValue) => {
  console.log('Key changed:', newValue);
});
```

### `sdk.notify`

Send notifications:

```javascript
await sdk.notify('info', 'Message');
await sdk.notify('success', 'Operation completed');
await sdk.notify('warning', 'Something to watch');
await sdk.notify('error', 'Error occurred');
```

### `sdk.tmux`

Tmux operations:

```javascript
// Run command in pane
await sdk.tmux.sendKeys('pane-id', 'ls -la', 'Enter');

// Capture pane content
const content = await sdk.tmux.capture('pane-id');

// Create new pane
const paneId = await sdk.tmux.split('session-name', 'horizontal');
```

### `sdk.fs`

File system operations:

```javascript
// Read file
const content = await sdk.fs.read('path/to/file');

// Write file
await sdk.fs.write('path/to/file', 'content');

// Check exists
const exists = await sdk.fs.exists('path/to/file');

// Watch file
await sdk.fs.watch('path/to/file', (event) => {
  console.log('File changed:', event);
});
```

### `sdk.exec`

Execute shell commands:

```javascript
// Run command
const result = await sdk.exec('git status');

// Run with options
const result = await sdk.exec('npm test', {
  cwd: '/path/to/project',
  timeout: 30000,
});

console.log(result.stdout);
console.log(result.stderr);
console.log(result.exitCode);
```

## Example Plugins

### 1. Auto-Backup Plugin

```javascript
// .qmx/hooks/auto-backup.mjs

export const events = ['session-end'];

export async function sessionEnd(sdk) {
  sdk.log.info('Creating backup before session end...');
  
  try {
    await sdk.exec('git add -A');
    await sdk.exec('git commit -m "QMX auto-backup"');
    await sdk.exec('git push');
    
    sdk.notify('success', 'Backup created successfully');
  } catch (error) {
    sdk.log.error('Backup failed:', error.message);
    sdk.notify('error', 'Backup failed');
  }
}
```

### 2. Time Tracking Plugin

```javascript
// .qmx/hooks/time-tracker.mjs

export const events = ['session-start', 'session-end', 'turn-complete'];

export async function sessionStart(sdk) {
  await sdk.state.set('sessionStartTime', Date.now());
  await sdk.state.set('turnCount', 0);
}

export async function turnComplete(sdk) {
  const count = (await sdk.state.get('turnCount')) || 0;
  await sdk.state.set('turnCount', count + 1);
}

export async function sessionEnd(sdk) {
  const startTime = await sdk.state.get('sessionStartTime');
  const turnCount = await sdk.state.get('turnCount');
  const duration = Date.now() - startTime;
  
  const hours = Math.floor(duration / 3600000);
  const minutes = Math.floor((duration % 3600000) / 60000);
  
  sdk.log.info(`Session summary:`);
  sdk.log.info(`  Duration: ${hours}h ${minutes}m`);
  sdk.log.info(`  Turns: ${turnCount}`);
  
  // Log to file
  await sdk.fs.append('.qmx/logs/sessions.log', 
    `${new Date().toISOString()},${duration},${turnCount}\n`);
}
```

### 3. Discord Notification Plugin

```javascript
// .qmx/hooks/discord-notifier.mjs

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

export const events = ['session-start', 'team-completed'];

export async function sessionStart(sdk) {
  if (!WEBHOOK_URL) return;
  
  await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      embeds: [{
        title: 'QMX Session Started',
        color: 0x00ff00,
        fields: [
          { name: 'Project', value: process.cwd().split('/').pop() },
          { name: 'Time', value: new Date().toLocaleString() },
        ],
      }],
    }),
  });
}

export async function teamCompleted(sdk, { teamName, duration }) {
  if (!WEBHOOK_URL) return;
  
  await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      embeds: [{
        title: 'Team Completed',
        color: 0x0000ff,
        fields: [
          { name: 'Team', value: teamName },
          { name: 'Duration', value: `${duration}ms` },
        ],
      }],
    }),
  });
}
```

### 4. Health Check Plugin

```javascript
// .qmx/hooks/health-check.mjs

export const events = ['session-idle'];

export async function sessionIdle(sdk) {
  sdk.log.info('Running health check...');
  
  const checks = {
    disk: await checkDiskSpace(),
    memory: await checkMemory(),
    teams: await checkActiveTeams(sdk),
  };
  
  const issues = [];
  
  if (checks.disk.free < 1000000000) { // 1GB
    issues.push('Low disk space');
  }
  
  if (checks.memory.used > 0.9) { // 90%
    issues.push('High memory usage');
  }
  
  if (checks.teams.orphaned > 0) {
    issues.push(`${checks.teams.orphaned} orphaned teams`);
  }
  
  if (issues.length > 0) {
    sdk.notify('warning', `Health check issues: ${issues.join(', ')}`);
  } else {
    sdk.log.info('Health check passed');
  }
}

async function checkDiskSpace() {
  // Implementation depends on platform
  return { free: 10000000000 };
}

async function checkMemory() {
  const usage = process.memoryUsage();
  return { used: usage.heapUsed / usage.heapTotal };
}

async function checkActiveTeams(sdk) {
  const teams = await sdk.state.get('activeTeams') || [];
  return { orphaned: teams.length };
}
```

## Plugin Development Tips

### 1. Error Handling

Always wrap async operations in try-catch:

```javascript
export async function sessionStart(sdk) {
  try {
    await riskyOperation();
  } catch (error) {
    sdk.log.error('Plugin error:', error.message);
    // Don't throw - let other plugins run
  }
}
```

### 2. Performance

Keep handlers fast and non-blocking:

```javascript
// Good: Fast, async
export async function turnComplete(sdk) {
  await sdk.state.set('lastTurn', Date.now());
}

// Bad: Slow, blocking
export async function turnComplete(sdk) {
  await slowOperation(); // Takes 5+ seconds
}
```

### 3. Configuration

Support configuration via environment or state:

```javascript
export async function sessionStart(sdk) {
  const config = await sdk.state.get('pluginConfig') || {};
  const enabled = config.myPlugin?.enabled ?? true;
  
  if (!enabled) return;
  
  // Plugin logic...
}
```

## Testing Plugins

Create test file `.qmx/hooks/my-plugin.test.mjs`:

```javascript
import { describe, it, expect } from 'vitest';

describe('my-plugin', () => {
  it('should handle session-start event', async () => {
    const mockSdk = {
      log: { info: () => {} },
      state: { set: () => {} },
      notify: () => {},
    };
    
    const { sessionStart } = await import('./my-plugin.mjs');
    await expect(sessionStart(mockSdk)).resolves.not.toThrow();
  });
});
```

## Plugin Registry

List installed plugins:

```bash
qmx hooks status
```

Example output:

```
Installed Plugins:
  ✓ auto-backup.mjs (events: session-end)
  ✓ time-tracker.mjs (events: session-start, session-end, turn-complete)
  ⚠ discord-notifier.mjs (missing DISCORD_WEBHOOK_URL env)
  ✗ health-check.mjs (error on load)
```

## Best Practices

1. **Single Responsibility**: Each plugin should do one thing well
2. **Fail Gracefully**: Don't crash the entire session
3. **Respect Privacy**: Don't send sensitive data externally
4. **Document**: Include README in plugin file header
5. **Test**: Write tests for your plugins
6. **Version**: Use semantic versioning for plugins

## Security Considerations

- Plugins run with your user permissions
- Be careful with `sdk.exec` and file system access
- Validate external inputs
- Don't commit secrets to plugin files
- Use environment variables for sensitive config

## Troubleshooting

### Plugin not loading

- Check file extension is `.mjs`
- Ensure `events` array is exported
- Check for syntax errors with `node --check`

### Event not firing

- Verify event name matches exactly
- Check plugin is in `.qmx/hooks/`
- Run `qmx hooks validate`

### SDK methods failing

- Ensure async/await is used correctly
- Check permissions for file system operations
- Verify tmux is available for tmux operations

## Advanced: Custom Events

Emit custom events from other plugins:

```javascript
// Emit event
await sdk.events.emit('custom-event', { data: 'value' });

// Listen in another plugin
export const events = ['custom-event'];

export async function customEvent(sdk, payload) {
  console.log('Received:', payload);
}
```

## Resources

- [QMX Architecture](../README.md#architecture)
- [State Management](./state-management.md)
- [Notification System](./notifications.md)
- [Example Plugins](../.qmx/hooks/example.mjs)
