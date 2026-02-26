# Review Skill

## Overview
**Type:** Workflow  
**Name:** review  
**Purpose:** Comprehensive code review workflow with automated analysis and human-guided feedback

## Description
The review skill provides systematic code review capabilities, combining automated static analysis with structured human review processes. It identifies code quality issues, security vulnerabilities, style inconsistencies, and potential bugs before code is merged.

## Usage

```bash
# Qwen Code slash command
/skill:review "task"

# Terminal command
review "task"
```

### Parameters
- `paths`: Files or directories to review
- `focus`: Specific areas (security, performance, style, all)
- `severity`: Minimum severity level to report

## Process

1. **Scan Phase**: Analyze code structure and identify review targets
2. **Analysis Phase**: Run automated checks for issues
3. **Categorization**: Group findings by type and severity
4. **Report Generation**: Create detailed review report
5. **Recommendations**: Provide actionable fix suggestions

## Output Structure

```
review-report/
├── summary.md          # Executive summary
├── issues/             # Categorized issues
│   ├── critical.md
│   ├── high.md
│   ├── medium.md
│   └── low.md
├── metrics.json        # Quality metrics
└── recommendations.md  # Fix suggestions
```

## Integration

- **fix**: Apply recommended fixes
- **test**: Generate tests for reviewed code
- **ci**: Integrate review into CI pipeline
- **secure**: Deep security analysis

## Best Practices

- Review small, focused changes
- Run reviews before merging
- Address critical issues first
- Document review decisions
- Use automated checks consistently

## Related Skills

/skill:fix, /skill:test, /skill:ci, /skill:secure, /skill:audit, /skill:verify
