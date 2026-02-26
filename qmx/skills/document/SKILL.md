# Document Skill

## Overview
**Type:** Workflow  
**Name:** document  
**Purpose:** Documentation generation workflow with templates and quality checks

## Description
The document skill automates documentation creation and maintenance. It generates API docs, user guides, and technical documentation from code and specifications with consistent formatting.

## Usage

```bash
# Qwen Code slash command
/skill:document "task"

# Terminal command
document "task"
```

### Parameters
- `type`: Documentation type (api, user, technical)
- `source`: Source files or code to document
- `template`: Documentation template to use
- `output`: Output format and location

## Process

1. **Source Analysis**: Analyze code and extract documentation
2. **Structure Planning**: Plan documentation structure
3. **Content Generation**: Generate documentation content
4. **Template Application**: Apply formatting templates
5. **Quality Check**: Verify documentation quality
6. **Publish**: Output final documentation

## Output Structure

```
document-output/
├── api-reference/        # API documentation
├── guides/               # User guides
├── technical/            # Technical documentation
├── index.md              # Documentation index
└── quality-report.json   # Quality metrics
```

## Integration

- **review**: Review documentation quality
- **research**: Research documentation topics
- **ci**: Auto-generate docs in CI
- **release**: Include docs in releases

## Best Practices

- Keep docs close to code
- Use consistent templates
- Include examples
- Update with code changes
- Validate links and references

## Related Skills

/skill:review, /skill:research, /skill:ci, /skill:release, /skill:verify, /skill:audit
