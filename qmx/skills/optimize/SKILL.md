# Optimize Skill

## Overview
**Type:** Workflow  
**Name:** optimize  
**Purpose:** Performance optimization workflow with profiling and verification

## Description
The optimize skill identifies and resolves performance bottlenecks through systematic profiling, analysis, and targeted optimization with verification of improvements.

## Usage

```bash
skill: "optimize"
```

### Parameters
- `target`: Component to optimize
- `metrics`: Performance metrics to improve
- `constraints`: Optimization constraints
- `verify`: Verify improvements

## Process

1. **Baseline Measurement**: Establish performance baseline
2. **Profiling**: Profile to identify bottlenecks
3. **Analysis**: Analyze profiling results
4. **Optimization**: Apply targeted optimizations
5. **Verification**: Measure improvements
6. **Regression Check**: Ensure no regressions

## Output Structure

```
optimize-output/
├── baseline.json         # Baseline measurements
├── profile-results/      # Profiling data
├── optimizations.md      # Applied optimizations
├── improvements.json     # Improvement metrics
└── verification.md       # Verification report
```

## Integration

- **profile**: Detailed performance profiling
- **benchmark**: Compare before/after
- **test**: Verify no regressions
- **monitor**: Monitor optimized performance

## Best Practices

- Measure before optimizing
- Focus on bottlenecks
- Verify improvements
- Avoid premature optimization
- Document optimization decisions

## Related Skills

profile, benchmark, test, monitor, verify, refactor
