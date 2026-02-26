# Containerize Skill

## Overview
**Type:** Workflow  
**Name:** containerize  
**Purpose:** Docker containerization workflow with optimization and best practices

## Description
The containerize skill creates optimized Docker containers following best practices for security, size, and maintainability.

## Usage

```bash
# Qwen Code slash command
/skill:containerize "task"

# Terminal command
containerize "task"
```

### Parameters
- `application`: Application to containerize
- `base_image`: Base image preference
- `optimization`: Optimization level
- `multi_stage`: Enable multi-stage builds

## Process

1. **Application Analysis**: Analyze application requirements
2. **Base Image Selection**: Choose appropriate base image
3. **Dockerfile Creation**: Create optimized Dockerfile
4. **Build Optimization**: Optimize build layers
5. **Security Hardening**: Apply security best practices
6. **Testing**: Test container functionality

## Output Structure

```
containerize-output/
├── Dockerfile            # Main Dockerfile
├── docker-compose.yml    # Compose configuration
├── build-context/        # Build context files
├── security-report.json  # Security scan results
└── testing.md            # Container testing results
```

## Integration

- **ci**: Build in CI pipeline
- **deploy**: Deploy containers
- **secure**: Security scanning
- **monitor**: Monitor containers

## Best Practices

- Use minimal base images
- Multi-stage builds
- Non-root users
- Scan for vulnerabilities
- Tag versions properly

## Related Skills

/skill:ci, /skill:deploy, /skill:secure, /skill:monitor, /skill:build, /skill:docker
