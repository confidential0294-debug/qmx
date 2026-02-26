# Deploy Skill

## Overview
**Type:** Workflow  
**Name:** deploy  
**Purpose:** Deployment automation workflow with rollback and verification capabilities

## Description
The deploy skill automates application deployment with built-in safety features including rollback capabilities, health verification, and staged rollouts. It ensures reliable, repeatable deployments across environments.

## Usage

```bash
# Qwen Code slash command
/skill:deploy "task"

# Terminal command
deploy "task"
```

### Parameters
- `target`: Deployment target environment
- `version`: Version or commit to deploy
- `strategy`: Deployment strategy (blue-green, canary, rolling)
- `rollback`: Automatic rollback on failure

## Process

1. **Pre-deployment Checks**: Validate prerequisites and readiness
2. **Build Phase**: Build deployment artifacts
3. **Staging**: Deploy to staging for validation
4. **Production Deploy**: Execute production deployment
5. **Health Verification**: Verify deployment health
6. **Rollback**: Execute rollback if needed

## Output Structure

```
deploy-output/
├── deployment-log.json   # Deployment details
├── artifacts/            # Built artifacts
├── health-checks.json    # Health verification results
├── rollback-info.md      # Rollback procedures
└── summary.md            # Deployment summary
```

## Integration

- **ci**: Trigger deployment from CI
- **monitor**: Monitor deployment health
- **cancel**: Cancel in-progress deployment
- **release**: Coordinate with releases

## Best Practices

- Always verify before deploying
- Use staged rollouts
- Maintain rollback capability
- Monitor during deployment
- Document deployment procedures

## Related Skills

/skill:ci, /skill:monitor, /skill:cancel, /skill:release, /skill:cd, /skill:verify
