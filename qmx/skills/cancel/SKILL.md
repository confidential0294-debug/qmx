# Cancel Skill

## Overview
**Type:** Workflow  
**Name:** cancel  
**Purpose:** Cancel active executions safely with proper cleanup and state recovery

## Description
The cancel skill provides safe cancellation of running operations with proper cleanup, state recovery, and resource release. It ensures systems return to a consistent state after cancellation.

## Usage

```bash
# Qwen Code slash command
/skill:cancel "task"

# Terminal command
cancel "task"
```

### Parameters
- `target`: Execution to cancel (job, process, task)
- `mode`: Cancellation mode (graceful, immediate, forced)
- `cleanup`: Cleanup actions to perform
- `recovery`: State recovery requirements

## Process

1. **Signal Phase**: Send cancellation signal
2. **Grace Period**: Allow graceful shutdown
3. **Cleanup Phase**: Release resources and clean up
4. **State Recovery**: Restore consistent state
5. **Verification**: Confirm successful cancellation
6. **Report**: Document cancellation details

## Output Structure

```
cancel-output/
├── cancellation-log.json # Cancellation details
├── cleanup-report.md     # Cleanup actions taken
├── state-recovery.md     # Recovery actions
└── verification.json     # Cancellation verification
```

## Integration

- **monitor**: Detect need for cancellation
- **deploy**: Cancel deployments
- **ultrawork**: Cancel parallel tasks
- **autopilot**: Stop autonomous execution

## Best Practices

- Prefer graceful cancellation
- Always clean up resources
- Verify state consistency
- Log cancellation reasons
- Handle partial cancellations

## Related Skills

/skill:monitor, /skill:deploy, /skill:ultrawork, /skill:autopilot, /skill:debug, /skill:verify
