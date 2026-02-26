---
name: compare
description: Solution comparison analysis. Use when comparing multiple approaches.
---

# Compare Skill

## Overview
**Type:** Workflow  
**Name:** compare  
**Purpose:** Solution comparison workflow with detailed analysis and recommendations

## Description
The compare skill evaluates multiple solutions, approaches, or implementations against defined criteria, providing detailed analysis and data-driven recommendations.

## Usage

```
skill: "compare"
```

### Parameters
- `options`: Solutions to compare
- `criteria`: Evaluation criteria
- `weights`: Criteria importance weights
- `depth`: Analysis depth level

## Process

1. **Option Definition**: Define options to compare
2. **Criteria Setup**: Establish evaluation criteria
3. **Data Collection**: Gather data on each option
4. **Analysis**: Evaluate against criteria
5. **Scoring**: Score and rank options
6. **Recommendation**: Provide recommendation with rationale

## Output Structure

```
compare-output/
├── comparison-matrix.json # Comparison matrix
├── analysis/             # Detailed analysis per option
├── scoring.json          # Scoring results
├── recommendation.md     # Final recommendation
└── trade-offs.md         # Trade-off analysis
```

## Integration

- **research**: Research options
- **benchmark**: Benchmark performance
- **prototype**: Prototype top options
- **plan**: Inform planning decisions

## Best Practices

- Define clear criteria
- Use objective measurements
- Consider trade-offs
- Document assumptions
- Validate recommendations

## Related Skills

research, benchmark, prototype, plan, evaluate, decide
