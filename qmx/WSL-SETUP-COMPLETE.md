# ✅ QMX Fully Configured in WSL for Qwen Code

## Configuration Complete

QMX is now properly configured and integrated with Qwen Code in WSL.

---

## 📁 Locations

| Component | Location | Status |
|-----------|----------|--------|
| **Qwen Root (WSL)** | `/home/twisted/.qwen/` | ✅ |
| **Qwen Settings** | `/home/twisted/.qwen/settings.json` | ✅ Configured |
| **QMX Install** | `/home/twisted/qmx/` | ✅ |
| **QMX MCP** | `/home/twisted/qmx/dist/mcp/` | ✅ 4 servers |
| **team command** | `/home/twisted/bin/team` | ✅ |
| **qmx command** | `/home/twisted/.local/bin/qmx` | ✅ |

---

## 🔧 Qwen Settings (WSL)

The `~/.qwen/settings.json` now includes:

```json
{
  "mcpServers": {
    "qmx-state": {
      "command": "node",
      "args": ["/home/twisted/qmx/dist/mcp/state-server.js"]
    },
    "qmx-memory": {
      "command": "node",
      "args": ["/home/twisted/qmx/dist/mcp/memory-server.js"]
    },
    "qmx-code-intel": {
      "command": "node",
      "args": ["/home/twisted/qmx/dist/mcp/code-intel-server.js"]
    },
    "qmx-trace": {
      "command": "node",
      "args": ["/home/twisted/qmx/dist/mcp/trace-server.js"]
    }
  }
}
```

---

## 🚀 Usage in WSL

### 1. Set up environment

```bash
# Use Node.js 20
source ~/.nvm/nvm.sh && nvm use 20

# Add QMX to PATH
export PATH="$HOME/bin:$HOME/.local/bin:$PATH"
```

### 2. Use team command

```bash
# Launch a team
team 3:executor "Fix TypeScript errors"

# Monitor
qmx team status <team-name>

# Stop
qmx team shutdown <team-name>
```

### 3. Use QMX CLI

```bash
qmx --version      # 1.0.0
qmx doctor         # Check installation
qmx setup          # Initialize project
qmx status         # Session status
```

---

## 📋 Available Resources

### Agent Prompts (30)
Location: `~/qmx/prompts/`

Core agents:
- architect, planner, executor
- debugger, reviewer, security
- performance, tester, devops
- And 21 more

### Workflow Skills (39)
Location: `~/qmx/skills/`

Core skills:
- `$plan`, `$team`, `$review`
- `$test`, `$refactor`, `$debug`
- `$research`, `$ Ralph`, `$ultrawork`
- And 30 more

### MCP Servers (4)
Location: `~/qmx/dist/mcp/`

- state-server.js
- memory-server.js
- code-intel-server.js
- trace-server.js

---

## ✅ Verification

Run this in WSL:

```bash
# Load environment
source ~/.nvm/nvm.sh
nvm use 20
export PATH="$HOME/bin:$HOME/.local/bin:$PATH"

# Verify commands
which qmx        # /home/twisted/.local/bin/qmx
which team       # /home/twisted/bin/team

# Test QMX
qmx doctor

# Expected output:
# ✓ Node.js
# ✓ QMX Installation
# ✓ Project Configuration  
# ✓ MCP Servers
```

---

## 📖 Documentation

Documentation files in `~/.qwen/`:
- `QMX-WSL-README.md` - This guide
- `settings.json` - Qwen config with MCP

Documentation in `~/qmx/`:
- `README.md` - Main documentation
- `AGENTS.md` - Agent guide
- `COVERAGE.md` - Feature parity
- `MCP-INSTALLATION.md` - MCP setup
- `TEAM-COMMAND-INSTALLED.md` - Team usage

---

## 🎯 In Qwen Code

When using Qwen Code in WSL:

1. **MCP servers auto-connect** - All 4 QMX MCP servers
2. **Use /team command** - Launch agent teams
3. **Access prompts** - 30 specialized agents
4. **Access skills** - 39 workflow skills

### Example Qwen Code Session

```
User: /team 3:executor "Implement authentication"

QMX: 🚀 Launching QMX Team...
     ✔ Team created with 3 workers
     ✔ Team started
```

---

## 🔧 Troubleshooting

### "command not found: team"

```bash
export PATH="$HOME/bin:$HOME/.local/bin:$PATH"
```

### "Node.js version too old"

```bash
source ~/.nvm/nvm.sh && nvm use 20
```

### "MCP servers not connecting"

Check settings:
```bash
cat ~/.qwen/settings.json
```

Verify servers exist:
```bash
ls ~/qmx/dist/mcp/*.js
```

---

## 📊 Status Summary

| Component | Status |
|-----------|--------|
| Qwen folder (WSL) | ✅ `/home/twisted/.qwen/` |
| Qwen settings | ✅ MCP configured |
| QMX installed | ✅ `~/qmx/` |
| MCP servers | ✅ 4/4 available |
| team command | ✅ `~/bin/team` |
| qmx command | ✅ `~/.local/bin/qmx` |
| Agent prompts | ✅ 30 available |
| Workflow skills | ✅ 39 available |
| Documentation | ✅ Complete |

---

**QMX is fully configured and ready to use in WSL!** 🎉

---

*Setup Date: February 20, 2026*  
*Version: 1.0.0*  
*Status: Production Ready*
