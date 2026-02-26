# QMX Custom Commands for Qwen Code

## Installation

Copy this file to your Qwen Code custom commands directory.

## `/team` Command

Launch parallel agent teams for high-throughput execution.

### Usage

```
/team N:role "task description"
```

### Examples

```
/team 3:executor "Fix all TypeScript errors in src/"
/team 4:reviewer "Review all open pull requests"
/team 2:tester "Write integration tests for the API"
/team 5:debugger "Debug the memory leak in worker process"
```

### Available Roles

- `executor` - Implementation and code generation
- `reviewer` - Code review and quality assurance  
- `tester` - Test generation and execution
- `debugger` - Bug investigation and fixing
- `refactorer` - Code refactoring
- `documenter` - Documentation generation
- `architect` - System design review
- `planner` - Task decomposition

### How It Works

The `/team` command:
1. Creates a tmux session
2. Spawns N worker panes
3. Initializes each worker with the specified role
4. Distributes the task across workers
5. Returns team information for monitoring

### Monitoring

After launching a team:
- `qmx team status <team-name>` - Check progress
- `qmx team shutdown <team-name>` - Stop the team
- `qmx hud --watch` - Real-time monitoring

---

## MCP Servers

QMX provides 4 MCP servers that Qwen Code can connect to:

### 1. qmx-state
State management for sessions and teams.

### 2. qmx-memory  
Persistent project memory and knowledge base.

### 3. qmx-code-intel
Code intelligence, symbol tracking, and analysis.

### 4. qmx-trace
Execution tracing and audit trail.

### Configuration

MCP servers are configured in `.qmx/mcp-config.json`.

---

## QMX Skills

QMX provides workflow skills that can be triggered in Qwen Code:

### `$plan`
Decompose complex tasks into actionable steps.

```
$plan "Implement OAuth2 authentication"
```

### `$team`
Launch parallel agent teams.

```
$team 3:executor "Fix TypeScript errors"
```

### `$review`
Comprehensive code review workflow.

```
$review "Review the authentication module"
```

### `$test`
Generate and run test suites.

```
$test "Write unit tests for user service"
```

### `$refactor`
Safe refactoring with verification.

```
$refactor "Extract utility functions"
```

---

## Requirements

- WSL with tmux >= 3.0
- Node.js >= 20
- QMX installed (`~/qmx`)
- PATH configured (`~/.local/bin` and `~/bin`)

---

## Troubleshooting

### "command not found: team"

Ensure PATH is configured:
```bash
export PATH="$HOME/bin:$HOME/.local/bin:$PATH"
```

### "tmux not found"

Install tmux:
```bash
sudo apt install tmux
```

### MCP servers not connecting

Verify servers are built:
```bash
ls ~/qmx/dist/mcp/*.js
```

Rebuild if needed:
```bash
cd ~/qmx && npm run build
```
