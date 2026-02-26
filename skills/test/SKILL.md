---
name: test
description: Generate and run test suites. Use when needing unit tests, integration tests, or test coverage.
---

# Test Skill

## Overview
**Type:** Workflow  
**Name:** test  
**Purpose:** Test generation and execution workflow with comprehensive coverage analysis

## Description
The test skill automates test creation, execution, and coverage analysis. It generates unit tests, integration tests, and end-to-end tests based on code analysis, ensuring thorough test coverage and quality validation.

## Usage

```
skill: "test"
```

### Parameters
- `target`: Code to test (file, function, module)
- `type`: Test type (unit, integration, e2e)
- `coverage`: Target coverage percentage
- `framework`: Testing framework preference

## Process

1. **Analysis Phase**: Examine code structure and dependencies
2. **Test Generation**: Create test cases for identified scenarios
3. **Execution Phase**: Run tests and collect results
4. **Coverage Analysis**: Measure and report coverage metrics
5. **Report Generation**: Summarize findings and gaps

## Output Structure

```
test-output/
├── results.json        # Test execution results
├── coverage/           # Coverage reports
│   ├── html/
│   └── summary.json
├── generated/          # Generated test files
└── gaps.md            # Coverage gap analysis
```

## Integration

- **review**: Review generated tests
- **fix**: Fix failing tests
- **ci**: Integrate tests into CI pipeline
- **verify**: Verify implementation through tests

## Best Practices

- Test edge cases and error conditions
- Maintain high coverage (>80%)
- Keep tests isolated and deterministic
- Use descriptive test names
- Run tests frequently

## Related Skills

review, fix, ci, verify, benchmark, profile
