# /skill:modernize - Legacy Code Modernization Skill

**Type:** Workflow Automation
**Purpose:** Transform legacy codebases to modern patterns, frameworks, and best practices

## Overview

The `/skill:modernize` skill systematically upgrades legacy code to modern standards, handling framework migrations, language updates, and architectural improvements with automated refactoring and validation.

## Usage

```bash
# Qwen Code slash command
/skill:modernize "target" --to "modern-pattern"

# Terminal command
modernize "src/" --to "typescript-strict"
modernize "lib/" --to "esm-modules"
modernize "components/" --to "react-hooks"
modernize "api/" --to "async-await"
modernize "tests/" --to "vitest"
```

## Process

When you invoke `/skill:modernize`, the following happens:

1. **Codebase Analysis**
   - Scan target files for legacy patterns
   - Identify modernization opportunities
   - Assess complexity and risk level
   - Generate migration plan

2. **Pattern Detection**
   - Detect outdated syntax and APIs
   - Identify deprecated libraries
   - Find anti-patterns and code smells
   - Map dependency relationships

3. **Transformation Planning**
   - Select appropriate modern patterns
   - Plan incremental migration steps
   - Identify breaking changes
   - Prepare rollback strategy

4. **Automated Refactoring**
   - Apply codemods and transformations
   - Update imports and dependencies
   - Modernize syntax and patterns
   - Preserve functionality and behavior

5. **Validation & Testing**
   - Run type checking
   - Execute test suite
   - Verify behavioral equivalence
   - Generate migration report

## Output Structure

Modernization state is tracked in `.qmx/modernization/{session-id}.json`:

```json
{
  "sessionId": "mod-20240220-001",
  "target": "src/",
  "targetPattern": "typescript-strict",
  "status": "completed",
  "startedAt": "2024-02-20T10:30:00Z",
  "completedAt": "2024-02-20T11:45:00Z",
  "files": {
    "analyzed": 150,
    "modified": 87,
    "skipped": 12,
    "failed": 3
  },
  "changes": [
    {
      "file": "src/auth/login.ts",
      "transformations": [
        "var-to-const",
        "callback-to-async",
        "commonjs-to-esm"
      ],
      "status": "completed"
    }
  ],
  "issues": [
    {
      "file": "src/legacy/old-module.js",
      "severity": "warning",
      "message": "Manual review required for dynamic imports"
    }
  ]
}
```

## Modernization Patterns

### Language Upgrades

| Pattern | Description | Example |
|---------|-------------|---------|
| `typescript-strict` | Enable strict TypeScript | `any` → typed generics |
| `esnext` | Latest ECMAScript features | Optional chaining, nullish coalescing |
| `async-await` | Modern async patterns | Callbacks → async/await |
| `esm-modules` | ES Module syntax | CommonJS → import/export |

### Framework Migrations

| Pattern | Description | Example |
|---------|-------------|---------|
| `react-hooks` | React Hooks migration | Class → Function components |
| `vue-composition` | Vue 3 Composition API | Options → Composition API |
| `angular-standalone` | Angular standalone | NgModules → Standalone |
| `express-fastify` | Express to Fastify | Express middleware → Fastify plugins |

### Architectural Improvements

| Pattern | Description | Example |
|---------|-------------|---------|
| `dependency-injection` | Add DI patterns | Global state → injected services |
| `repository-pattern` | Data access abstraction | Direct DB → repository layer |
| `cqs-separation` | Command/Query separation | Mixed handlers → CQS |
| `domain-driven` | DDD patterns | Anemic models → rich domain |

### Testing Frameworks

| Pattern | Description | Example |
|---------|-------------|---------|
| `vitest` | Migrate to Vitest | Jest → Vitest |
| `playwright` | E2E testing | Selenium → Playwright |
| `msw` | API mocking | Nock → MSW |
| `testing-library` | Component testing | Enzyme → Testing Library |

## Commands

### Terminal Commands

```bash
# Qwen Code slash command
/skill:modernize "src/" --to "typescript-strict"

# Terminal commands
qmx modernize "src/" --to "typescript-strict"
qmx modernize status <session-id>
qmx modernize preview <session-id>
qmx modernize apply <session-id>
qmx modernize rollback <session-id>
qmx modernize report <session-id>
```

