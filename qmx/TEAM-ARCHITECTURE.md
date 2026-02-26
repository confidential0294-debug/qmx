# QMX Team Architecture - Matches omx team

## What omx team Does

The omx team skill implements tmux-based multi-agent orchestration with:

1. **Real tmux panes** - Each worker is an independent Codex session
2. **Central messaging** - Mailbox system via `.omx/state/team/.../mailbox/`
3. **State coordination** - Shared state files for task tracking
4. **Leader-worker protocol** - Inbox/outbox communication pattern

## QMX Team Implementation

QMX team now matches this architecture exactly:

### 1. tmux Pane Spawning

```bash
# Creates N panes in current tmux window
for i in $(seq 1 $WORKERS); do
    PANE_ID=$(tmux split-window -P -F '#{pane_id}')
    # Launch independent session in each pane
done
```

### 2. Central Messaging (Mailbox)

```
.qmx/state/team/<team-name>/
├── config.json           # Team configuration
├── worker-agents.md      # Worker instructions
├── mailbox/
│   ├── worker-1.json     # Worker 1 → Leader messages
│   ├── worker-2.json     # Worker 2 → Leader messages
│   └── leader-fixed.json # Leader → Workers messages
├── workers/
│   ├── worker-1/
│   │   ├── identity.json
│   │   ├── inbox.md
│   │   └── heartbeat.json
│   └── worker-2/
└── tasks/
    └── task-1.json
```

### 3. Communication Protocol

**Leader → Worker:**
1. Write full assignment to `workers/worker-N/inbox.md`
2. Send short trigger via `tmux send-keys`
3. Worker processes inbox

**Worker → Leader:**
1. Write ACK to `mailbox/worker-N.json`
2. Update heartbeat in `workers/worker-N/heartbeat.json`
3. Leader monitors via state files

### 4. State Files

**config.json:**
```json
{
  "name": "team-1234567890-abc123",
  "role": "executor",
  "workers": 3,
  "task": "Fix TypeScript errors",
  "status": "running",
  "panes": ["%49", "%50", "%51"]
}
```

**Worker identity:**
```json
{
  "id": "worker-1",
  "pane": "%49",
  "role": "executor",
  "team": "team-1234567890-abc123"
}
```

**Heartbeat:**
```json
{
  "worker": "worker-1",
  "lastHeartbeat": "2026-02-20T23:00:00Z",
  "status": "working"
}
```

**Mailbox message:**
```json
{
  "from": "worker-1",
  "type": "ack",
  "message": "Worker 1 started"
}
```

## Usage (Matches omx)

```bash
# Basic team
team 3:executor "Fix TypeScript errors"

# With ralph mode
team ralph 2:planner "Plan the migration"

# Check status
qmx team status <team-name>

# Shutdown
qmx team shutdown <team-name>
```

## Architecture Comparison

| Feature | omx team | QMX team | Status |
|---------|----------|----------|--------|
| tmux panes | ✅ Real sessions | ✅ Real sessions | ✅ Match |
| Central messaging | ✅ Mailbox files | ✅ Mailbox files | ✅ Match |
| State coordination | ✅ Shared files | ✅ Shared files | ✅ Match |
| Worker identity | ✅ identity.json | ✅ identity.json | ✅ Match |
| Heartbeat | ✅ heartbeat.json | ✅ heartbeat.json | ✅ Match |
| Inbox pattern | ✅ inbox.md | ✅ inbox.md | ✅ Match |
| Leader nudge | ✅ display-message | ✅ display-message | ✅ Match |

## Key Files (QMX)

### Team State Directory

```
.qmx/state/team/<team-name>/
```

### Worker Launch Sequence

1. Create team state directory
2. Write config.json
3. Write worker-agents.md (instructions)
4. Split tmux panes
5. For each worker:
   - Create identity.json
   - Create inbox.md with assignment
   - Create heartbeat.json
   - Send commands via tmux send-keys
   - Worker writes ACK to mailbox
6. Update team status to "running"
7. Leader monitors mailbox and heartbeats

## Environment Variables

```bash
# Worker launch customization
export QMX_TEAM_WORKER_LAUNCH_ARGS="--model gpt-4"

# Timeout configuration
export QMX_TEAM_READY_TIMEOUT_MS=45000

# Leader nudge interval
export QMX_TEAM_LEADER_NUDGE_MS=120000
```

## Monitoring

```bash
# Check team status
qmx team status <team-name>

# View mailboxes
cat .qmx/state/team/<team>/mailbox/*.json

# Check heartbeats
cat .qmx/state/team/<team>/workers/*/heartbeat.json

# View worker output
tmux capture-pane -t <pane-id> -p
```

## Cleanup

```bash
# Graceful shutdown
qmx team shutdown <team-name>

# Manual cleanup (if needed)
rm -rf .qmx/state/team/<team-name>
tmux kill-pane -t <pane-id>
```

---

**QMX team now matches omx team architecture exactly!** ✅
