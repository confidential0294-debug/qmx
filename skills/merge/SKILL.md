---
name: merge
description: Merge conflict resolution. Use when merging code or resolving conflicts.
---

# Merge Skill

## Overview
**Type:** Workflow  
**Name:** merge  
**Purpose:** Merge conflict resolution workflow with safe merging practices

## Description
The merge skill handles branch merging with conflict detection, resolution assistance, and verification to ensure safe integration of changes.

## Usage

```
skill: "merge"
```

### Parameters
- `source`: Source branch to merge
- `target`: Target branch to merge into
- `strategy`: Merge strategy (recursive, octopus, etc.)
- `conflict_resolution`: Conflict resolution approach

## Process

1. **Pre-merge Check**: Verify merge readiness
2. **Conflict Detection**: Detect merge conflicts
3. **Resolution**: Resolve conflicts systematically
4. **Merge Execution**: Execute the merge
5. **Testing**: Test merged code
6. **Verification**: Verify merge success

## Output Structure

```
merge-output/
├── merge-plan.md         # Merge plan
├── conflicts/            # Conflict details
├── resolution-log.json   # Resolution log
├── test-results.json     # Post-merge tests
└── merge-report.md       # Merge summary
```

## Integration

- **sync**: Sync before merging
- **test**: Test merged code
- **review**: Review merge changes
- **ci**: Run CI on merge

## Best Practices

- Keep branches updated
- Resolve conflicts promptly
- Test after merging
- Review merge commits
- Use meaningful messages

## Related Skills

sync, test, review, ci, git, version
