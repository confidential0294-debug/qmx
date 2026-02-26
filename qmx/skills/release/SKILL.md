# Release Skill

## Overview
**Type:** Workflow  
**Name:** release  
**Purpose:** Release preparation workflow with versioning and deployment coordination

## Description
The release skill manages software release processes including versioning, changelog generation, artifact building, and deployment coordination.

## Usage

```bash
skill: "release"
```

### Parameters
- `version`: Release version
- `type`: Release type (major, minor, patch)
- `artifacts`: Artifacts to build
- `deploy`: Deploy after release

## Process

1. **Version Bump**: Update version numbers
2. **Changelog**: Generate changelog
3. **Artifact Build**: Build release artifacts
4. **Quality Gates**: Run quality checks
5. **Tag Creation**: Create Git tags
6. **Deployment**: Deploy release

## Output Structure

```
release-output/
├── version-info.json     # Version information
├── changelog.md          # Release changelog
├── artifacts/            # Built artifacts
├── quality-report.json   # Quality gate results
└── release-notes.md      # Release notes
```

## Integration

- **changelog**: Generate changelog
- **deploy**: Deploy release
- **ci**: Run CI for release
- **document**: Update documentation

## Best Practices

- Follow semantic versioning
- Test before releasing
- Document breaking changes
- Tag releases properly
- Communicate releases

## Related Skills

changelog, deploy, ci, document, version, tag
