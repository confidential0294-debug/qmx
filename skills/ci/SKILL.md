---
name: ci
description: CI pipeline setup. Use when setting up continuous integration.
---

# CI Skill

## Overview
**Type:** Workflow  
**Name:** ci  
**Purpose:** CI pipeline creation workflow with testing and quality gates

## Description
The ci skill creates and manages Continuous Integration pipelines with automated testing, quality gates, and build automation.

## Usage

```
skill: "ci"
```

### Parameters
- `platform`: CI platform (github, gitlab, jenkins)
- `stages`: Pipeline stages to include
- `tests`: Test configurations
- `quality_gates`: Quality gate requirements

## Process

1. **Platform Setup**: Configure CI platform
2. **Pipeline Design**: Design pipeline stages
3. **Test Integration**: Integrate automated tests
4. **Quality Gates**: Configure quality gates
5. **Notification Setup**: Configure notifications
6. **Validation**: Validate pipeline

## Output Structure

```
ci-output/
├── pipeline.yml          # Pipeline configuration
├── scripts/              # CI scripts
├── quality-configs/      # Quality gate configs
├── test-configs/         # Test configurations
└── validation.json       # Pipeline validation
```

## Integration

- **test**: Run tests in CI
- **deploy**: Trigger deployments
- **review**: Review CI results
- **monitor**: Monitor pipeline health

## Best Practices

- Fast feedback loops
- Parallelize where possible
- Cache dependencies
- Fail fast on errors
- Keep pipelines maintainable

## Related Skills

test, deploy, review, monitor, cd, build
