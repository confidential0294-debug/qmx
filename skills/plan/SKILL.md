---
name: plan
description: Decompose complex tasks into actionable steps, phases, and timelines. Use when planning, creating roadmaps, or breaking down work.
---

# plan - Planning Skill

**Type:** Workflow Automation  
**Purpose:** Decompose complex tasks into actionable, sequential steps

## Overview

The `plan` skill transforms vague or complex requests into structured, executable plans with clear milestones, dependencies, and acceptance criteria.

## Usage

```
plan "Your complex task or goal"
```

## Examples

```
user: "Implement user authentication with OAuth2"
plan "Refactor the payment module to support multiple providers"
plan "Migrate from MongoDB to PostgreSQL"
plan "Add real-time notifications using WebSockets"
```

## Process

When you invoke `plan`, the following happens:

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
- `team` - Execute plan phases in parallel
- `review` - Review plan completeness
- `test` - Generate test plans

## Best Practices

1. **Be Specific**: The more specific your request, the better the plan
2. **Provide Context**: Include relevant files or system information
3. **Iterate**: Plans can be refined as you learn more
4. **Track Progress**: Use the checklist to track completion

## Related Skills

- `team` - Execute plan with parallel workers
- `$exec` - Execute specific tasks from the plan
- `review` - Review and validate the plan
