# Rebase Skill

## Overview
**Type:** Workflow  
**Name:** rebase  
**Purpose:** Git rebase assistance workflow with safe history management

## Description
The rebase skill assists with Git rebasing operations, managing history rewriting safely with conflict resolution and verification.

## Usage

```bash
skill: "rebase"
```

### Parameters
- `branch`: Branch to rebase
- `onto`: Target to rebase onto
- `mode`: Rebase mode (interactive, standard)
- `squash`: Enable commit squashing

## Process

1. **History Analysis**: Analyze commit history
2. **Rebase Planning**: Plan rebase strategy
3. **Execution**: Execute rebase operation
4. **Conflict Resolution**: Resolve rebase conflicts
5. **Verification**: Verify rebased history
6. **Force Push**: Safe force push if needed

## Output Structure

```
rebase-output/
├── history-before.md     # Original history
├── rebase-plan.md        # Rebase plan
├── conflicts/            # Conflict details
├── history-after.md      # New history
└── verification.json     # Rebase verification
```

## Integration

- **sync**: Sync with rebase
- **merge**: Alternative to merge
- **review**: Review rebased commits
- **test**: Test after rebase

## Best Practices

- Don't rebase shared branches
- Keep commits logical
- Resolve conflicts carefully
- Test after rebasing
- Document rebase decisions

## Related Skills

sync, merge, review, test, git, history
