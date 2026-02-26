---
name: ultrawork
description: High-throughput parallel execution. Use for large-scale task execution.
---

# Ultrawork Skill

## Overview
**Type:** Workflow  
**Name:** ultrawork  
**Purpose:** High-throughput parallel execution workflow for maximum productivity

## Description
The ultrawork skill enables high-throughput task execution through intelligent parallelization. It identifies independent tasks, executes them concurrently, and aggregates results efficiently.

## Usage

```
skill: "ultrawork"
```

### Parameters
- `tasks`: List of tasks to execute
- `parallelism`: Maximum concurrent tasks
- `priority`: Task priority ordering
- `timeout`: Per-task timeout

## Process

1. **Task Analysis**: Identify independent tasks
2. **Dependency Graph**: Build task dependency map
3. **Parallel Planning**: Schedule parallel execution
4. **Concurrent Execution**: Run tasks in parallel
5. **Result Aggregation**: Collect and combine results
6. **Error Handling**: Manage failures gracefully

## Output Structure

```
ultrawork-output/
├── execution-log.json  # Detailed execution log
├── results/            # Individual task results
├── summary.md          # Execution summary
├── errors.md           # Error report
└── metrics.json        # Performance metrics
```

## Integration

- **cancel**: Cancel running tasks
- **monitor**: Monitor execution progress
- **benchmark**: Measure throughput improvements
- **iterate**: Retry failed tasks

## Best Practices

- Maximize task independence
- Set appropriate timeouts
- Handle partial failures
- Monitor resource usage
- Balance parallelism overhead

## Related Skills

cancel, monitor, benchmark, iterate, autopilot, ultrapilot
