# /team - Team Orchestration Command

**Type:** Qwen Code Custom Command  
**Purpose:** Launch and manage QMX agent teams directly from Qwen Code chat

## Usage

```
/team N:role "task description"
```

## Examples

```
/team 3:executor "Fix all TypeScript errors in src/"
/team 4:reviewer "Review all open pull requests"
/team 2:tester "Write integration tests for the API"
/team 5:debugger "Debug the memory leak in the worker process"
```

## Available Roles

- `executor` - Implementation and code generation
- `reviewer` - Code review and quality assurance
- `tester` - Test generation and execution
- `debugger` - Bug investigation and fixing
- `refactorer` - Code refactoring
- `documenter` - Documentation generation
- `architect` - System design review
- `planner` - Task decomposition

## Command Syntax

```
/team <worker_count>:<role> "<task_description>"
```

### Parameters

- **worker_count**: Number of parallel workers (1-10)
- **role**: Agent role for the workers
- **task_description**: Clear description of what to accomplish

## Output

The command will:
1. Create a tmux session for the team
2. Spawn the specified number of worker panes
3. Initialize each worker with the role and task
4. Return team information for monitoring

## Monitoring

After launching a team:
- Use `qmx team status <team-name>` to check progress
- Use `qmx team shutdown <team-name>` to stop the team
- Use `qmx hud --watch` for real-time monitoring

## Example Session

```
User: /team 3:executor "Implement the authentication module"

QMX: Creating team...
     ✔ Team "team-exec-auth-7a3b" created with 3 workers
     ✔ Team started successfully

     Team Info:
       Name: team-exec-auth-7a3b
       Role: executor
       Workers: 3
       Task: Implement the authentication module

     Monitor: qmx team status team-exec-auth-7a3b
     Stop: qmx team shutdown team-exec-auth-7a3b
```

## Requirements

- tmux >= 3.0
- QMX installed globally
- Node.js >= 20

## Troubleshooting

**"tmux not found"**
- Install tmux: `sudo apt install tmux`

**"Team mode requires tmux"**
- Make sure you're running in WSL or a tmux-compatible environment

**"Failed to create team"**
- Check tmux version: `tmux -V`
- Ensure no orphaned sessions: `qmx team cleanup`
