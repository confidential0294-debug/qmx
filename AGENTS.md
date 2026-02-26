# QMX Agent Orchestration Guide

## Overview

QMX provides 30 specialized agent prompts that transform Qwen Code from a single-session agent into a coordinated multi-agent system.

## Available Agents

### Core Agents

| Agent | Command | Purpose |
|-------|---------|---------|
| Architect | `/prompts:architect` | System design and architecture review |
| Planner | `/prompts:planner` | Task decomposition and planning |
| Executor | `/prompts:executor` | Implementation and code generation |
| Debugger | `/prompts:debugger` | Bug investigation and fixes |
| Reviewer | `/prompts:reviewer` | Code review and quality assurance |
| Security | `/prompts:security` | Security audit and vulnerability detection |

### Specialized Agents

| Agent | Command | Purpose |
|-------|---------|---------|
| Performance | `/prompts:performance` | Performance optimization |
| Tester | `/prompts:tester` | Test generation and validation |
| DevOps | `/prompts:devops` | CI/CD and deployment |
| Tech Writer | `/prompts:techwriter` | Documentation |
| Refactoring | `/prompts:refactoring` | Code refactoring |
| Database | `/prompts:database` | Database design and optimization |
| API | `/prompts:api` | API design |
| Frontend | `/prompts:frontend` | Frontend/UI development |
| Backend | `/prompts:backend` | Backend systems |
| Mobile | `/prompts:mobile` | Mobile development |
| Cloud | `/prompts:cloud` | Cloud architecture |
| Monitoring | `/prompts:monitoring` | Observability and monitoring |
| Compliance | `/prompts:compliance` | Compliance and standards |
| Accessibility | `/prompts:accessibility` | Accessibility |
| i18n | `/prompts:i18n` | Internationalization |
| Migration | `/prompts:migration` | Legacy migration |
| Integration | `/prompts:integration` | Third-party integration |
| Prototyping | `/prompts:prototyping` | Rapid prototyping |
| Optimization | `/prompts:optimization` | Build/deployment optimization |
| Research | `/prompts:research` | Technical research |
| Mentor | `/prompts:mentor` | Code mentoring |
| Automation | `/prompts:automation` | Test automation |
| Release | `/prompts:release` | Release management |
| Incident | `/prompts:incident` | Incident response |

## Usage Patterns

### Sequential Agent Handoff

Pass work between agents in a sequence:

```bash
# 1. Plan the work
/prompts:planner "Implement user authentication with OAuth2"

# 2. Review the plan
/prompts:architect "Review the authentication plan for security"

# 3. Execute
/prompts:executor "Implement the authentication module"

# 4. Test
/prompts:tester "Generate tests for authentication"

# 5. Final review
/prompts:reviewer "Review the complete implementation"
```

### Parallel Agent Execution

Use multiple agents in parallel for different aspects:

```bash
# Security review
/prompts:security "Audit the login system"

# Performance review (parallel)
/prompts:performance "Check for performance issues"

# Code review (parallel)
/prompts:reviewer "Review code quality"
```

### Agent + Skill Combination

Combine agents with workflow skills:

```bash
# Plan with planner agent
/prompts:planner "Refactor the payment module"

# Execute with team skill
$team 3:executor "Implement the refactoring"

# Verify with reviewer
/prompts:reviewer "Verify the refactoring"
```

## Best Practices

### 1. Choose the Right Agent

- **Architecture decisions** → Architect
- **Task breakdown** → Planner
- **Implementation** → Executor
- **Bug fixes** → Debugger
- **Code quality** → Reviewer
- **Security concerns** → Security

### 2. Provide Context

Always include relevant context:

```bash
# Bad
/prompts:executor "Fix the bug"

# Good
/prompts:executor "Fix the null pointer exception in UserService.java line 45"
```

### 3. Chain Agents Effectively

