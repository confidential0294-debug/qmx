# QMX Architecture Overview

## System Design

QMX (Qwen Multi-agent eXtension) is built on a modular, extensible architecture that transforms Qwen Code from a single-session agent into a coordinated multi-agent system.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           User / Developer                               │
└─────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        QMX CLI (qmx command)                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  │  setup   │ │  doctor  │ │   team   │ │  hooks   │ │   hud    │     │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘     │
└─────────────────────────────────────────────────────────────────────────┘
                                      │
              ┌───────────────────────┼───────────────────────┐
              ▼                       ▼                       ▼
┌──────────────────────────┐ ┌──────────────────┐ ┌──────────────────────┐
│   Qwen Code CLI          │ │   tmux Session   │ │   MCP Servers        │
│   (multi_agent mode)     │ │   (team mode)    │ │   (state/memory)     │
│                          │ │                  │ │                      │
│  ┌────────────────────┐  │ │  ┌────────────┐  │ │  ┌────────────────┐  │
│  │ Agent Prompts (30) │  │ │  │  Workers   │  │ │  │ State Server   │  │
│  │ Workflow Skills 40 │  │ │  │  (panes)   │  │ │  │ Memory Server  │  │
│  └────────────────────┘  │ │  └────────────┘  │ │  │ Code Intel     │  │
└──────────────────────────┘ └──────────────────┘ └──────────────────────┘
              │                       │                       │
              └───────────────────────┼───────────────────────┘
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     Project State Directory (.qmx/)                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  │  state/  │ │  plans/  │ │  logs/   │ │  hooks/  │ │  mcp/    │     │
│  │ sessions │ │  plans   │ │  *.log   │ │  *.mjs   │ │  *.json  │     │
│  │  teams   │ │          │ │          │ │          │ │          │     │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘     │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────┐     │
│  │              project-memory.json (persistent)                │     │
│  │  - Architecture  - Decisions  - Knowledge  - Conventions     │     │
│  └──────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. CLI Layer (`bin/`, `src/cli/`)

**Responsibility**: User interaction, command parsing, lifecycle management

**Key Modules**:
- `setup.ts` - Project initialization
- `doctor.ts` - Installation diagnostics
- `team.ts` - Team management
- `hooks.ts` - Plugin management
- `launch.ts` - Qwen Code launch with overlay

**Design Patterns**:
- Command pattern for CLI commands
- Options pattern for configuration
- Factory pattern for command creation

### 2. Agent System (`prompts/`, `src/agents/`)

**Responsibility**: Specialized agent behaviors and role definitions

**Structure**:
```
prompts/
├── architect.md      # System design
├── planner.md        # Task decomposition
├── executor.md       # Implementation
├── debugger.md       # Bug fixing
├── reviewer.md       # Code review
├── security.md       # Security audit
└── ... (24 more)
```

**Integration**: Accessed via `/prompts:name` syntax in Qwen Code

### 3. Workflow Skills (`skills/`, `src/modes/`)

**Responsibility**: Automated workflow patterns

**Structure**:
```
skills/
├── plan/
│   └── SKILL.md      # Planning workflow
├── team/
│   └── SKILL.md      # Team orchestration
├── review/
│   └── SKILL.md      # Code review workflow
└── ... (37 more)
```

**Trigger Syntax**: `$skillName` in Qwen Code

### 4. Team Orchestration (`src/team/`)

**Responsibility**: Parallel agent coordination via tmux

**Key Modules**:
- `runtime.ts` - Team lifecycle management
- `orchestrator.ts` - Task distribution
- `tmux-session.ts` - tmux abstraction

**Team Lifecycle**:
```
created → starting → running → (completed | failed | cancelled)
```

**Worker States**:
```
pending → running → (completed | failed)
```

### 5. MCP Servers (`src/mcp/`)

**Responsibility**: Standardized state and memory management

**Servers**:

#### State Server (`state-server.ts`)
- Session state tracking
- Team state management
- Task coordination with optimistic locking
- Tools: `session_*`, `team_*`, `task_*`

#### Memory Server (`memory-server.ts`)
- Persistent project knowledge
- Architectural decision records
- Convention tracking
- Tools: `project_memory_*`

#### Code Intel Server (`code-intel-server.ts`)
- Symbol tracking
- Dependency analysis
- Type information (via tsc)

**Protocol**: Model Context Protocol (MCP)

### 6. Hook System (`src/hooks/`, `.qmx/hooks/`)

**Responsibility**: Extensibility via plugins

**Architecture**:
```
┌─────────────────────────────────────────┐
│         Event Dispatcher                │
│  ┌──────────────────────────────────┐   │
│  │  Event Queue                     │   │
│  └──────────────────────────────────┘   │
│           │                             │
│     ┌─────┴─────┐                       │
│     ▼           ▼                       │
│  Plugin 1    Plugin 2                   │
└─────────────────────────────────────────┘
```

**Event Types**:
- Lifecycle: `session-start`, `session-end`
- Activity: `turn-complete`, `task-completed`
- Team: `team-created`, `team-completed`

