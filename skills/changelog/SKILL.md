---
name: changelog
description: Changelog generation. Use when generating changelogs.
---

# Changelog Skill

## Overview
**Type:** Workflow  
**Name:** changelog  
**Purpose:** Changelog generation workflow with automatic commit parsing and categorization

## Description
The changelog skill automatically generates changelogs from commit history, categorizing changes and formatting them according to standards.

## Usage

```
skill: "changelog"
```

### Parameters
- `range`: Commit range to process
- `format`: Changelog format (keepachangelog, custom)
- `categories`: Change categories to include
- `since`: Generate since specific version

## Process

1. **Commit Analysis**: Parse commit history
2. **Categorization**: Categorize changes by type
3. **Formatting**: Format changelog entries
4. **Deduplication**: Remove duplicate entries
5. **Version Grouping**: Group by version
6. **Output**: Generate changelog file

## Output Structure

```
changelog-output/
├── CHANGELOG.md          # Main changelog
├── unreleased.md         # Unreleased changes
├── categories/           # Changes by category
└── summary.json          # Change statistics
```

## Integration

- **release**: Include in releases
- **document**: Update documentation
- **review**: Review changelog quality
- **ci**: Auto-generate in CI

## Best Practices

- Follow changelog standards
- Categorize changes clearly
- Include breaking changes prominently
- Link to issues/PRs
- Keep updated regularly

## Related Skills

release, document, review, ci, version, git
