# Cleanup Skill

## Overview
**Type:** Workflow  
**Name:** cleanup  
**Purpose:** Code cleanup workflow with dead code removal and organization

## Description
The cleanup skill identifies and removes dead code, organizes code structure, and improves codebase hygiene while maintaining functionality.

## Usage

```bash
# Qwen Code slash command
/skill:cleanup "task"

# Terminal command
cleanup "task"
```

### Parameters
- `scope`: Cleanup scope (full, targeted)
- `aggressiveness`: Cleanup aggressiveness level
- `preserve`: Code to preserve
- `verify`: Verify after cleanup

## Process

1. **Code Analysis**: Analyze codebase for cleanup opportunities
2. **Dead Code Detection**: Identify unused code
3. **Organization**: Organize code structure
4. **Cleanup Execution**: Remove/organize code
5. **Verification**: Verify functionality preserved
6. **Report**: Generate cleanup report

## Output Structure

```
cleanup-output/
├── analysis.md           # Cleanup analysis
├── dead-code/            # Dead code report
├── changes/              # Changes made
├── verification.json     # Verification results
└── cleanup-report.md     # Cleanup summary
```

## Integration

- **review**: Review cleanup changes
- **test**: Verify after cleanup
- **refactor**: Refactor during cleanup
- **audit**: Audit cleanup results

## Best Practices

- Backup before cleanup
- Verify after each change
- Remove dead code safely
- Organize consistently
- Document cleanup decisions

## Related Skills

/skill:review, /skill:test, /skill:refactor, /skill:audit, /skill:organize, /skill:remove
