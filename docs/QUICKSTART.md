# QMX Quickstart Guide

Get up and running with QMX in 5 minutes!

## Prerequisites

- **Node.js** >= 20.0.0 ([install](https://nodejs.org))
- **Qwen Code CLI** installed and authenticated
- **tmux** >= 3.0 (for team mode, [install](https://github.com/tmux/tmux))

## Installation

### Option 1: Global Install (Recommended)

```bash
# Install QMX globally
npm install -g qmx

# Verify installation
qmx --version
```

### Option 2: Project Install

```bash
# Install in your project
cd your-project
npm install qmx

# Add to package.json scripts
{
  "scripts": {
    "qmx": "qmx"
  }
}
```

## First Steps

### 1. Setup Your Project

```bash
# Navigate to your project
cd your-project

# Initialize QMX
qmx setup
```

This creates:
- `.qmx/` directory with configuration
- `.qmx/config.toml` - Project settings
- `.qmx/project-memory.json` - Persistent knowledge
- `.qmx/hooks/example.mjs` - Example plugin

### 2. Verify Installation

```bash
# Run diagnostics
qmx doctor
```

Expected output:
```
🔍 QMX Doctor

✓ Node.js
  Node.js v20.10.0

✓ QMX Installation
  QMX found in dependencies

✓ tmux
  tmux 3.3a

✓ Project Configuration
  .qmx/config.toml found

✓ MCP Servers
  MCP server files found

==================================================
✓ All checks passed!
```

### 3. Launch QMX

```bash
# Standard launch
qmx

# Or with options
qmx --high        # High reasoning effort
qmx --verbose     # Verbose output
qmx --no-hud      # Disable HUD
```

## Using QMX

### Inside Qwen Code

Once launched, use these commands in Qwen Code:

#### Specialized Agents

```bash
# Architecture review
/prompts:architect "Review the current module structure"

# Task planning
/prompts:planner "Break down 'Implement OAuth2 authentication'"

# Implementation
/prompts:executor "Create a REST API endpoint for user creation"

# Debugging
/prompts:debugger "Fix the null pointer exception in auth service"

# Code review
/prompts:reviewer "Review the PR changes in src/api/"

# Security audit
/prompts:security "Check for SQL injection vulnerabilities"
```

#### Workflow Skills

```bash
# Plan a complex task
$plan "Migrate from MongoDB to PostgreSQL"

# Launch a team of parallel workers
$team 3:executor "Fix all TypeScript errors in src/"

# Comprehensive code review
$review "Review the authentication module"

# Generate tests
$test "Write unit tests for the payment service"

# Safe refactoring
$refactor "Extract utility functions from utils.js"
```

### From Terminal

#### Team Management

```bash
# Launch a team
qmx team 4:executor "Parallelize the API refactoring"

# Check team status
qmx team status team-20240220-exec-4

# List all teams
qmx team list

# Shutdown a team
qmx team shutdown team-20240220-exec-4
```

#### Hook Plugins

```bash
# Initialize hooks directory
qmx hooks init

# Check installed plugins
qmx hooks status

# Validate plugins
qmx hooks validate

# Test plugin execution
qmx hooks test
```

#### Monitoring

```bash
# Launch HUD watch mode
qmx hud --watch

# Check session status
qmx status

# Cancel active execution
qmx cancel
```

## Creating Your First Plugin

Create `.qmx/hooks/greeting.mjs`:

```javascript
// Simple greeting plugin

export const events = ['session-start'];

export async function sessionStart(sdk) {
  sdk.log.info('👋 Welcome to QMX!');
  sdk.log.info(`📁 Project: ${process.cwd().split('/').pop()}`);
  sdk.log.info(`🕐 Started: ${new Date().toLocaleString()}`);
  
  await sdk.notify('info', 'Session started successfully');
}
```

Test it:

```bash
# Restart QMX
qmx

# Check logs
cat .qmx/logs/session.log
```

## Common Workflows

### Workflow 1: Feature Implementation

```bash
# 1. Plan the feature
/prompts:planner "Implement user profile page with avatar upload"

# 2. Review the plan
$review "Review the implementation plan"

# 3. Execute with team
$team 3:executor "Implement the planned features"

# 4. Test the implementation
$test "Generate integration tests"

# 5. Final review
/prompts:reviewer "Review the complete implementation"
```

### Workflow 2: Bug Fixing

```bash
# 1. Investigate the bug
/prompts:debugger "Investigate the login failure on mobile"

# 2. Plan the fix
/prompts:planner "Create a fix plan for the identified issue"

# 3. Implement the fix
/prompts:executor "Implement the bug fix"

# 4. Verify the fix
$test "Write regression tests"

# 5. Security check
/prompts:security "Verify no security issues introduced"
```

### Workflow 3: Code Review

```bash
# 1. Automated review
$review "Comprehensive review of the PR"

# 2. Security audit
/prompts:security "Security review of changes"

# 3. Performance check
/prompts:performance "Check for performance issues"

# 4. Architecture review
/prompts:architect "Review architectural impact"
```

## Configuration

### Basic Configuration

Edit `.qmx/config.toml`:

```toml
# Team settings
[team]
default_workers = 3
timeout_minutes = 30
auto_shutdown = true

# HUD settings
[hud]
enabled = true
refresh_rate_ms = 1000

# Notification settings
[notifications]
tmux = true
discord = false
telegram = false

# Reasoning effort
[reasoning]
default_effort = "medium"
```

### Environment Variables

```bash
# Discord webhook for notifications
export DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...

# Telegram bot for notifications
export TELEGRAM_BOT_TOKEN=...
export TELEGRAM_CHAT_ID=...

# Custom configuration path
export QMX_CONFIG=/path/to/config.toml
```

## Troubleshooting

### "tmux not found"

```bash
# Install tmux
# macOS
brew install tmux

# Linux
sudo apt-get install tmux

# Windows (WSL2)
# Install inside WSL2
```

### "Node version too old"

```bash
# Check version
node --version

# Upgrade Node.js
# Use nvm (Node Version Manager)
nvm install 20
nvm use 20
```

### "QMX not found"

```bash
# Reinstall globally
npm uninstall -g qmx
npm install -g qmx

# Or use npx
npx qmx
```

### Team mode fails

```bash
# Check tmux version
tmux -V  # Should be >= 3.0

# Kill orphaned sessions
qmx team cleanup

# Check logs
cat .qmx/logs/team.log
```

## Next Steps

### Learn More

- [Full Documentation](README.md)
- [Architecture Guide](docs/ARCHITECTURE.md)
- [Hook Extension Guide](docs/hooks-extension.md)
- [Contributing Guide](CONTRIBUTING.md)

### Advanced Usage

- Create custom agent prompts
- Build workflow skills
- Develop hook plugins
- Configure MCP servers
- Set up team orchestration

### Get Help

- [GitHub Issues](https://github.com/qmx/qmx/issues)
- [Discussions](https://github.com/qmx/qmx/discussions)
- [Documentation](https://qmx.dev/docs)

## Quick Reference

### Commands

```bash
qmx                    # Launch QMX
qmx setup              # Initialize project
qmx doctor             # Check installation
qmx team N:role "task" # Launch team
qmx hooks status       # List plugins
qmx hud --watch        # Monitor sessions
qmx status             # Show active modes
qmx cancel             # Cancel execution
```

### Agent Prompts

```bash
/prompts:architect     # Architecture review
/prompts:planner       # Task planning
/prompts:executor      # Implementation
/prompts:debugger      # Bug fixing
/prompts:reviewer      # Code review
/prompts:security      # Security audit
```

### Workflow Skills

```bash
$plan                  # Create plan
$team                  # Launch team
$review                # Code review
$test                  # Generate tests
$refactor              # Refactor code
```

---

**Happy coding with QMX!** 🚀

For more help: `qmx --help` or visit https://qmx.dev
