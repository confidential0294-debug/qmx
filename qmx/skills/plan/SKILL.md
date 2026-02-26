# $plan - Planning Skill

**Type:** Workflow Automation  
**Purpose:** Decompose complex tasks into actionable, sequential steps

## Overview

The `/skill:plan` skill transforms vague or complex requests into structured, executable plans with clear milestones, dependencies, and acceptance criteria.

## Usage

```bash
# Qwen Code slash command
/skill:plan "Your complex task or goal"

# Terminal command
plan "Your complex task or goal"
```

## Examples

```bash
# Qwen Code slash commands
/skill:plan "Implement user authentication with OAuth2"
/skill:plan "Refactor the payment module to support multiple providers"
/skill:plan "Migrate from MongoDB to PostgreSQL"
/skill:plan "Add real-time notifications using WebSockets"
```

## Process

When you invoke `/skill:plan`, the following happens:

1. **Requirement Analysis**
   - Clarify the goal and success criteria
   - Identify constraints and assumptions
   - Gather context about the current system

2. **Task Decomposition**
   - Break down into phases
   - Identify dependencies
   - Estimate effort for each task

3. **Risk Assessment**
   - Identify potential blockers
   - Assess technical risks
   - Plan mitigation strategies

4. **Output Generation**
   - Structured plan document
   - Task checklist
   - Timeline estimation

## Output Structure

The skill produces a plan in `.qmx/plans/{plan-name}.md`:

```markdown
# Plan: {Plan Name}

## Goal
Clear statement of what this plan achieves

## Current State
Analysis of the starting point

## Target State
Description of the desired outcome

## Phases

### Phase 1: Foundation
- [ ] Task 1.1 (Effort: M, Priority: High)
- [ ] Task 1.2 (Effort: S, Priority: High)

### Phase 2: Implementation
- [ ] Task 2.1 (Effort: L, Priority: Medium)
- [ ] Task 2.2 (Effort: M, Priority: Medium)

### Phase 3: Validation
- [ ] Task 3.1 (Effort: S, Priority: High)

## Dependencies
- Task 2.1 requires Task 1.1 and 1.2
- Task 2.2 requires Task 2.1

## Risks & Mitigations
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| ...  | ...        | ...    | ...        |

## Success Criteria
- [ ] Criterion 1
- [ ] Criterion 2
```

## Integration

This skill integrates with:
- `/skill:team` - Execute plan phases in parallel
- `/skill:review` - Review plan completeness
- `/skill:test` - Generate test plans

## Best Practices

1. **Be Specific**: The more specific your request, the better the plan
2. **Provide Context**: Include relevant files or system information
3. **Iterate**: Plans can be refined as you learn more
4. **Track Progress**: Use the checklist to track completion

## Related Skills

- `/skill:team` - Execute plan with parallel workers
- `/skill:exec` - Execute specific tasks from the plan
- `/skill:review` - Review and validate the plan
