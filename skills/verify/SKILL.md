---
name: verify
description: Verify code correctness. Use when verifying functionality.
---

# Verify Skill

## Overview
**Type:** Workflow  
**Name:** verify  
**Purpose:** Implementation verification workflow with testing and quality checks

## Description
The verify skill confirms implementations meet specifications through systematic testing, quality checks, and compliance verification.

## Usage

```
skill: "verify"
```

### Parameters
- `implementation`: Implementation to verify
- `specifications`: Specifications to verify against
- `checks`: Quality checks to perform
- `strictness`: Verification strictness level

## Process

1. **Specification Review**: Understand verification criteria
2. **Test Planning**: Plan verification tests
3. **Execution**: Execute verification tests
4. **Quality Checks**: Run quality checks
5. **Compliance Check**: Verify compliance
6. **Report**: Generate verification report

## Output Structure

```
verify-output/
├── test-results.json     # Test execution results
├── quality-checks.json   # Quality check results
├── compliance.md         # Compliance status
├── issues.md             # Identified issues
└── verification-report.md # Final report
```

## Integration

- **test**: Execute verification tests
- **validate**: Validate requirements
- **review**: Review verification results
- **fix**: Fix verification failures

## Best Practices

- Define clear criteria
- Test edge cases
- Document verification evidence
- Track verification status
- Re-verify after changes

## Related Skills

test, validate, review, fix, quality, audit
