---
name: team
description: Launch multiple parallel agents in tmux for coordinated execution. Use when high-throughput parallel execution is needed.
---

# team - Team Orchestration Skill

**Type:** Workflow Automation  
**Purpose:** Launch and coordinate multiple parallel agents for high-throughput execution

## Overview

The `team` skill creates a team of specialized agents working in parallel within tmux panes, enabling simultaneous work on different aspects of a task.

## Usage

```
# Launch a team with N workers
team N:role "Task description"

# Examples
user: "Fix all TypeScript errors" "Fix all TypeScript errors in src/"
user: "Review all open PRs" "Review all open PRs"
user: "Write integration tests" "Write integration tests for API endpoints"
```

## Process

When you invoke `team`:

1. **Team Bootstrap**
   - Create new tmux session
   - Spawn N worker panes
   - Initialize each worker with role and task

2. **Task Distribution**
   - Decompose main task into subtasks
   - Assign subtasks to workers
   - Track progress centrally

3. **Parallel Execution**
   - Workers execute independently
   - State synchronized via MCP
   - Progress visible in HUD

4. **Completion & Merge**
   - Collect results from all workers
   - Merge changes
   - Report summary

## Output Structure

Team state is tracked in `.qmx/state/teams/{team-name}.json`:

```json
{
  "name": "team-20240220-exec-3",
  "role": "executor",
  "workerCount": 3,
  "status": "running",
  "phase": "executing",
  "createdAt": "2024-02-20T10:30:00Z",
  "tasks": [
    {
      "id": "task-1",
      "description": "Fix TS error in auth.ts",
      "assignedTo": "worker-1",
      "status": "completed"
    }
  ]
}
```

## Team Lifecycle

```
created → starting → running → (completed | failed | cancelled)
```

### Transitions

- **created → starting**: Initializing tmux session
- **starting → running**: All workers ready
- **running → completed**: All tasks done
- **running → failed**: Critical error
- **running → cancelled**: User cancelled

## Commands

### Terminal Commands

```
# List active teams
qmx team list

# Check team status
qmx team status <team-name>

# Shutdown team
qmx team shutdown <team-name>

# Shutdown all teams
qmx team shutdown --all
```

### In-Session Commands

```
# Launch team
user: "Fix all TypeScript errors" "Task description"

# Check status
team status

# Add workers
team add 2:executor

# Cancel team
team cancel
```

## Worker Roles

Available roles for team members:

- `executor` - Implementation work
- `reviewer` - Code review
- `tester` - Test generation
- `debugger` - Bug fixing
- `refactorer` - Refactoring
- `documenter` - Documentation

## Best Practices

1. **Task Size**: Teams work best with 5-20 parallelizable tasks
2. **Clear Scope**: Define clear boundaries for the team
3. **Monitor Progress**: Use HUD to watch for blockers
4. **Graceful Shutdown**: Always shutdown teams properly

## Limitations

- Requires tmux v3.0+
- Maximum 10 workers per team
- Not suitable for highly sequential tasks
- Windows requires WSL2

## Error Handling

Common errors and solutions:

| Error | Cause | Solution |
|-------|-------|----------|
| `tmux not found` | tmux not installed | Install tmux |
| `version_mismatch` | tmux < 3.0 | Upgrade tmux |
| `workspace_dirty` | Uncommitted changes | Commit or stash |
| `worker_timeout` | Worker stuck | Check worker logs |

## Integration

Works with:
- `plan` - Execute plan phases
- `$hud` - Monitor team progress
- `$hooks` - Trigger events on team lifecycle

## Example Session

```
# Start a team for parallel bug fixes
team 5:debugger "Fix all critical bugs in the backlog"

# Team creates 5 tmux panes, each working on a bug

# Monitor progress
qmx team status team-20240220-debug-5

# View in HUD
qmx hud --watch

# After completion, shutdown
qmx team shutdown team-20240220-debug-5
```
