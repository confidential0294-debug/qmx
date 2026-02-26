# Ralph Skill

## Overview
**Type:** Workflow  
**Name:** ralph  
**Purpose:** Methodical step-by-step implementation workflow with verification at each stage

## Description
The ralph skill provides a structured, methodical approach to implementation tasks. It breaks down complex work into verified steps, ensuring quality and correctness at each stage before proceeding.

## Usage

```bash
skill: "ralph"
```

### Parameters
- `task`: Implementation task description
- `steps`: Predefined step sequence (optional)
- `verification`: Verification strictness level
- `checkpoint`: Enable checkpoint saving

## Process

1. **Task Decomposition**: Break task into discrete steps
2. **Step Planning**: Define success criteria for each step
3. **Sequential Execution**: Complete steps one at a time
4. **Verification**: Verify each step before proceeding
5. **Checkpoint**: Save progress after verified steps
6. **Completion**: Final integration and validation

## Output Structure

```
ralph-output/
├── plan.md             # Step-by-step plan
├── checkpoints/        # Saved checkpoints
├── verification/       # Step verification logs
├── progress.json       # Current progress state
└── final-report.md     # Completion report
```

## Integration

- **verify**: Step verification
- **test**: Test each completed step
- **review**: Review intermediate results
- **iterate**: Iterate on failed steps

## Best Practices

- Define clear success criteria
- Verify before proceeding
- Save checkpoints regularly
- Document decisions at each step
- Roll back to checkpoint on failure

## Related Skills

verify, test, review, iterate, validate, plan
