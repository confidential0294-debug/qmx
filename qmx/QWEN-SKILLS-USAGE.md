# QMX Skills for Qwen Code

## Usage in Qwen Code

Qwen Code uses **slash commands** and the **skill panel** to access skills.

### Method 1: Slash Commands

```
/skill:plan "task description"
/skill:team "3:executor task"
/skill:review "code review"
```

### Method 2: Skill Panel

1. Click the **Skills** button in Qwen Code
2. Select from available skills:
   - plan
   - team
   - review
   - test
   - refactor
   - etc.

### Method 3: Terminal Commands

For team mode specifically, use the terminal:

```bash
# In WSL terminal
team 3:executor "Fix TypeScript errors"
```

---

## Available Skills (40)

### Core Skills
- `/skill:plan` - Planning workflow
- `/skill:team` - Team orchestration

### Code Quality
- `/skill:review` - Code review
- `/skill:test` - Test generation
- `/skill:refactor` - Refactoring
- `/skill:audit` - Code audit

### Debug & Fix
- `/skill:debug` - Debugging
- `/skill:fix` - Bug fixes
- `/skill:cancel` - Cancel execution

### Deployment
- `/skill:deploy` - Deployment
- `/skill:ci` - CI pipeline
- `/skill:cd` - CD pipeline
- `/skill:release` - Release prep

### And more...

---

## Agent Prompts (31)

Use `/prompts:name` syntax:

```
/prompts:architect "Review architecture"
/prompts:planner "Plan implementation"
/prompts:executor "Implement feature"
/prompts:reviewer "Review code"
```

---

## MCP Servers (4)

Automatically connected when Qwen Code starts:
- qmx-state
- qmx-memory
- qmx-code-intel
- qmx-trace

---

**Note:** The `$` syntax is for Codex only. Qwen Code uses `/skill:` and `/prompts:` syntax.
