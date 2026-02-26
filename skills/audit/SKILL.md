---
name: audit
description: Code audit. Use when auditing code quality.
---

# Audit Skill

## Overview
**Type:** Workflow  
**Name:** audit  
**Purpose:** Code audit workflow with comprehensive analysis and reporting

## Description
The audit skill performs comprehensive code audits, analyzing code quality, security, compliance, and best practices adherence with detailed reporting.

## Usage

```
skill: "audit"
```

### Parameters
- `scope`: Audit scope (full, targeted)
- `focus`: Focus areas (security, quality, compliance)
- `depth`: Audit depth level
- `standards`: Standards to audit against

## Process

1. **Scope Definition**: Define audit scope
2. **Code Analysis**: Analyze codebase thoroughly
3. **Compliance Check**: Check against standards
4. **Issue Identification**: Identify issues
5. **Risk Assessment**: Assess risk levels
6. **Report Generation**: Generate audit report

## Output Structure

```
audit-output/
├── audit-report.md       # Comprehensive audit report
├── findings/             # Findings by category
├── risk-assessment.json  # Risk assessment
├── compliance.json       # Compliance status
└── recommendations.md    # Remediation recommendations
```

## Integration

- **review**: Deep code review
- **secure**: Security audit
- **cleanup**: Address findings
- **modernize**: Modernization recommendations

## Best Practices

- Audit regularly
- Focus on high-risk areas
- Document all findings
- Prioritize remediation
- Track audit progress

## Related Skills

review, secure, cleanup, modernize, verify, quality
