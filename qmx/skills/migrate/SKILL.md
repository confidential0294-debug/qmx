# Migrate Skill

## Overview
**Type:** Workflow  
**Name:** migrate  
**Purpose:** Database and code migration workflow with validation and rollback

## Description
The migrate skill handles database schema migrations and code migrations safely. It provides versioned migrations, validation, rollback capabilities, and data integrity verification.

## Usage

```bash
skill: "migrate"
```

### Parameters
- `type`: Migration type (database, code, data)
- `direction`: Migration direction (up, down)
- `target`: Target version or state
- `validate`: Enable validation checks

## Process

1. **Analysis Phase**: Analyze current state and target
2. **Plan Generation**: Create migration execution plan
3. **Backup**: Create backup before migration
4. **Execution**: Execute migration steps
5. **Validation**: Verify migration success
6. **Rollback Plan**: Prepare rollback if needed

## Output Structure

```
migrate-output/
├── migration-plan.md     # Detailed migration plan
├── backup-info.json      # Backup location and details
├── execution-log.json    # Step-by-step execution log
├── validation.json       # Validation results
└── rollback.sql          # Rollback script
```

## Integration

- **verify**: Verify migration results
- **test**: Test migrated system
- **deploy**: Deploy migration scripts
- **backup**: Create pre-migration backups

## Best Practices

- Always backup before migrating
- Test migrations in staging
- Use versioned migrations
- Validate data integrity
- Plan rollback procedures

## Related Skills

verify, test, deploy, backup, validate, release
