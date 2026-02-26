# QMX Custom `/team` Command - Installation Complete

## ✅ Installation Status

| Component | Location | Status |
|-----------|----------|--------|
| **team command** | `~/bin/team` | ✅ Installed (user) |
| **install script** | `~/install-team-sudo.sh` | ✅ Ready (for sudo) |
| **qmx binary** | `~/.local/bin/qmx` | ✅ Installed |
| **QMX source** | `~/qmx/` | ✅ Installed |

---

## 🚀 Current Installation (User-Level)

The `team` command is **already installed and working** in your user directory!

### Usage (No sudo required)

```bash
# Just run it directly - already in PATH
team 3:executor "Fix TypeScript errors"
```

### How it works

The command is installed in `~/bin/team` and your PATH includes `~/bin`, so you can use it immediately without sudo.

---

## 🔧 System-Wide Installation (Optional with sudo)

If you want the `team` command available for ALL users system-wide:

### Run this command:

```bash
sudo bash ~/install-team-sudo.sh
```

This will install `/team` to `/usr/local/bin/team` (system PATH).

---

## 📋 Usage Examples

### Basic Usage

```bash
# Launch a team
team 3:executor "Fix all TypeScript errors in src/"

# Different roles
team 4:reviewer "Review all open PRs"
team 2:tester "Write integration tests"
team 5:debugger "Debug the memory leak"
```

### Monitor Teams

```bash
# List all active teams
qmx team list

# Check specific team status
qmx team status team-exec-xxx

# Real-time monitoring
qmx hud watch
```

### Stop Teams

```bash
# Stop a specific team
qmx team shutdown team-exec-xxx

# Clean up all orphaned teams
qmx team cleanup
```

---

## 🔍 Verification

### Test the installation:

```bash
# Check if team command is available
which team

# Should show: /home/twisted/bin/team

# Test it
team 2:executor "Test command"

# Should launch a team successfully
```

### Expected Output:

```
🚀 Launching QMX Team...
   Workers: 2
   Role: executor
   Task: Test command

✔ Team "team-xxx" created with 2 workers
✔ Team started successfully

Team Info:
  Name: team-xxx
  Role: executor
  Workers: 2
```

---

## 📁 File Locations

| File | Purpose | Location |
|------|---------|----------|
| `team` | Team wrapper script | `~/bin/team` |
| `qmx` | QMX CLI | `~/.local/bin/qmx` |
| `install-team-sudo.sh` | Sudo install script | `~/install-team-sudo.sh` |
| `config.toml` | QMX config | `~/.qmx/config.toml` |

---

## 🔧 PATH Configuration

Your `~/.bashrc` has been updated with:

```bash
# QMX Team Command
export PATH="$HOME/bin:$HOME/.local/bin:$PATH"
```

This ensures `team` and `qmx` commands are always available.

### To apply changes:

```bash
source ~/.bashrc
```

---

## 🎯 In Qwen Code

When using Qwen Code in WSL, you can reference the team command:

### Option 1: Direct shell command

```bash
team 3:executor "Implement the feature"
```

### Option 2: Via QMX

```bash
qmx team start 3:executor "Implement the feature"
```

---

## 🐛 Troubleshooting

### "command not found: team"

```bash
# Check if in PATH
echo $PATH

# Should include ~/bin
# If not, run:
source ~/.bashrc

# Or use full path:
~/bin/team 3:executor "task"
```

### "tmux not found"

```bash
# Install tmux
sudo apt update
sudo apt install tmux

# Verify
tmux -V
```

### Team fails to start

```bash
# Check tmux sessions
tmux list-sessions

# Clean up orphaned
qmx team cleanup

# Try again
team 2:executor "test"
```

---

## 📊 Summary

| Feature | Status |
|---------|--------|
| User-level install | ✅ Complete |
| Works without sudo | ✅ Yes |
| In PATH | ✅ Yes |
| System-wide option | ✅ Available |
| tmux integration | ✅ Working |
| QMX integration | ✅ Working |

---

## 🎉 Ready to Use!

The `/team` custom command is **installed and ready** in your WSL environment!

```bash
# Start using it now:
team 3:executor "Your task here"
```

---

**Installation Date:** February 20, 2026  
**Version:** 1.0.0  
**Status:** ✅ Operational
