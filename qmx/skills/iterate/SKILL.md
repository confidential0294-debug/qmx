# Iterate Skill

## Overview
**Type:** Workflow  
**Name:** iterate  
**Purpose:** Iterative development workflow with continuous improvement

## Description
The iterate skill manages iterative development cycles, incorporating feedback, making improvements, and tracking progress across iterations.

## Usage

```bash
skill: "iterate"
```

### Parameters
- `target`: What to iterate on
- `feedback`: Feedback to incorporate
- `improvements`: Planned improvements
- `cycles`: Number of iterations

## Process

1. **Current State Review**: Review current implementation
2. **Feedback Analysis**: Analyze feedback received
3. **Improvement Planning**: Plan improvements
4. **Implementation**: Implement improvements
5. **Validation**: Validate improvements
6. **Documentation**: Document iteration changes

## Output Structure

```
iterate-output/
├── iteration-plan.md     # Iteration plan
├── feedback-analysis.md  # Feedback analysis
├── changes/              # Changes made
├── validation.json       # Validation results
└── iteration-report.md   # Iteration summary
```

## Integration

- **prototype**: Iterate on prototypes
- **review**: Review iteration results
- **test**: Test iterations
- **enhance**: Enhance through iteration

## Best Practices

- Small, focused iterations
- Incorporate feedback quickly
- Validate each iteration
- Track iteration progress
- Know when to stop iterating

## Related Skills

prototype, review, test, enhance, improve, refine