```bash
# Complex feature workflow
/prompts:architect "Design the feature boundaries"
/prompts:planner "Break down into tasks"
/prompts:executor "Implement phase 1"
/prompts:tester "Test phase 1"
/prompts:executor "Implement phase 2"
/prompts:reviewer "Final review"
```

### 4. Use Specialists for Complex Tasks

```bash
# Database migration
/prompts:database "Design migration from MongoDB to PostgreSQL"
/prompts:migration "Plan the data migration"
/prompts:executor "Implement migration scripts"
```

## Agent Workflows

### Feature Development Workflow

```
1. /prompts:architect    → Design feature boundaries
2. /prompts:planner      → Break down into tasks
3. /prompts:executor     → Implement features
4. /prompts:tester       → Generate tests
5. /prompts:reviewer     → Code review
6. /prompts:devops       → Deploy to staging
```

### Bug Fix Workflow

```
1. /prompts:debugger     → Investigate root cause
2. /prompts:planner      → Plan the fix
3. /prompts:executor     → Implement fix
4. /prompts:tester       → Add regression tests
5. /prompts:reviewer     → Verify fix
```

### Security Audit Workflow

```
1. /prompts:security     → Initial security scan
2. /prompts:executor     → Fix critical issues
3. /prompts:security     → Re-verify
4. /prompts:compliance   → Compliance check
```

### Performance Optimization Workflow

```
1. /prompts:monitoring   → Identify bottlenecks
2. /prompts:performance  → Analyze performance
3. /prompts:executor     → Optimize hot paths
4. /prompts:benchmark    → Measure improvements
```

## Integration with Skills

Agents work seamlessly with QMX skills:

### Agent + $plan

```bash
/prompts:planner "Create a detailed plan"
$plan "Review and refine the plan"
```

### Agent + $team

```bash
/prompts:architect "Design the system"
$team 4:executor "Implement in parallel"
/prompts:reviewer "Review all changes"
```

### Agent + $review

```bash
/prompts:executor "Implement the feature"
$review "Comprehensive review"
/prompts:security "Security review"
```

## Prompt Templates

### Architecture Review Template

```
/prompts:architect "Review [component] for:
- Separation of concerns
- Scalability implications
- Technical debt
- Improvement recommendations"
```

### Implementation Template

```
/prompts:executor "Implement [feature]:
Requirements:
- [Requirement 1]
- [Requirement 2]

Constraints:
- [Constraint 1]
- [Constraint 2]

Files to modify:
- [File 1]
- [File 2]"
```

### Debug Template

```
/prompts:debugger "Investigate [issue]:
Symptoms:
- [Symptom 1]
- [Symptom 2]

Expected behavior: [description]

Actual behavior: [description]

Steps to reproduce:
1. [Step 1]
2. [Step 2]"
```

## Troubleshooting

### Agent Not Responding

- Check agent name spelling
- Verify prompts directory exists
- Ensure QMX is properly initialized

### Poor Quality Responses

- Provide more context
- Be more specific in your request
- Try a different agent specialization

### Agent Conflicts

When agents give conflicting advice:

1. Prioritize security concerns
2. Consider architectural guidance
3. Balance with practical constraints
4. Document the decision

## Advanced Usage

### Custom Agent Prompts

Create custom agents in `.qmx/prompts/`:

```markdown
# .qmx/prompts/my-custom-agent.md

# My Custom Agent

**Role:** [Specialization]

## Purpose

[Description]

## Capabilities

1. [Capability 1]
2. [Capability 2]

## Example Prompts

```
/prompts:my-custom-agent "[Task]"
```
```

### Agent Configuration

Configure agent behavior in `.qmx/config.toml`:

```toml
[agents]
default_effort = "high"
max_iterations = 5
timeout_minutes = 30
```

## Resources

- [Agent Prompts Directory](prompts/)
- [Workflow Skills](skills/)
- [Quick Start Guide](docs/QUICKSTART.md)
