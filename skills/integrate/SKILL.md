---
name: integrate
description: Third-party integration. Use when integrating external services or APIs.
---

# Integrate Skill

## Overview
**Type:** Workflow  
**Name:** integrate  
**Purpose:** Third-party integration workflow with testing and documentation

## Description
The integrate skill manages third-party service integrations, handling API connections, authentication, data mapping, and comprehensive testing to ensure reliable integrations.

## Usage

```
skill: "integrate"
```

### Parameters
- `service`: Third-party service to integrate
- `operations`: Required operations/endpoints
- `auth`: Authentication method required
- `testing`: Integration testing level

## Process

1. **Service Analysis**: Understand service capabilities
2. **Connection Setup**: Configure authentication and connection
3. **Data Mapping**: Map data structures between systems
4. **Implementation**: Implement integration code
5. **Testing**: Test all integration points
6. **Documentation**: Document integration details

## Output Structure

```
integrate-output/
├── integration-guide.md  # Integration documentation
├── config/               # Configuration files
├── adapters/             # Integration adapters
├── test-results.json     # Integration test results
└── api-mapping.json      # Data mapping documentation
```

## Integration

- **test**: Test integration endpoints
- **document**: Generate integration docs
- **secure**: Secure integration credentials
- **monitor**: Monitor integration health

## Best Practices

- Use secure credential storage
- Implement retry logic
- Handle rate limiting
- Log integration events
- Test error scenarios

## Related Skills

test, document, secure, monitor, verify, research
