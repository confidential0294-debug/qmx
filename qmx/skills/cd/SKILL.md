# CD Skill

## Overview
**Type:** Workflow  
**Name:** cd  
**Purpose:** CD pipeline creation workflow with deployment automation and rollback

## Description
The cd skill creates Continuous Deployment pipelines with automated deployments, environment management, and rollback capabilities.

## Usage

```bash
# Qwen Code slash command
/skill:cd "task"

# Terminal command
cd "task"
```

### Parameters
- `environments`: Target environments
- `strategy`: Deployment strategy
- `approvals`: Approval requirements
- `rollback`: Rollback configuration

## Process

1. **Environment Setup**: Configure target environments
2. **Pipeline Design**: Design deployment pipeline
3. **Automation Setup**: Configure deployment automation
4. **Approval Workflow**: Set up approval gates
5. **Rollback Config**: Configure rollback procedures
6. **Validation**: Validate deployment pipeline

## Output Structure

```
cd-output/
├── pipeline.yml          # CD pipeline config
├── environments/         # Environment configs
├── deployment-scripts/   # Deployment scripts
├── rollback-scripts/     # Rollback procedures
└── validation.json       # Pipeline validation
```

## Integration

- **ci**: Trigger from CI
- **deploy**: Execute deployments
- **monitor**: Monitor deployments
- **rollback**: Handle rollbacks

## Best Practices

- Automate fully where safe
- Use deployment strategies
- Implement approval gates
- Test rollback procedures
- Monitor deployments closely

## Related Skills

/skill:ci, /skill:deploy, /skill:monitor, /skill:rollback, /skill:release, /skill:automate
