# QMX - Qwen Multi-agent eXtension

> Power tools for Qwen Code CLI: Transform single-session agents into coordinated multi-agent teams

[![npm version](https://img.shields.io/npm/v/qmx.svg)](https://www.npmjs.com/package/qmx)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node version](https://img.shields.io/node/v/qmx.svg)](https://nodejs.org/)

**Available in:** 🇺🇸 English | 🇨🇳 中文 | 🇯🇵 日本語 | 🇰🇷 한국어 | 🇩🇪 Deutsch | 🇫🇷 Français | 🇪🇸 Español | 🇧🇷 Português

## 🚀 Quick Start

```bash
# Install globally
npm install -g qmx

# Setup QMX for your project
qmx setup

# Check installation
qmx doctor

# Launch QMX-enhanced Qwen Code
qmx
```

## ✨ Features

### 🎭 Role-Based Agents (30+ Specialized Prompts)

Access specialized agents via `/prompts:name` command:

- `/prompts:architect` - System design and architecture review
- `/prompts:planner` - Task decomposition and planning
- `/prompts:executor` - Implementation and code generation
- `/prompts:debugger` - Bug investigation and fixes
- `/prompts:reviewer` - Code review and quality assurance
- `/prompts:security` - Security audit and vulnerability detection
- `/prompts:performance` - Performance optimization
- `/prompts:tester` - Test generation and validation
- ...and 22 more specialized roles

### ⚡ Workflow Skills (40+ Automation Patterns)

Trigger workflow skills with `$name` syntax:

- `$plan` - Decompose complex tasks into actionable steps
- `$team` - Launch parallel agent teams in tmux
- `$review` - Comprehensive code review workflow
- `$test` - Generate and run test suites
- `$refactor` - Safe refactoring with verification
- `$research` - Deep research with citation tracking
- `$ Ralph` - Methodical step-by-step implementation
- `$ultrawork` - High-throughput parallel execution
- ...and 32 more workflow patterns

### 🏢 Team Orchestration

Launch coordinated agent teams for parallel execution:

```bash
# From terminal
qmx team 4:executor "Fix all TypeScript errors in src/"
qmx team status my-team
qmx team shutdown my-team

# Inside Qwen Code
$team 3:reviewer "Review all PR changes"
$team-plan "Architectural refactor"
$team-exec "Implement authentication module"
$team-verify "Verify implementation against requirements"
$team-fix "Address verification findings"
```

### 🔌 Hook Extension System

Extend QMX with custom plugins:

```bash
# Initialize hooks directory
qmx hooks init

# Check hook status
qmx hooks status

# Validate hook plugins
qmx hooks validate

# Test hook execution
qmx hooks test
```

**Available hook events:**
- `session-start` - Triggered when QMX launches
- `session-end` - Triggered when session ends
- `session-idle` - Triggered after idle timeout
- `turn-complete` - Triggered after each agent turn

### 📊 HUD (Heads-Up Display)

Real-time monitoring of agent activities:

```bash
# Launch with HUD
qmx --hud

# Watch mode (separate terminal)
qmx hud --watch

# Status only
qmx status
```

### 🧠 Persistent State & Memory

QMX maintains project state across sessions:

- **Session state** - Track active teams, tasks, and execution modes
- **Project memory** - Persistent knowledge base in `.qmx/project-memory.json`
- **Code intelligence** - Symbol tracking and dependency analysis
- **Execution traces** - Full audit trail of agent actions

## 📦 Installation

### Requirements

- **OS:** macOS, Linux, or Windows (via WSL2)
- **Node.js:** >= 20.0.0
- **Qwen Code CLI:** Installed and authenticated
- **tmux:** Required for team mode (v3.0+)

### Quick Install

```bash
npm install -g qmx
qmx setup
qmx doctor
```

### Development Setup

```bash
git clone https://github.com/qmx/qmx.git
cd qmx
npm install
npm run build
npm test
```

## 📖 Usage

### Launch Commands

```bash
# Standard launch
qmx

# Launch with reasoning effort
qmx --high
qmx --xhigh

# Launch with YOLO mode (bypass approvals)
qmx --yolo

# Launch in specific project
qmx /path/to/project

# Dry run (simulate without executing)
qmx --dry-run

# Verbose output
qmx --verbose
```

### Inside Qwen Code

Once launched, use these commands inside Qwen Code:

```bash
# Use specialized agents
/prompts:architect "Analyze current authentication boundaries"
/prompts:executor "Implement input validation in login"
/prompts:reviewer "Review security implications"

# Trigger workflow skills
$plan "Ship OAuth callback safely"
$team 3:executor "Fix all TypeScript errors"
$review "Check for memory leaks"
$test "Generate unit tests for auth module"

# Team orchestration
$team-plan "Multi-module refactor"
$team-exec "Implement changes"
$team-verify "Verify against requirements"
$team-fix "Address issues"
```

### Team Mode Examples

```bash
# Launch a team of 4 executors for parallel refactoring
qmx team 4:executor "Refactor all API endpoints to use async/await"

# Check team status
qmx team status refactor-team-20240220

# Shutdown a team
qmx team shutdown refactor-team-20240220

# List all active teams
qmx team list
```

### Hook Plugin Example

Create `.qmx/hooks/my-plugin.mjs`:

```javascript
export const events = ['session-start', 'turn-complete'];

export async function sessionStart(sdk) {
  sdk.log.info('Session started!');
  await sdk.state.set('sessionStartTime', Date.now());
}

export async function turnComplete(sdk) {
  const state = await sdk.state.get();
  sdk.log.info(`Turn completed. Active tasks: ${state.activeTasks?.length || 0}`);
}
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User / Developer                      │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   QMX CLI (qmx)                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │  setup   │ │  doctor  │ │   team   │ │  hooks   │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│   Qwen Code CLI  │ │   tmux Session   │ │   MCP Servers    │
│   (multi_agent)  │ │   (team mode)    │ │   (state/memory) │
└──────────────────┘ └──────────────────┘ └──────────────────┘
        │                 │                 │
        ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────┐
│                  Project State (.qmx/)                    │
│  state/  plans/  logs/  project-memory.json  notepad.md  │
└─────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
qmx/
├── bin/
│   └── qmx.js                 # CLI entry point
├── src/
│   ├── cli/                   # CLI commands
│   │   ├── index.ts
│   │   ├── setup.ts
│   │   ├── doctor.ts
│   │   ├── team.ts
│   │   ├── hooks.ts
│   │   ├── hud.ts
│   │   ├── launch.ts
│   │   └── ...
│   ├── team/                  # Team orchestration
│   │   ├── runtime.ts
│   │   ├── orchestrator.ts
│   │   └── tmux-session.ts
│   ├── mcp/                   # MCP servers
│   │   ├── state-server.ts
│   │   ├── memory-server.ts
│   │   └── code-intel-server.ts
│   ├── hooks/                 # Hook system
│   │   └── extensibility/
│   │       ├── dispatcher.ts
│   │       └── sdk.ts
│   ├── hud/                   # Heads-up display
│   │   ├── index.ts
│   │   └── render.ts
│   ├── config/                # Configuration
│   │   └── generator.ts
│   ├── agents/                # Agent definitions
│   ├── modes/                 # Mode management
│   ├── notifications/         # Notifications
│   ├── state/                 # State utilities
│   ├── verification/          # Verification protocol
│   └── utils/                 # Utilities
├── prompts/                   # 30 agent prompts
├── skills/                    # 40 workflow skills
├── templates/                 # Templates
├── scripts/                   # Helper scripts
├── docs/                      # Documentation
└── tests/                     # Test suite
```

## 🎯 Available Agents

| Agent | Purpose | Command |
|-------|---------|---------|
| Architect | System design, boundaries | `/prompts:architect` |
| Planner | Task decomposition | `/prompts:planner` |
| Executor | Implementation | `/prompts:executor` |
| Debugger | Bug investigation | `/prompts:debugger` |
| Reviewer | Code review | `/prompts:reviewer` |
| Security | Security audit | `/prompts:security` |
| Performance | Optimization | `/prompts:performance` |
| Tester | Test generation | `/prompts:tester` |
| DevOps | CI/CD, deployment | `/prompts:devops` |
| TechWriter | Documentation | `/prompts:techwriter` |

## ⚙️ Configuration

Create `.qmx/config.toml` in your project:

```toml
[team]
default_workers = 3
timeout_minutes = 30
auto_shutdown = true

[hud]
enabled = true
refresh_rate_ms = 1000

[notifications]
tmux = true
discord = false
telegram = false

[reasoning]
default_effort = "medium"
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npx vitest tests/team/runtime.test.ts
```

## 📚 Documentation

- **[README.md](README.md)** - This file (available in 8 languages)
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Contribution guidelines
- **[COVERAGE.md](COVERAGE.md)** - Feature coverage report
- **[CHANGELOG.md](CHANGELOG.md)** - Version history
- **[DEMO.md](DEMO.md)** - Demo and examples
- **[AGENTS.md](AGENTS.md)** - Agent orchestration guide
- **[docs/hooks-extension.md](docs/hooks-extension.md)** - Hook plugin API

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- Inspired by [oh-my-claudecode](https://github.com/oh-my-claudecode/oh-my-claudecode)
- Built for the Qwen Code community
- Special thanks to all contributors

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/qmx/qmx/issues)
- **Discussions:** [GitHub Discussions](https://github.com/qmx/qmx/discussions)
- **Twitter:** [@qmx_dev](https://twitter.com/qmx_dev)

---

**Made with ❤️ for the Qwen Code community**
