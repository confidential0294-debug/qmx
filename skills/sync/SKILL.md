---
name: sync
description: Data synchronization. Use when syncing data or state.
---

# Sync Skill

## Overview
**Type:** Workflow  
**Name:** sync  
**Purpose:** Code synchronization workflow with conflict prevention and resolution

## Description
The sync skill manages code synchronization between branches, repositories, or environments, preventing and resolving conflicts while maintaining consistency.

## Usage

```
skill: "sync"
```

### Parameters
- `source`: Source to sync from
- `target`: Target to sync to
- `strategy`: Sync strategy (merge, rebase, copy)
- `conflict_handling`: Conflict resolution approach

## Process

1. **Difference Analysis**: Analyze differences between sources
2. **Conflict Detection**: Detect potential conflicts
3. **Sync Planning**: Plan synchronization approach
4. **Execution**: Execute synchronization
5. **Conflict Resolution**: Resolve any conflicts
6. **Verification**: Verify sync success

## Output Structure

```
sync-output/
├── diff-report.md        # Difference analysis
├── conflicts.md          # Conflict report
├── sync-log.json         # Sync execution log
├── resolution.md         # Conflict resolutions
└── verification.json     # Sync verification
```

## Integration

- **merge**: Merge synchronized changes
- **rebase**: Rebase during sync
- **review**: Review sync results
- **test**: Test after sync

## Best Practices

- Sync frequently
- Resolve conflicts early
- Test after syncing
- Document sync decisions
- Keep branches updated

## Related Skills

merge, rebase, review, test, git, version
