# Refactor Skill

## Overview
**Type:** Workflow  
**Name:** refactor  
**Purpose:** Safe refactoring with verification and automated testing

## Description
The refactor skill enables safe code restructuring with built-in verification. It identifies refactoring opportunities, applies transformations while preserving behavior, and validates changes through automated testing.

## Usage

```bash
skill: "refactor"
```

### Parameters
- `target`: Code to refactor
- `strategy`: Refactoring approach (extract, rename, restructure)
- `preserve`: Behavior preservation requirements
- `tests`: Run verification tests (default: true)

## Process

1. **Analysis Phase**: Identify refactoring opportunities
2. **Planning Phase**: Create refactoring plan with safety checks
3. **Transformation Phase**: Apply refactoring changes
4. **Verification Phase**: Run tests to ensure behavior preservation
5. **Validation Phase**: Confirm code quality improvements

## Output Structure

```
refactor-output/
├── changes.md          # Summary of changes made
├── before-after/       # Code comparison
├── verification.json   # Test results
└── metrics.json        # Quality improvements
```

## Integration

- **test**: Generate verification tests
- **review**: Review refactored code
- **cleanup**: Remove dead code after refactoring
- **optimize**: Performance-focused refactoring

## Best Practices

- Make small, incremental changes
- Ensure tests pass before and after
- Document refactoring decisions
- Preserve public API contracts
- Verify behavior with comprehensive tests

## Related Skills

test, review, cleanup, optimize, verify, modernize
