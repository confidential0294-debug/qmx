# Autopilot Skill

## Overview
**Type:** Workflow  
**Name:** autopilot  
**Purpose:** Autonomous task completion with minimal human intervention

## Description
The autopilot skill handles routine tasks autonomously, making standard decisions based on predefined rules and patterns. It operates with minimal supervision while maintaining safety boundaries.

## Usage

```bash
# Qwen Code slash command
/skill:autopilot "task"

# Terminal command
autopilot "task"
```

### Parameters
- `task`: Task to complete autonomously
- `constraints`: Operational boundaries
- `reporting`: Status report frequency
- `escalation`: Conditions for human intervention

## Process

1. **Task Understanding**: Parse task requirements
2. **Rule Application**: Apply decision rules
3. **Autonomous Execution**: Complete task independently
4. **Status Reporting**: Provide periodic updates
5. **Escalation**: Request help when needed
6. **Completion Report**: Summarize results

## Output Structure

```
autopilot-output/
├── task-log.json       # Action log
├── decisions.md        # Decision rationale
├── status-updates/     # Periodic status reports
└── completion-report.md # Final report
```

## Integration

- **monitor**: Track autonomous progress
- **cancel**: Stop autonomous execution
- **review**: Review autonomous decisions
- **iterate**: Improve decision rules

## Best Practices

- Define clear boundaries
- Set escalation thresholds
- Log all decisions
- Review autonomous actions
- Update rules based on outcomes

## Related Skills

/skill:monitor, /skill:cancel, /skill:review, /skill:iterate, /skill:ultrapilot, /skill:ultrawork
