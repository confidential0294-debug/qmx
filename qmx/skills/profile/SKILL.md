# Profile Skill

## Overview
**Type:** Workflow  
**Name:** profile  
**Purpose:** Performance profiling workflow with detailed analysis and recommendations

## Description
The profile skill performs detailed performance profiling to identify bottlenecks, resource usage patterns, and optimization opportunities with actionable recommendations.

## Usage

```bash
skill: "profile"
```

### Parameters
- `target`: Application or component to profile
- `profile_type`: Profiling type (cpu, memory, io)
- `duration`: Profiling duration
- `workload`: Workload scenario to profile

## Process

1. **Setup**: Configure profiling environment
2. **Baseline Run**: Capture baseline performance
3. **Profiling Run**: Execute profiling session
4. **Data Collection**: Gather profiling data
5. **Analysis**: Analyze performance data
6. **Recommendations**: Generate optimization recommendations

## Output Structure

```
profile-output/
├── profile-data/         # Raw profiling data
├── flame-graphs/         # Visual flame graphs
├── analysis.md           # Performance analysis
├── hotspots.json         # Performance hotspots
└── recommendations.md    # Optimization recommendations
```

## Integration

- **optimize**: Apply optimizations
- **benchmark**: Compare profiles
- **debug**: Debug performance issues
- **monitor**: Set up ongoing monitoring

## Best Practices

- Profile realistic workloads
- Focus on hotspots
- Compare before/after changes
- Profile in production-like env
- Document findings

## Related Skills

optimize, benchmark, debug, monitor, verify, test
