# Benchmark Skill

## Overview
**Type:** Workflow  
**Name:** benchmark  
**Purpose:** Benchmarking workflow with comparison and trend analysis

## Description
The benchmark skill establishes performance baselines, runs comparative benchmarks, and tracks performance trends over time for informed optimization decisions.

## Usage

```bash
# Qwen Code slash command
/skill:benchmark "task"

# Terminal command
benchmark "task"
```

### Parameters
- `scenarios`: Benchmark scenarios to run
- `baseline`: Baseline to compare against
- `iterations`: Number of iterations
- `metrics`: Metrics to track

## Process

1. **Scenario Definition**: Define benchmark scenarios
2. **Environment Setup**: Prepare benchmark environment
3. **Baseline Run**: Run baseline benchmarks
4. **Comparison Run**: Run comparison benchmarks
5. **Analysis**: Analyze performance differences
6. **Trend Tracking**: Update performance trends

## Output Structure

```
benchmark-output/
├── results.json          # Benchmark results
├── comparisons.md        # Comparison analysis
├── trends/               # Trend data
├── charts/               # Visual charts
└── summary.md            # Benchmark summary
```

## Integration

- **profile**: Deep dive into bottlenecks
- **optimize**: Validate optimizations
- **test**: Performance regression tests
- **monitor**: Track production performance

## Best Practices

- Use consistent environments
- Run multiple iterations
- Control variables
- Track trends over time
- Document benchmark methodology

## Related Skills

/skill:profile, /skill:optimize, /skill:test, /skill:monitor, /skill:compare, /skill:verify