### In-Session Commands

```bash
# Qwen Code slash command
/skill:modernize "src/" --to "react-hooks"

# Terminal commands
modernize "src/" --to "react-hooks"
modernize "src/" --analyze-only
modernize "src/" --to "esm" --rules "custom-rules.json"
modernize "src/" --to "typescript" --dry-run
```

## Modernization Lifecycle

```
analyzing → planning → transforming → validating → (completed | failed | rolled_back)
```

### Transitions

- **analyzing → planning**: Analysis complete, plan generated
- **planning → transforming**: Plan approved, starting transformations
- **transforming → validating**: All transformations applied
- **validating → completed**: All validations passed
- **any → failed**: Critical error occurred
- **any → rolled_back**: User requested rollback

## Configuration

Create `.qmx/modernize.config.json` for custom rules:

```json
{
  "patterns": {
    "typescript-strict": {
      "rules": {
        "noImplicitAny": true,
        "strictNullChecks": true,
        "noUnusedLocals": true
      },
      "exclude": ["**/*.test.ts", "**/legacy/**"]
    }
  },
  "codemods": {
    "custom": [
      {
        "name": "custom-transform",
        "path": "./codemods/custom.js"
      }
    ]
  },
  "validation": {
    "runTests": true,
    "runLint": true,
    "runTypecheck": true
  }
}
```

## Best Practices

1. **Version Control**: Always commit before modernization
2. **Incremental Approach**: Modernize in small, testable batches
3. **Test Coverage**: Ensure adequate tests before transformation
4. **Review Changes**: Manually review complex transformations
5. **Rollback Ready**: Keep rollback path clear

## Limitations

- Complex dynamic code may require manual intervention
- Some patterns need semantic understanding
- Cross-file dependencies tracked but may need review
- Large codebases should be modernized incrementally

## Error Handling

Common errors and solutions:

| Error | Cause | Solution |
|-------|-------|----------|
| `parse_error` | Invalid syntax | Fix syntax before modernizing |
| `type_mismatch` | Incompatible types | Add type annotations |
| `import_cycle` | Circular dependency | Refactor module structure |
| `validation_failed` | Tests failing | Review transformation |

## Integration

Works with:
- `$review` - Review modernization changes
- `$test` - Run validation tests
- `$refactor` - Additional refactoring
- `$migrate` - Database migrations

## Example Sessions

### TypeScript Migration

```bash
# Qwen Code slash command
/skill:modernize "src/" --to "typescript-strict"

# Terminal commands
modernize "src/" --to "typescript-strict"
qmx modernize preview mod-20240220-001
qmx modernize apply mod-20240220-001
qmx modernize validate mod-20240220-001
```

### React Hooks Migration

```bash
# Qwen Code slash command
/skill:modernize "src/components/" --to "react-hooks"

# Terminal commands
modernize "src/components/" --to "react-hooks"
modernize "src/components/" --to "react-hooks" --dry-run
modernize "src/components/" --to "react-hooks" --rules hooks-config.json
```

### ESM Migration

```bash
# Qwen Code slash command
/skill:modernize "src/" --to "esm-modules"

# Terminal commands
modernize "src/" --to "esm-modules"
qmx modernize update-package --type module
qmx modernize verify-imports
```

## Codemod Support

Custom codemods can be added for project-specific patterns:

```javascript
// codemods/custom-transform.js
export default function transformer(fileInfo, api) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);
  
  // Custom transformation logic
  root.find(j.VariableDeclaration, {
    kind: 'var'
  }).forEach(path => {
    path.node.kind = 'const';
  });
  
  return root.toSource();
}
```

## Metrics Tracked

- Files analyzed/modified/skipped
- Transformation success rate
- Time per transformation
- Validation pass rate
- Rollback frequency

## Related Skills

- `/skill:refactor` - Safe refactoring operations
- `/skill:migrate` - Database and data migrations
- `/skill:review` - Code review and validation
- `/skill:test` - Test generation and execution
