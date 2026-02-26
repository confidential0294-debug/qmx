# Monitor Skill

## Overview
**Type:** Workflow  
**Name:** monitor  
**Purpose:** Monitoring setup workflow with alerts and dashboards

## Description
The monitor skill sets up comprehensive monitoring including metrics collection, alerting rules, and dashboards for observability and incident detection.

## Usage

```bash
skill: "monitor"
```

### Parameters
- `targets`: Systems to monitor
- `metrics`: Metrics to collect
- `alerts`: Alert thresholds and rules
- `dashboards`: Dashboard requirements

## Process

1. **Requirements Analysis**: Define monitoring needs
2. **Metric Selection**: Choose relevant metrics
3. **Instrumentation**: Add monitoring instrumentation
4. **Alert Configuration**: Configure alert rules
5. **Dashboard Creation**: Build monitoring dashboards
6. **Validation**: Test monitoring setup

## Output Structure

```
monitor-output/
├── metrics-config.yaml   # Metric collection config
├── alert-rules.yaml      # Alerting rules
├── dashboards/           # Dashboard definitions
├── runbooks/             # Incident runbooks
└── validation.json       # Setup validation
```

## Integration

- **deploy**: Monitor deployments
- **secure**: Security monitoring
- **profile**: Performance monitoring
- **cancel**: Alert on issues

## Best Practices

- Monitor what matters
- Set meaningful thresholds
- Create actionable alerts
- Document runbooks
- Review and refine regularly

## Related Skills

deploy, secure, profile, cancel, benchmark, verify
