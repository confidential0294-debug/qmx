# Validate Skill

## Overview
**Type:** Workflow  
**Name:** validate  
**Purpose:** Requirements validation workflow with traceability and coverage analysis

## Description
The validate skill ensures requirements are properly validated, traced to implementation, and covered by tests. It provides comprehensive validation reporting and gap analysis.

## Usage

```bash
skill: "validate"
```

### Parameters
- `requirements`: Requirements to validate
- `scope`: Validation scope (functional, non-functional)
- `traceability`: Enable traceability analysis
- `coverage`: Coverage analysis requirements

## Process

1. **Requirements Analysis**: Parse and understand requirements
2. **Traceability Mapping**: Map requirements to implementation
3. **Coverage Analysis**: Analyze test coverage
4. **Validation Execution**: Execute validation checks
5. **Gap Identification**: Identify validation gaps
6. **Report Generation**: Generate validation report

## Output Structure

```
validate-output/
├── requirements-map.json   # Requirements traceability
├── coverage-analysis.json  # Coverage analysis
├── validation-results.json # Validation results
├── gaps.md                 # Identified gaps
└── report.md               # Validation report
```

## Integration

- **test**: Ensure test coverage
- **verify**: Verify implementation
- **review**: Review validation results
- **audit**: Comprehensive audit

## Best Practices

- Validate early and often
- Maintain traceability
- Cover all requirements
- Document validation evidence
- Track validation status

## Related Skills

test, verify, review, audit, requirements, quality
