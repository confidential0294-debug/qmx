# QMX Team Reporting and Shutdown

## Worker Reporting to Leader

Workers report to the leader through multiple channels:

### 1. ACK Message (Startup)
When a worker starts, it sends an ACK to `leader-fixed`:
```
.qmx/state/team/<team>/mailbox/leader-fixed.json
```

**Format:**
```json
{
  "worker": "leader-fixed",
  "messages": [
    {
      "message_id": "<uuid>",
      "from_worker": "worker-1",
      "to_worker": "leader-fixed",
      "body": "ACK from worker-1: initialized and ready",
      "created_at": "2026-02-28T00:00:00.000Z"
    }
  ]
}
```

### 2. Worker Status File
Workers update their status file:
```
.qmx/state/team/<team>/workers/<worker>/status.json
```

**Format:**
```json
{
  "worker": "worker-1",
  "state": "idle|working|blocked|shutdown",
  "task": "1",
  "message": "Working on task...",
  "updated_at": "2026-02-28T00:00:00.000Z"
}
```

### 3. Task File Updates
Workers update task files when completing work:
```
.qmx/state/team/<team>/tasks/task-<id>.json
```

**Format:**
```json
{
  "id": "1",
  "subject": "Task subject",
  "description": "Task description",
  "status": "pending|in_progress|completed|failed|blocked",
  "owner": "worker-1",
  "result": "Summary of work done",
  "version": 2
}
```

### 4. Mailbox Messages
Workers can send messages to other workers:
```
.qmx/state/team/<team>/mailbox/<worker>.json
```

## Leader Shutdown Process

The leader shuts down workers in these steps:

### Step 1: Send Shutdown Request
For each worker, write shutdown request:
```
.qmx/state/team/<team>/workers/<worker>/shutdown-request.json
```

**Format:**
```json
{
  "from": "leader-fixed",
  "to": "worker-1",
  "requested_at": "2026-02-28T00:00:00.000Z"
}
```

### Step 2: Send Shutdown Inbox
Write shutdown inbox message:
```
.qmx/state/team/<team>/workers/<worker>/inbox.md
```

**Content:**
```markdown
# Shutdown Request

All tasks are complete. Please acknowledge shutdown.

## Shutdown Protocol
1. Write acknowledgment to shutdown-ack.json
2. Format: {"status":"accept","reason":"ok","updated_at":"<iso>"}
3. Exit your qwen session
```

### Step 3: Wait for ACK
Workers write shutdown acknowledgment:
```
.qmx/state/team/<team>/workers/<worker>/shutdown-ack.json
```

**Format:**
```json
{
  "status": "accept|reject",
  "reason": "ok|still working",
  "updated_at": "2026-02-28T00:00:00.000Z"
}
```

### Step 4: Force Kill Panes
If workers don't exit gracefully:
```bash
tmux kill-pane -t <pane_id>
```

### Step 5: Cleanup State
Remove team state directory:
```bash
rm -rf .qmx/state/team/<team>/
```

## MCP Tools for Reporting

Workers can use these MCP tools:

### team_update_task
```json
{
  "name": "team_update_task",
  "arguments": {
    "team_name": "my-team",
    "task_id": "1",
    "status": "completed",
    "result": "Fixed the bug"
  }
}
```

### team_write_status
```json
{
  "name": "team_write_status",
  "arguments": {
    "team_name": "my-team",
    "worker": "worker-1",
    "state": "idle"
  }
}
```

## Summary Flow

```
Worker Start
    ↓
Send ACK → leader-fixed mailbox
    ↓
Read Inbox → Get tasks
    ↓
Update Status → status.json (state: working)
    ↓
Claim Task → task file (owner: worker-1)
    ↓
Execute Work
    ↓
Update Task → task file (status: completed, result: ...)
    ↓
Update Status → status.json (state: idle)
    ↓
Wait for next task or shutdown

Shutdown Request (from leader)
    ↓
Write Shutdown ACK → shutdown-ack.json
    ↓
Exit qwen session
```
