# QMX Installation Complete ✅

## Status: FULLY OPERATIONAL

QMX (Qwen Multi-agent eXtension) is now installed and configured in WSL with tmux support.

---

## Installation Summary

| Component | Status | Details |
|-----------|--------|---------|
| **QMX Core** | ✅ Installed | v1.0.0 in ~/qmx |
| **Global Binary** | ✅ Installed | ~/.local/bin/qmx |
| **Team Command** | ✅ Installed | ~/bin/team |
| **tmux** | ✅ Available | v3.4 |
| **Node.js** | ✅ Available | v20.20.0 |

---

## Quick Start

### 1. Load PATH (if not already loaded)

```bash
export PATH="$HOME/.local/bin:$HOME/bin:$PATH"
```

### 2. Verify Installation

```bash
qmx --version      # Should show: 1.0.0
team               # Should show usage help
```

### 3. Launch a Team

```bash
# Using the team command
team 3:executor "Fix all TypeScript errors in src/"

# Or using qmx directly
qmx team start 3:executor "Fix all TypeScript errors"
```

---

## Available Commands

### QMX Core Commands

```bash
qmx                    # Launch QMX
qmx setup              # Initialize project
qmx doctor             # Check installation
qmx status             # Show session status
qmx cancel             # Cancel executions
qmx reasoning high     # Set reasoning level
```

### Team Commands

```bash
team 3:executor "task"     # Launch team (shortcut)
qmx team start 3:executor "task"  # Launch team (full)
qmx team list              # List all teams
qmx team status <name>     # Check team status
qmx team shutdown <name>   # Stop a team
qmx team cleanup           # Remove orphaned teams
```

### HUD Commands

```bash
qmx hud status         # Show HUD snapshot
qmx hud watch          # Real-time monitoring
qmx hud teams          # Show all teams
qmx hud logs           # View recent logs
```

---

## Usage Examples

### Example 1: Fix Bugs

```bash
# Launch a team of debuggers
team 4:debugger "Fix all critical bugs in the backlog"

# Monitor progress
qmx team status team-debug-xxx

# When done, shutdown
qmx team shutdown team-debug-xxx
```

### Example 2: Code Review

```bash
# Launch reviewer team
team 3:reviewer "Review all changes in the last sprint"

# Watch in real-time
qmx hud watch
```

### Example 3: Implementation

```bash
# Launch executor team
team 5:executor "Implement the authentication module"

# Check status
qmx team status team-exec-auth-xxx
```

---

## Configuration

### PATH Setup (Permanent)

Add to `~/.bashrc`:

```bash
export PATH="$HOME/.local/bin:$HOME/bin:$PATH"
```

Then reload:

```bash
source ~/.bashrc
```

### QMX Configuration

Create `~/.qmx/config.toml`:

```toml
[team]
default_workers = 3
timeout_minutes = 30
auto_shutdown = true

[hud]
enabled = true
refresh_rate_ms = 1000

[reasoning]
default_effort = "medium"
```

---

## Troubleshooting

### "command not found: qmx"

```bash
# Check PATH
echo $PATH

# Should include ~/.local/bin and ~/bin
# If not, add to ~/.bashrc and reload
```

### "tmux not found"

```bash
# Install tmux
sudo apt update && sudo apt install tmux

# Verify
tmux -V
```

### "Node.js version too old"

```bash
# Using nvm
nvm install 20
nvm use 20

# Make default
nvm alias default 20
```

### Team fails to start

```bash
# Check tmux sessions
tmux list-sessions

# Clean up orphaned sessions
qmx team cleanup

# Try again
team 2:executor "Test"
```

---

## File Locations

| File | Location |
|------|----------|
| QMX Source | `~/qmx/` |
| QMX Binary | `~/.local/bin/qmx` |
| Team Command | `~/bin/team` |
| Config | `~/.qmx/config.toml` |
| State | `~/.qmx/state/` |
| Logs | `~/.qmx/logs/` |
| Hooks | `~/.qmx/hooks/` |

---

## Architecture

```
┌─────────────────────────────────────────┐
│         Qwen Code Chat                  │
│   /team 3:executor "task"               │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│         team command (wrapper)          │
│   ~/bin/team                            │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│         qmx CLI                         │
│   ~/.local/bin/qmx                      │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│         tmux Session                    │
│   ┌───────┐ ┌───────┐ ┌───────┐        │
│   │Worker1│ │Worker2│ │Worker3│        │
│   └───────┘ └───────┘ └───────┘        │
└─────────────────────────────────────────┘
```

---

## Resources

- **Documentation**: `~/qmx/docs/`
- **Agent Prompts**: `~/qmx/prompts/`
- **Workflow Skills**: `~/qmx/skills/`
- **Team Command Docs**: `~/qmx/docs/TEAM-COMMAND.md`

---

## Next Steps

1. **Test the installation**
   ```bash
   team 2:executor "Test command"
   ```

2. **Explore available agents**
   ```bash
   ls ~/qmx/prompts/
   ```

3. **Create custom hooks**
   ```bash
   qmx hooks init
   ```

4. **Read the documentation**
   ```bash
   cat ~/qmx/README.md
   ```

---

## Support

- **Issues**: Check `~/qmx/docs/`
- **Commands**: `qmx --help`
- **Team**: `team` (shows usage)

---

**Installation Date:** February 20, 2026  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
