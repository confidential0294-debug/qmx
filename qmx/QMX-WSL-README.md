# QMX Integration for Qwen Code (WSL)

## Status: ✅ Active

QMX is now fully integrated with Qwen Code in WSL.

## MCP Servers (4 Active)

All 4 MCP servers are configured in `~/.qwen/settings.json`:

1. **qmx-state** - Session and team state management
2. **qmx-memory** - Persistent project memory  
3. **qmx-code-intel** - Code intelligence and symbols
4. **qmx-trace** - Execution tracing

## Custom Commands

### /team - Launch Agent Teams

**Usage:** `/team N:role "task"`

**Examples:**
- `/team 3:executor "Fix TypeScript errors"`
- `/team 4:reviewer "Review all PRs"`
- `/team 2:tester "Write integration tests"`

**Available Roles:**
- `executor`, `reviewer`, `tester`, `debugger`
- `refactorer`, `documenter`, `architect`, `planner`

### Shell Commands (in WSL terminal)

```bash
team 3:executor "task"        # Launch team
qmx team list                 # List teams
qmx team status <name>        # Check status
qmx team shutdown <name>      # Stop team
qmx doctor                    # Check installation
```

## Agent Prompts (30 Available)

Located in `~/qmx/prompts/`:
- architect, planner, executor, debugger
- reviewer, security, performance, tester
- And 22 more specialized agents

## Workflow Skills (39 Available)

Located in `~/qmx/skills/`:
- `$plan`, `$team`, `$review`, `$test`
- `$refactor`, `$research`, `$debug`
- And 33 more workflow patterns

## Verification

Run in WSL terminal:
```bash
source ~/.nvm/nvm.sh && nvm use 20
export PATH=$HOME/bin:$HOME/.local/bin:$PATH
qmx doctor
team 2:executor "Test"
```

## Location

- QMX Install: `~/qmx/`
- QMX MCP: `~/qmx/dist/mcp/`
- Qwen Config: `~/.qwen/settings.json`
- Team Command: `~/bin/team`
- QMX Binary: `~/.local/bin/qmx`
