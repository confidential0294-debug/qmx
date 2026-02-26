# Fix Skill

## Overview
**Type:** Workflow  
**Name:** fix  
**Purpose:** Bug fix workflow with root cause analysis and regression prevention

## Description
The fix skill manages bug fixes from identification through resolution, including root cause analysis, fix implementation, testing, and regression prevention.

## Usage

```bash
# Qwen Code slash command
/skill:fix "task"

# Terminal command
fix "task"
```

### Parameters
- `bug`: Bug description or ID
- `severity`: Bug severity level
- `analysis`: Root cause analysis depth
- `prevention`: Regression prevention measures

## Process

1. **Bug Analysis**: Understand bug symptoms and impact
2. **Root Cause**: Identify root cause
3. **Fix Design**: Design appropriate fix
4. **Implementation**: Implement fix
5. **Testing**: Test fix thoroughly
6. **Prevention**: Add regression prevention

## Output Structure

```
fix-output/
├── analysis.md           # Bug analysis
├── root-cause.md         # Root cause documentation
├── fix.patch             # Fix implementation
├── test-results.json     # Test results
└── prevention.md         # Prevention measures
```

## Integration

- **debug**: Debug to find root cause
- **test**: Test the fix
- **review**: Review fix quality
- **verify**: Verify fix effectiveness

## Best Practices

- Understand before fixing
- Fix root cause, not symptoms
- Test thoroughly
- Add regression tests
- Document the fix

## Related Skills

/skill:debug, /skill:test, /skill:review, /skill:verify, /skill:prevent, /skill:quality
