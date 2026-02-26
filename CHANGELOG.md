# Changelog

All notable changes to QMX will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Team orchestration with tmux
- MCP servers for state management
- Hook extension system
- 30+ specialized agent prompts
- 40+ workflow skills
- HUD (Heads-Up Display)
- Persistent project memory

## [1.0.0] - 2026-02-20

### Added

#### Core Features
- **Multi-agent orchestration layer** for Qwen Code CLI
- **Team mode** with tmux-based parallel execution
- **MCP servers** for state and memory management
- **Hook extension system** for custom plugins
- **HUD** for real-time monitoring

#### CLI Commands
- `qmx` - Launch QMX-enhanced Qwen Code
- `qmx setup` - Initialize QMX for project
- `qmx doctor` - Diagnose installation issues
- `qmx team` - Team management commands
- `qmx hooks` - Hook plugin management
- `qmx hud` - HUD display controls
- `qmx status` - Show active modes
- `qmx cancel` - Cancel active executions
- `qmx reasoning` - Set reasoning effort

#### Agent Prompts (30)
- `/prompts:architect` - System architecture specialist
- `/prompts:planner` - Task decomposition specialist
- `/prompts:executor` - Implementation specialist
- `/prompts:debugger` - Bug investigation specialist
- `/prompts:reviewer` - Code review specialist
- `/prompts:security` - Security audit specialist
- `/prompts:performance` - Performance optimization
- `/prompts:tester` - Test generation specialist
- `/prompts:devops` - CI/CD specialist
- `/prompts:techwriter` - Documentation specialist
- And 20 more specialized roles

#### Workflow Skills (40)
- `$plan` - Task decomposition and planning
- `$team` - Parallel team orchestration
- `$review` - Comprehensive code review
- `$test` - Test generation and execution
- `$refactor` - Safe refactoring workflow
- `$research` - Deep research with citations
- `$ Ralph` - Methodical implementation
- `$ultrawork` - High-throughput execution
- And 32 more workflow patterns

#### MCP Servers
- **State Server** - Session and team state management
- **Memory Server** - Persistent project knowledge
- **Code Intel Server** - Symbol tracking and analysis

#### Hook Events
- `session-start` - Triggered on session launch
- `session-end` - Triggered on session termination
- `session-idle` - Triggered after idle timeout
- `turn-complete` - Triggered after each agent turn
- `team-created` - Triggered when team launches
- `team-completed` - Triggered when team finishes
- `task-claimed` - Triggered when worker claims task
- `task-completed` - Triggered when task completes

#### Documentation
- Comprehensive README (8 languages)
- CONTRIBUTING.md with development guidelines
- Hook extension guide with examples
- Architecture documentation
- API reference documentation

#### Testing
- Unit tests for core modules
- Integration tests for MCP servers
- Team runtime tests
- 57 test files total

### Technical Details
- **TypeScript** with strict mode
- **ESM modules** for modern JavaScript
- **Proper locking** for concurrent state access
- **Error handling** with custom error types
- **Logging** with multiple levels
- **Configuration** via TOML files

### System Requirements
- Node.js >= 20.0.0
- tmux >= 3.0 (for team mode)
- macOS, Linux, or Windows (WSL2)

### Known Limitations
- Team mode requires tmux (not available natively on Windows)
- LSP implementation uses tsc wrappers (full LSP planned)
- Some timeouts are hardcoded (configurable in future)

---

## Version History

### Version Numbering
- **Major**: Breaking changes
- **Minor**: New features (backwards compatible)
- **Patch**: Bug fixes and minor improvements

### Release Schedule
- Major releases: Quarterly
- Minor releases: Monthly
- Patch releases: As needed

---

**Note**: This is the initial release of QMX. Future versions will include:
- Full LSP integration
- Web-based dashboard
- Plugin marketplace
- Enhanced Windows support
- Additional agent roles and skills

[Unreleased]: https://github.com/qmx/qmx/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/qmx/qmx/releases/tag/v1.0.0
