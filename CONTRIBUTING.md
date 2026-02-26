# Contributing to QMX

Thank you for your interest in contributing to QMX! This document provides guidelines and instructions for contributing.

## 🌟 How to Contribute

### Reporting Bugs

Before creating bug reports, please check existing issues. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce**
- **Expected vs actual behavior**
- **Environment details** (OS, Node version, QMX version)
- **Screenshots or logs** if applicable

**Example:**
```markdown
**Bug**: Team mode fails to start on Windows WSL2

**Steps to Reproduce:**
1. Run `qmx team 3:executor "test"`
2. See error "tmux not found"

**Expected:** Team should start with 3 workers
**Actual:** Error thrown

**Environment:**
- OS: Windows 11 WSL2 Ubuntu 22.04
- Node: v20.10.0
- QMX: v1.0.0
```

### Suggesting Features

Feature suggestions are welcome! Please provide:

- **Use case**: Why is this feature needed?
- **Proposed solution**: How should it work?
- **Alternatives considered**: What other approaches?
- **Additional context**: Screenshots, examples, etc.

### Pull Requests

1. **Fork** the repository
2. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Run tests**:
   ```bash
   npm test
   npm run lint
   ```
5. **Commit** with clear messages:
   ```bash
   git commit -m "feat: add amazing feature"
   ```
6. **Push** to your fork:
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

## 📋 Development Setup

### Prerequisites

- Node.js >= 20.0.0
- npm or yarn
- Git
- tmux (for team mode development)

### Installation

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/qmx.git
cd qmx

# Install dependencies
npm install

# Build TypeScript
npm run build

# Link globally (optional)
npm link
```

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npx vitest tests/team/runtime.test.ts

# Watch mode
npm run test:watch
```

### Linting

```bash
# Check linting
npm run lint

# Fix auto-fixable issues
npm run lint:fix
```

## 🏗️ Code Structure

```
qmx/
├── bin/                 # CLI entry point
├── src/
│   ├── cli/            # CLI commands
│   ├── team/           # Team orchestration
│   ├── mcp/            # MCP servers
│   ├── hooks/          # Hook system
│   ├── hud/            # HUD display
│   ├── config/         # Configuration
│   ├── agents/         # Agent definitions
│   └── utils/          # Utilities
├── prompts/            # Agent prompts
├── skills/             # Workflow skills
├── docs/               # Documentation
└── tests/              # Tests
```

## 📝 Coding Guidelines

### TypeScript

- Use strict mode
- Define explicit types (avoid `any`)
- Use interfaces for object shapes
- Export types for public APIs

```typescript
// Good
interface TeamConfig {
  name: string;
  workerCount: number;
}

export async function createTeam(config: TeamConfig): Promise<TeamState> {
  // Implementation
}

// Bad
export async function createTeam(config: any): Promise<any> {
  // Implementation
}
```

### Error Handling

- Use custom error classes
- Include context in error messages
- Handle errors at appropriate boundaries

```typescript
// Good
class TeamError extends Error {
  constructor(message: string, public readonly teamName: string) {
    super(`[Team:${teamName}] ${message}`);
    this.name = 'TeamError';
  }
}

throw new TeamError('Failed to start worker', teamName);

// Bad
throw new Error('Something went wrong');
```

### Testing

- Write tests for new features
- Test edge cases
- Use descriptive test names
- Mock external dependencies

```typescript
// Good
describe('createTeam', () => {
  it('should create team with specified worker count', async () => {
    const team = await createTeam({ name: 'test', workerCount: 3 });
    expect(team.workers).toHaveLength(3);
  });

  it('should throw error if tmux not available', async () => {
    await expect(createTeam({ name: 'test', workerCount: 3 }))
      .rejects
      .toThrow('tmux not available');
  });
});
```

### Documentation

- Document public APIs with JSDoc
- Include examples in documentation
- Keep README up to date
- Add inline comments for complex logic

```typescript
/**
 * Create a new team with specified workers.
 * 
 * @param config - Team configuration
 * @param config.name - Team name (used for tmux session)
 * @param config.workerCount - Number of parallel workers
 * @param config.role - Agent role for workers
 * 
 * @returns Promise resolving to team state
 * 
 * @throws {TeamError} If tmux is not available
 * @throws {TeamError} If worker creation fails
 * 
 * @example
 * ```typescript
 * const team = await createTeam({
 *   name: 'refactor-team',
 *   workerCount: 4,
 *   role: 'executor'
 * });
 * ```
 */
export async function createTeam(config: TeamConfig): Promise<TeamState> {
  // Implementation
}
```

## 🎯 Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Test changes
- `chore:` Maintenance tasks

**Examples:**
```bash
feat: add team shutdown command
fix: resolve race condition in task claiming
docs: update README with installation steps
refactor: extract team validation logic
test: add integration tests for MCP servers
```

## 📦 Pull Request Checklist

Before submitting your PR, ensure:

- [ ] Tests pass (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Code is formatted (`npm run format`)
- [ ] Documentation is updated
- [ ] Commit messages follow convention
- [ ] Branch is up to date with `main`
- [ ] Changes are tested locally

## 🚀 Release Process

Releases are managed by maintainers:

1. Version bump in `package.json`
2. Update `CHANGELOG.md`
3. Create git tag
4. Publish to npm
5. Create GitHub release

## 💬 Community

- **Discussions**: [GitHub Discussions](https://github.com/qmx/qmx/discussions)
- **Issues**: [GitHub Issues](https://github.com/qmx/qmx/issues)
- **Twitter**: [@qmx_dev](https://twitter.com/qmx_dev)

## 📜 Code of Conduct

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone.

### Our Standards

Examples of behavior that contributes to a positive environment:

- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community

Examples of unacceptable behavior:

- The use of sexualized language or imagery
- Trolling, insulting/derogatory comments
- Public or private harassment
- Publishing others' private information

### Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be reported to the project maintainers.

## 🙏 Acknowledgments

We appreciate all contributions, big or small! Every contribution helps make QMX better for everyone.

---

**Questions?** Feel free to open an issue or start a discussion.
