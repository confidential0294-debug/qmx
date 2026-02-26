# QMX Team Command for Qwen Code

## Installation

### 1. Copy to WSL

```bash
wsl bash -c "mkdir -p ~/bin && cp /mnt/c/Users/Twisted/.qwen/tmp/qmx/scripts/team ~/bin/ && chmod +x ~/bin/team"
```

### 2. Add to PATH

Add to `~/.bashrc`:
```bash
export PATH="$HOME/bin:$HOME/.local/bin:$PATH"
```

Then reload:
```bash
source ~/.bashrc
```

## Usage in Qwen Code

### Direct Command

Type in Qwen Code chat:
```
/team 3:executor "Implement the authentication module"
```

### Via Shell Command

```bash
team 3:executor "Implement the authentication module"
```

## Quick Reference

```bash
# Launch a team
team 3:executor "Fix all TypeScript errors"
team 4:reviewer "Review all PRs"
team 2:tester "Write integration tests"

# Monitor teams
qmx team list
qmx team status <team-name>

# Stop teams
qmx team shutdown <team-name>
qmx team cleanup
```

## Example Workflow

```bash
# 1. Launch team for implementation
team 3:executor "Implement user registration API"

# 2. Check status
qmx team status team-exec-user-reg-xxx

# 3. Monitor progress
qmx hud --watch

# 4. When done, shutdown
qmx team shutdown team-exec-user-reg-xxx
```
