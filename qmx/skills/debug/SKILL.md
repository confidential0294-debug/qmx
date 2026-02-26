# Debug Skill

## Overview
**Type:** Workflow  
**Name:** debug  
**Purpose:** Systematic debugging workflow with root cause analysis and fix verification

## Description
The debug skill provides structured debugging capabilities, systematically identifying root causes of issues, developing fixes, and verifying solutions to prevent recurrence.

## Usage

```bash
# Qwen Code slash command
/skill:debug "task"

# Terminal command
debug "task"
```

### Parameters
- `issue`: Problem description or symptoms
- `scope`: Debugging scope (local, module, system)
- `tools`: Debugging tools to use
- `depth`: Analysis depth level

## Process

1. **Symptom Analysis**: Gather and analyze symptoms
2. **Reproduction**: Create reproducible test case
3. **Investigation**: Trace issue to root cause
4. **Hypothesis**: Formulate cause hypothesis
5. **Fix Development**: Create and test fix
6. **Verification**: Confirm fix resolves issue
7. **Prevention**: Add safeguards against recurrence

## Output Structure

```
debug-output/
├── analysis.md           # Root cause analysis
├── reproduction.md       # Reproduction steps
├── fix.patch             # Fix implementation
├── verification.json     # Fix verification results
└── prevention.md         # Prevention measures
```

## Integration

- **fix**: Apply debugging fixes
- **test**: Create regression tests
- **review**: Review fix quality
- **monitor**: Add monitoring for issue

## Best Practices

- Reproduce before fixing
- Find root cause, not symptoms
- Test fixes thoroughly
- Add regression tests
- Document learnings

## Related Skills

/skill:fix, /skill:test, /skill:review, /skill:monitor, /skill:verify, /skill:profile
