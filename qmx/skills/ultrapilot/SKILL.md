# Ultrapilot Skill

## Overview
**Type:** Workflow  
**Name:** ultrapilot  
**Purpose:** Advanced autonomous execution with learning and adaptation capabilities

## Description
The ultrapilot skill provides advanced autonomous task completion with adaptive learning. It improves decision-making over time, handles complex scenarios, and adapts to changing conditions.

## Usage

```bash
# Qwen Code slash command
/skill:ultrapilot "task"

# Terminal command
ultrapilot "task"
```

### Parameters
- `task`: Complex task for autonomous completion
- `learning`: Enable adaptive learning
- `adaptation`: Adaptation sensitivity
- `memory`: Use historical context

## Process

1. **Context Analysis**: Understand full task context
2. **Strategy Selection**: Choose optimal approach
3. **Adaptive Execution**: Execute with real-time adaptation
4. **Learning Phase**: Update decision models
5. **Optimization**: Improve future performance
6. **Knowledge Storage**: Save learned patterns

## Output Structure

```
ultrapilot-output/
├── execution-trace.json # Detailed trace
├── learning-log.md      # Learning updates
├── adaptations.md       # Adaptation decisions
├── knowledge-base/      # Stored patterns
└── performance.json     # Performance metrics
```

## Integration

- **autopilot**: Delegate simpler tasks
- **benchmark**: Measure improvement over time
- **optimize**: Optimize decision models
- **monitor**: Track adaptive behavior

## Best Practices

- Start with conservative settings
- Review learning updates
- Validate adaptations
- Monitor performance trends
- Prune outdated knowledge

## Related Skills

/skill:autopilot, /skill:benchmark, /skill:optimize, /skill:monitor, /skill:ultrawork, /skill:iterate