**Plugin API**:
```javascript
export const events = ['session-start', 'turn-complete'];

export async function sessionStart(sdk) {
  sdk.log.info('Session started');
  await sdk.state.set('startTime', Date.now());
}
```

### 7. HUD System (`src/hud/`)

**Responsibility**: Real-time monitoring display

**Components**:
- `index.ts` - HUD lifecycle
- `render.ts` - Display rendering
- `components/` - UI components

**Display Modes**:
- Session overview
- Team status
- Active modes
- Recent activity

### 8. Configuration (`src/config/`, `.qmx/`)

**Configuration Files**:
- `config.toml` - User configuration
- `project-memory.json` - Persistent knowledge
- `state/*.json` - Runtime state

**Configuration Hierarchy**:
1. Default values
2. Global config (`~/.qmx/config.toml`)
3. Project config (`.qmx/config.toml`)
4. Environment variables
5. CLI flags

## Data Flow

### Session Launch Flow

```
1. User runs `qmx`
2. CLI.preLaunch() executes:
   - Validate environment
   - Load configuration
   - Initialize MCP servers
   - Create session state
3. Generate Qwen Code overlay config
4. Launch Qwen Code with multi_agent mode
5. CLI.postLaunch() executes:
   - Start HUD (if enabled)
   - Trigger session-start hooks
   - Begin idle monitoring
```

### Team Execution Flow

```
1. User triggers `$team N:role "task"`
2. Team Orchestrator:
   - Creates tmux session
   - Spawns N worker panes
   - Distributes tasks
3. Workers execute in parallel:
   - Claim tasks (optimistic locking)
   - Execute with assigned role
   - Report progress
4. Orchestrator monitors:
   - Track completion
   - Handle failures
   - Merge results
5. Shutdown and cleanup
```

### Hook Event Flow

```
1. Event detected (e.g., session-start)
2. Dispatcher loads plugins:
   - Scan .qmx/hooks/
   - Load matching plugins
   - Sort by priority
3. Execute handlers sequentially:
   - Call plugin handler
   - Catch and log errors
   - Continue to next plugin
4. Record execution results
5. Update session state
```

## State Management

### State Layers

```
┌─────────────────────────────────┐
│  Ephemeral State (RAM)          │
│  - Current session data         │
│  - Active team states           │
│  - In-memory caches             │
└─────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│  Persistent State (Disk)        │
│  - .qmx/state/sessions/*.json   │
│  - .qmx/state/teams/*.json      │
│  - .qmx/project-memory.json     │
└─────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│  External State (MCP)           │
│  - MCP server state             │
│  - Cross-session coordination   │
└─────────────────────────────────┘
```

### Concurrency Control

**File Locking**: `proper-lockfile` for atomic writes
**Optimistic Locking**: Version numbers for task claims
**Idempotent Operations**: Safe retry on failures

## Security Considerations

### Trust Boundaries

```
┌─────────────────────────────────────────┐
│  Trusted: User input, project files     │
│  Semi-Trusted: Hook plugins             │
│  Untrusted: External APIs, network      │
└─────────────────────────────────────────┘
```

### Protections

- Input validation for all shell commands
- File path sanitization
- Plugin sandboxing (planned)
- Secret masking in logs

## Performance Optimizations

- Lazy loading of plugins
- Debounced state writes
- Efficient tmux pane management
- Minimal dependencies (1 runtime dep)

## Extensibility Points

1. **Agent Prompts**: Add new roles in `prompts/`
2. **Workflow Skills**: Add new skills in `skills/`
3. **Hook Plugins**: Add plugins in `.qmx/hooks/`
4. **MCP Tools**: Extend servers in `src/mcp/`
5. **CLI Commands**: Add commands in `src/cli/`

## Testing Strategy

```
┌─────────────────────────────────────────┐
│  Unit Tests (70% coverage)              │
│  - Individual functions                 │
│  - Pure functions preferred             │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  Integration Tests                      │
│  - MCP server communication             │
│  - Team orchestration                   │
│  - Hook execution                       │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  E2E Tests                              │
│  - Full workflow execution              │
│  - Real tmux sessions                   │
│  - Actual Qwen Code integration         │
└─────────────────────────────────────────┘
```

## Future Enhancements

### Planned
- Full LSP integration (not tsc wrappers)
- Web-based dashboard
- Plugin marketplace
- Native Windows support (PowerShell jobs)
- Distributed team mode (multi-machine)
- Enhanced security sandboxing

### Under Consideration
- GraphQL API for state access
- Real-time collaboration features
- AI-powered plugin suggestions
- Performance profiling tools

## Design Principles

1. **Modularity**: Each component has single responsibility
2. **Extensibility**: Prefer extension over modification
3. **Observability**: Comprehensive logging and monitoring
4. **Resilience**: Graceful degradation on failures
5. **Simplicity**: Minimal dependencies, clear APIs
6. **Security**: Defense in depth, least privilege
