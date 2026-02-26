/**
 * QMX Trace MCP Server
 *
 * Provides execution tracing, audit trail, and distributed tracing capabilities.
 * Implements the Model Context Protocol for standardized communication.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import lockfile from 'proper-lockfile';
import { z } from 'zod';

// Schema definitions
const SpanStatus = z.enum(['ok', 'error', 'unset']);

const SpanSchema = z.object({
  traceId: z.string(),
  spanId: z.string(),
  parentSpanId: z.string().optional(),
  name: z.string(),
  kind: z.enum(['server', 'client', 'producer', 'consumer', 'internal']),
  status: SpanStatus,
  startTime: z.string(),
  endTime: z.string().optional(),
  durationMs: z.number().optional(),
  attributes: z.record(z.unknown()).optional(),
  events: z.array(z.object({
    name: z.string(),
    timestamp: z.string(),
    attributes: z.record(z.unknown()).optional(),
  })).optional(),
  error: z.object({
    message: z.string(),
    stack: z.string().optional(),
  }).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const TraceSchema = z.object({
  traceId: z.string(),
  name: z.string(),
  status: SpanStatus,
  startTime: z.string(),
  endTime: z.string().optional(),
  durationMs: z.number().optional(),
  rootSpan: z.string(),
  spans: z.array(SpanSchema),
  services: z.array(z.string()),
  errors: z.number(),
  metadata: z.record(z.unknown()).optional(),
});

const AuditEntrySchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  action: z.string(),
  actor: z.string(),
  target: z.string(),
  details: z.record(z.unknown()).optional(),
  result: z.enum(['success', 'failure', 'partial']),
  traceId: z.string().optional(),
  sessionId: z.string().optional(),
});

type Span = z.infer<typeof SpanSchema>;
type Trace = z.infer<typeof TraceSchema>;
type AuditEntry = z.infer<typeof AuditEntrySchema>;

// Trace storage paths
const QMX_DIR = join(process.cwd(), '.qmx');
const TRACE_DIR = join(QMX_DIR, 'traces');
const AUDIT_DIR = join(QMX_DIR, 'audit');
const TRACES_INDEX_PATH = join(TRACE_DIR, 'index.json');
const AUDIT_INDEX_PATH = join(AUDIT_DIR, 'index.json');

// Server instance
export const server = new Server(
  {
    name: 'qmx-trace-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // Trace Management
      {
        name: 'trace_start',
        description: 'Start a new trace',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Trace name' },
            sessionId: { type: 'string', description: 'Session identifier' },
            metadata: { type: 'object', description: 'Additional metadata' },
          },
          required: ['name'],
        },
      },
      {
        name: 'trace_end',
        description: 'End a trace',
        inputSchema: {
          type: 'object',
          properties: {
            traceId: { type: 'string', description: 'Trace ID to end' },
            status: { type: 'string', enum: ['ok', 'error', 'unset'], description: 'Final status' },
          },
          required: ['traceId'],
        },
      },
      {
        name: 'trace_span_start',
        description: 'Start a new span within a trace',
        inputSchema: {
          type: 'object',
          properties: {
            traceId: { type: 'string', description: 'Parent trace ID' },
            name: { type: 'string', description: 'Span name' },
            parentSpanId: { type: 'string', description: 'Parent span ID' },
            kind: { type: 'string', enum: ['server', 'client', 'producer', 'consumer', 'internal'] },
            attributes: { type: 'object', description: 'Span attributes' },
          },
          required: ['traceId', 'name'],
        },
      },
      {
        name: 'trace_span_end',
        description: 'End a span',
        inputSchema: {
          type: 'object',
          properties: {
            traceId: { type: 'string', description: 'Trace ID' },
            spanId: { type: 'string', description: 'Span ID to end' },
            status: { type: 'string', enum: ['ok', 'error', 'unset'] },
            error: { type: 'object', description: 'Error details if failed' },
          },
          required: ['traceId', 'spanId'],
        },
      },
      {
        name: 'trace_span_add_event',
        description: 'Add an event to a span',
        inputSchema: {
          type: 'object',
          properties: {
            traceId: { type: 'string', description: 'Trace ID' },
            spanId: { type: 'string', description: 'Span ID' },
            name: { type: 'string', description: 'Event name' },
            attributes: { type: 'object', description: 'Event attributes' },
          },
          required: ['traceId', 'spanId', 'name'],
        },
      },
      {
        name: 'trace_get',
        description: 'Get a trace by ID',
        inputSchema: {
          type: 'object',
          properties: {
            traceId: { type: 'string', description: 'Trace ID' },
          },
          required: ['traceId'],
        },
      },
      {
        name: 'trace_list',
        description: 'List traces with optional filters',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: { type: 'string', description: 'Filter by session' },
            status: { type: 'string', enum: ['ok', 'error', 'unset'], description: 'Filter by status' },
            startTime: { type: 'string', description: 'Filter traces after this time (ISO)' },
            endTime: { type: 'string', description: 'Filter traces before this time (ISO)' },
            limit: { type: 'number', description: 'Maximum results', default: 50 },
          },
        },
      },
      {
        name: 'trace_delete',
        description: 'Delete a trace',
        inputSchema: {
          type: 'object',
          properties: {
            traceId: { type: 'string', description: 'Trace ID to delete' },
          },
          required: ['traceId'],
        },
      },
      {
        name: 'trace_get_summary',
        description: 'Get summary statistics for traces',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: { type: 'string', description: 'Filter by session' },
            timeRange: { type: 'string', enum: ['1h', '24h', '7d', '30d', 'all'], description: 'Time range' },
          },
        },
      },
      {
        name: 'trace_export',
        description: 'Export traces to JSON format',
        inputSchema: {
          type: 'object',
          properties: {
            traceIds: { type: 'array', items: { type: 'string' }, description: 'Specific trace IDs to export' },
            sessionId: { type: 'string', description: 'Export all traces for session' },
            format: { type: 'string', enum: ['json', 'jaeger', 'zipkin'], description: 'Export format' },
          },
        },
      },

      // Audit Trail
      {
        name: 'audit_log',
        description: 'Log an audit entry',
        inputSchema: {
          type: 'object',
          properties: {
            action: { type: 'string', description: 'Action performed' },
            actor: { type: 'string', description: 'Who performed the action' },
            target: { type: 'string', description: 'Target of the action' },
            details: { type: 'object', description: 'Additional details' },
            result: { type: 'string', enum: ['success', 'failure', 'partial'] },
            traceId: { type: 'string', description: 'Associated trace ID' },
            sessionId: { type: 'string', description: 'Associated session ID' },
          },
          required: ['action', 'actor', 'target', 'result'],
        },
      },
      {
        name: 'audit_query',
        description: 'Query audit log entries',
        inputSchema: {
          type: 'object',
          properties: {
            action: { type: 'string', description: 'Filter by action' },
            actor: { type: 'string', description: 'Filter by actor' },
            target: { type: 'string', description: 'Filter by target' },
            result: { type: 'string', enum: ['success', 'failure', 'partial'] },
            startTime: { type: 'string', description: 'Filter entries after this time' },
            endTime: { type: 'string', description: 'Filter entries before this time' },
            limit: { type: 'number', description: 'Maximum results', default: 100 },
          },
        },
      },
      {
        name: 'audit_get',
        description: 'Get a specific audit entry',
        inputSchema: {
          type: 'object',
          properties: {
            entryId: { type: 'string', description: 'Audit entry ID' },
          },
          required: ['entryId'],
        },
      },
      {
        name: 'audit_export',
        description: 'Export audit log entries',
        inputSchema: {
          type: 'object',
          properties: {
            startTime: { type: 'string', description: 'Export entries after this time' },
            endTime: { type: 'string', description: 'Export entries before this time' },
            format: { type: 'string', enum: ['json', 'csv'], description: 'Export format' },
          },
        },
      },

      // Analysis
      {
        name: 'trace_analyze_errors',
        description: 'Analyze error patterns in traces',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: { type: 'string', description: 'Filter by session' },
            timeRange: { type: 'string', enum: ['1h', '24h', '7d', '30d', 'all'], description: 'Time range' },
          },
        },
      },
      {
        name: 'trace_analyze_latency',
        description: 'Analyze latency distribution',
        inputSchema: {
          type: 'object',
          properties: {
            spanName: { type: 'string', description: 'Filter by span name' },
            sessionId: { type: 'string', description: 'Filter by session' },
            percentiles: { type: 'array', items: { type: 'number' }, description: 'Percentiles to calculate', default: [50, 90, 95, 99] },
          },
        },
      },
      {
        name: 'trace_find_bottlenecks',
        description: 'Find performance bottlenecks in traces',
        inputSchema: {
          type: 'object',
          properties: {
            thresholdMs: { type: 'number', description: 'Minimum duration to consider as bottleneck', default: 1000 },
            limit: { type: 'number', description: 'Maximum results', default: 20 },
          },
        },
      },
      {
        name: 'trace_correlate',
        description: 'Correlate traces by common attributes',
        inputSchema: {
          type: 'object',
          properties: {
            attribute: { type: 'string', description: 'Attribute to correlate by' },
            value: { type: 'string', description: 'Attribute value' },
          },
          required: ['attribute', 'value'],
        },
      },

      // Cleanup
      {
        name: 'trace_cleanup',
        description: 'Clean up old traces',
        inputSchema: {
          type: 'object',
          properties: {
            olderThan: { type: 'string', enum: ['1h', '24h', '7d', '30d'], description: 'Delete traces older than' },
            dryRun: { type: 'boolean', description: 'Preview what would be deleted', default: true },
          },
          required: ['olderThan'],
        },
      },
      {
        name: 'audit_cleanup',
        description: 'Clean up old audit entries',
        inputSchema: {
          type: 'object',
          properties: {
            olderThan: { type: 'string', enum: ['1h', '24h', '7d', '30d', '90d'], description: 'Delete entries older than' },
            dryRun: { type: 'boolean', description: 'Preview what would be deleted', default: true },
          },
          required: ['olderThan'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      // Trace Management
      case 'trace_start':
        return await handleTraceStart(args as any);
      case 'trace_end':
        return await handleTraceEnd(args as any);
      case 'trace_span_start':
        return await handleTraceSpanStart(args as any);
      case 'trace_span_end':
        return await handleTraceSpanEnd(args as any);
      case 'trace_span_add_event':
        return await handleTraceSpanAddEvent(args as any);
      case 'trace_get':
        return await handleTraceGet(args as any);
      case 'trace_list':
        return await handleTraceList(args as any);
      case 'trace_delete':
        return await handleTraceDelete(args as any);
      case 'trace_get_summary':
        return await handleTraceGetSummary(args as any);
      case 'trace_export':
        return await handleTraceExport(args as any);

      // Audit Trail
      case 'audit_log':
        return await handleAuditLog(args as any);
      case 'audit_query':
        return await handleAuditQuery(args as any);
      case 'audit_get':
        return await handleAuditGet(args as any);
      case 'audit_export':
        return await handleAuditExport(args as any);

      // Analysis
      case 'trace_analyze_errors':
        return await handleTraceAnalyzeErrors(args as any);
      case 'trace_analyze_latency':
        return await handleTraceAnalyzeLatency(args as any);
      case 'trace_find_bottlenecks':
        return await handleTraceFindBottlenecks(args as any);
      case 'trace_correlate':
        return await handleTraceCorrelate(args as any);

      // Cleanup
      case 'trace_cleanup':
        return await handleTraceCleanup(args as any);
      case 'audit_cleanup':
        return await handleAuditCleanup(args as any);

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// Trace Management Handlers

async function handleTraceStart(args: {
  name: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}) {
  const traceId = generateId('trace');
  const now = new Date().toISOString();

  const trace: Trace = {
    traceId,
    name: args.name,
    status: 'unset',
    startTime: now,
    rootSpan: '',
    spans: [],
    services: [],
    errors: 0,
    metadata: {
      sessionId: args.sessionId,
      ...args.metadata,
    },
  };

  await ensureDirs();
  await writeTrace(trace);

  return {
    content: [{ type: 'text', text: JSON.stringify({ traceId, status: 'started' }, null, 2) }],
  };
}

async function handleTraceEnd(args: {
  traceId: string;
  status?: 'ok' | 'error' | 'unset';
}) {
  const release = await lockfile.lock(getTracePath(args.traceId), { retries: 3 });
  try {
    const trace = await readTrace(args.traceId);
    if (!trace) {
      return {
        content: [{ type: 'text', text: 'Trace not found' }],
        isError: true,
      };
    }

    trace.endTime = new Date().toISOString();
    trace.status = args.status || 'ok';
    trace.durationMs = new Date(trace.endTime).getTime() - new Date(trace.startTime).getTime();

    await writeTrace(trace);

    return {
      content: [{ type: 'text', text: JSON.stringify({ traceId: args.traceId, status: 'ended' }, null, 2) }],
    };
  } finally {
    await release();
  }
}

async function handleTraceSpanStart(args: {
  traceId: string;
  name: string;
  parentSpanId?: string;
  kind?: 'server' | 'client' | 'producer' | 'consumer' | 'internal';
  attributes?: Record<string, unknown>;
}) {
  const release = await lockfile.lock(getTracePath(args.traceId), { retries: 3 });
  try {
    const trace = await readTrace(args.traceId);
    if (!trace) {
      return {
        content: [{ type: 'text', text: 'Trace not found' }],
        isError: true,
      };
    }

    const spanId = generateId('span');
    const now = new Date().toISOString();

    const span: Span = {
      traceId: args.traceId,
      spanId,
      parentSpanId: args.parentSpanId,
      name: args.name,
      kind: args.kind || 'internal',
      status: 'unset',
      startTime: now,
      attributes: args.attributes,
      events: [],
    };

    if (!trace.rootSpan && !args.parentSpanId) {
      trace.rootSpan = spanId;
    }

    trace.spans.push(span);
    await writeTrace(trace);

    return {
      content: [{ type: 'text', text: JSON.stringify({ spanId, traceId: args.traceId }, null, 2) }],
    };
  } finally {
    await release();
  }
}

async function handleTraceSpanEnd(args: {
  traceId: string;
  spanId: string;
  status?: 'ok' | 'error' | 'unset';
  error?: { message: string; stack?: string };
}) {
  const release = await lockfile.lock(getTracePath(args.traceId), { retries: 3 });
  try {
    const trace = await readTrace(args.traceId);
    if (!trace) {
      return {
        content: [{ type: 'text', text: 'Trace not found' }],
        isError: true,
      };
    }

    const span = trace.spans.find(s => s.spanId === args.spanId);
    if (!span) {
      return {
        content: [{ type: 'text', text: 'Span not found' }],
        isError: true,
      };
    }

    const now = new Date().toISOString();
    span.endTime = now;
    span.status = args.status || 'ok';
    span.durationMs = new Date(now).getTime() - new Date(span.startTime).getTime();

    if (args.error) {
      span.error = args.error;
      trace.errors++;
      trace.status = 'error';
    }

    await writeTrace(trace);

    return {
      content: [{ type: 'text', text: JSON.stringify({ spanId: args.spanId, status: span.status }, null, 2) }],
    };
  } finally {
    await release();
  }
}

async function handleTraceSpanAddEvent(args: {
  traceId: string;
  spanId: string;
  name: string;
  attributes?: Record<string, unknown>;
}) {
  const release = await lockfile.lock(getTracePath(args.traceId), { retries: 3 });
  try {
    const trace = await readTrace(args.traceId);
    if (!trace) {
      return {
        content: [{ type: 'text', text: 'Trace not found' }],
        isError: true,
      };
    }

    const span = trace.spans.find(s => s.spanId === args.spanId);
    if (!span) {
      return {
        content: [{ type: 'text', text: 'Span not found' }],
        isError: true,
      };
    }

    span.events = span.events || [];
    span.events.push({
      name: args.name,
      timestamp: new Date().toISOString(),
      attributes: args.attributes,
    });

    await writeTrace(trace);

    return {
      content: [{ type: 'text', text: JSON.stringify({ spanId: args.spanId, eventName: args.name }, null, 2) }],
    };
  } finally {
    await release();
  }
}

async function handleTraceGet(args: { traceId: string }) {
  const trace = await readTrace(args.traceId);
  if (!trace) {
    return {
      content: [{ type: 'text', text: 'Trace not found' }],
      isError: true,
    };
  }

  return {
    content: [{ type: 'text', text: JSON.stringify(trace, null, 2) }],
  };
}

async function handleTraceList(args: {
  sessionId?: string;
  status?: 'ok' | 'error' | 'unset';
  startTime?: string;
  endTime?: string;
  limit?: number;
}) {
  const index = await readTraceIndex();
  const limit = args.limit || 50;

  let traces: TraceIndexEntry[] = Object.values(index.traces);

  // Apply filters
  if (args.sessionId) {
    traces = traces.filter(t => t.metadata?.sessionId === args.sessionId);
  }
  if (args.status) {
    traces = traces.filter(t => t.status === args.status);
  }
  if (args.startTime) {
    traces = traces.filter(t => t.startTime >= args.startTime!);
  }
  if (args.endTime) {
    traces = traces.filter(t => t.startTime <= args.endTime!);
  }

  // Sort by start time descending
  traces.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  // Apply limit
  traces = traces.slice(0, limit);

  return {
    content: [{ type: 'text', text: JSON.stringify({ traces, total: traces.length }, null, 2) }],
  };
}

async function handleTraceDelete(args: { traceId: string }) {
  const tracePath = getTracePath(args.traceId);
  try {
    await rm(tracePath, { force: true });

    // Update index
    const index = await readTraceIndex();
    delete index.traces[args.traceId];
    await writeTraceIndex(index);

    return {
      content: [{ type: 'text', text: JSON.stringify({ traceId: args.traceId, deleted: true }, null, 2) }],
    };
  } catch (error) {
    return {
      content: [{ type: 'text', text: 'Trace not found' }],
      isError: true,
    };
  }
}

async function handleTraceGetSummary(args: {
  sessionId?: string;
  timeRange?: '1h' | '24h' | '7d' | '30d' | 'all';
}) {
  const index = await readTraceIndex();
  let traces: TraceIndexEntry[] = Object.values(index.traces);

  // Filter by session
  if (args.sessionId) {
    traces = traces.filter(t => t.metadata?.sessionId === args.sessionId);
  }

  // Filter by time range
  if (args.timeRange && args.timeRange !== 'all') {
    const now = Date.now();
    const ranges: Record<string, number> = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    };
    const cutoff = now - ranges[args.timeRange];
    traces = traces.filter(t => new Date(t.startTime).getTime() >= cutoff);
  }

  const summary = {
    total: traces.length,
    byStatus: {
      ok: traces.filter(t => t.status === 'ok').length,
      error: traces.filter(t => t.status === 'error').length,
      unset: traces.filter(t => t.status === 'unset').length,
    },
    totalErrors: traces.reduce((sum, t) => sum + t.errors, 0),
    avgDurationMs: traces.filter(t => t.durationMs).reduce((sum, t) => sum + (t.durationMs || 0), 0) / (traces.filter(t => t.durationMs).length || 1),
    timeRange: args.timeRange || 'all',
  };

  return {
    content: [{ type: 'text', text: JSON.stringify(summary, null, 2) }],
  };
}

async function handleTraceExport(args: {
  traceIds?: string[];
  sessionId?: string;
  format?: 'json' | 'jaeger' | 'zipkin';
}) {
  const index = await readTraceIndex();
  let traces: TraceIndexEntry[] = [];

  if (args.traceIds) {
    for (const traceId of args.traceIds) {
      const trace = await readTrace(traceId);
      if (trace) traces.push(trace);
    }
  } else if (args.sessionId) {
    traces = Object.values(index.traces).filter(t => t.metadata?.sessionId === args.sessionId);
  } else {
    traces = Object.values(index.traces);
  }

  const format = args.format || 'json';

  if (format === 'jaeger') {
    // Convert to Jaeger format - use Trace type
    const jaegerTraces = (traces as unknown as Trace[]).map(t => ({
      traceID: t.traceId,
      spans: t.spans.map(s => ({
        traceID: t.traceId,
        spanID: s.spanId,
        operationName: s.name,
        references: s.parentSpanId ? [{ refType: 'CHILD_OF', traceID: t.traceId, spanID: s.parentSpanId }] : [],
        startTime: new Date(s.startTime).getTime() * 1000,
        duration: (s.durationMs || 0) * 1000,
        tags: Object.entries(s.attributes || {}).map(([key, value]) => ({ key, value })),
        logs: (s.events || []).map(e => ({
          timestamp: new Date(e.timestamp).getTime() * 1000,
          fields: Object.entries(e.attributes || {}).map(([key, value]) => ({ key, value })),
        })),
      })),
    }));
    return {
      content: [{ type: 'text', text: JSON.stringify(jaegerTraces, null, 2) }],
    };
  }

  if (format === 'zipkin') {
    // Convert to Zipkin format
    const zipkinSpans = traces.flatMap(t =>
      t.spans.map(s => ({
        traceId: t.traceId.slice(0, 16),
        id: s.spanId.slice(0, 16),
        parentId: s.parentSpanId?.slice(0, 16),
        name: s.name,
        timestamp: new Date(s.startTime).getTime() * 1000,
        duration: (s.durationMs || 0) * 1000,
        tags: s.attributes,
      }))
    );
    return {
      content: [{ type: 'text', text: JSON.stringify(zipkinSpans, null, 2) }],
    };
  }

  // Default JSON format
  return {
    content: [{ type: 'text', text: JSON.stringify(traces, null, 2) }],
  };
}

// Audit Trail Handlers

async function handleAuditLog(args: {
  action: string;
  actor: string;
  target: string;
  details?: Record<string, unknown>;
  result: 'success' | 'failure' | 'partial';
  traceId?: string;
  sessionId?: string;
}) {
  const entryId = generateId('audit');
  const now = new Date().toISOString();

  const entry: AuditEntry = {
    id: entryId,
    timestamp: now,
    action: args.action,
    actor: args.actor,
    target: args.target,
    details: args.details,
    result: args.result,
    traceId: args.traceId,
    sessionId: args.sessionId,
  };

  await ensureDirs();
  await writeAuditEntry(entry);

  return {
    content: [{ type: 'text', text: JSON.stringify({ entryId, status: 'logged' }, null, 2) }],
  };
}

async function handleAuditQuery(args: {
  action?: string;
  actor?: string;
  target?: string;
  result?: 'success' | 'failure' | 'partial';
  startTime?: string;
  endTime?: string;
  limit?: number;
}) {
  const index = await readAuditIndex();
  const limit = args.limit || 100;

  let entries = Object.values(index.entries);

  // Apply filters
  if (args.action) {
    entries = entries.filter(e => e.action === args.action);
  }
  if (args.actor) {
    entries = entries.filter(e => e.actor === args.actor);
  }
  if (args.target) {
    entries = entries.filter(e => e.target === args.target);
  }
  if (args.result) {
    entries = entries.filter(e => e.result === args.result);
  }
  if (args.startTime) {
    entries = entries.filter(e => e.timestamp >= args.startTime!);
  }
  if (args.endTime) {
    entries = entries.filter(e => e.timestamp <= args.endTime!);
  }

  // Sort by timestamp descending
  entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Apply limit
  entries = entries.slice(0, limit);

  return {
    content: [{ type: 'text', text: JSON.stringify({ entries, total: entries.length }, null, 2) }],
  };
}

async function handleAuditGet(args: { entryId: string }) {
  const index = await readAuditIndex();
  const entry = index.entries[args.entryId];

  if (!entry) {
    return {
      content: [{ type: 'text', text: 'Audit entry not found' }],
      isError: true,
    };
  }

  return {
    content: [{ type: 'text', text: JSON.stringify(entry, null, 2) }],
  };
}

async function handleAuditExport(args: {
  startTime?: string;
  endTime?: string;
  format?: 'json' | 'csv';
}) {
  const index = await readAuditIndex();
  let entries = Object.values(index.entries);

  // Apply time filters
  if (args.startTime) {
    entries = entries.filter(e => e.timestamp >= args.startTime!);
  }
  if (args.endTime) {
    entries = entries.filter(e => e.timestamp <= args.endTime!);
  }

  const format = args.format || 'json';

  if (format === 'csv') {
    const headers = ['id', 'timestamp', 'action', 'actor', 'target', 'result', 'traceId', 'sessionId'];
    const csvLines = [headers.join(',')];

    for (const entry of entries) {
      const row = headers.map(h => {
        const value = (entry as any)[h];
        if (typeof value === 'object') {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }
        return `"${String(value || '').replace(/"/g, '""')}"`;
      });
      csvLines.push(row.join(','));
    }

    return {
      content: [{ type: 'text', text: csvLines.join('\n') }],
    };
  }

  return {
    content: [{ type: 'text', text: JSON.stringify(entries, null, 2) }],
  };
}

// Analysis Handlers

async function handleTraceAnalyzeErrors(args: {
  sessionId?: string;
  timeRange?: '1h' | '24h' | '7d' | '30d' | 'all';
}) {
  const index = await readTraceIndex();
  let traces = Object.values(index.traces);

  if (args.sessionId) {
    traces = traces.filter(t => t.metadata?.sessionId === args.sessionId);
  }

  if (args.timeRange && args.timeRange !== 'all') {
    const now = Date.now();
    const ranges: Record<string, number> = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    };
    const cutoff = now - ranges[args.timeRange];
    traces = traces.filter(t => new Date(t.startTime).getTime() >= cutoff);
  }

  const errorTraces = traces.filter(t => t.status === 'error');
  const errorPatterns: Record<string, number> = {};

  for (const trace of errorTraces) {
    for (const span of trace.spans) {
      if (span.error) {
        const errorKey = span.error.message || 'Unknown error';
        errorPatterns[errorKey] = (errorPatterns[errorKey] || 0) + 1;
      }
    }
  }

  const sortedPatterns = Object.entries(errorPatterns)
    .sort((a, b) => b[1] - a[1])
    .map(([error, count]) => ({ error, count }));

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            totalErrors: errorTraces.length,
            errorPatterns: sortedPatterns.slice(0, 20),
            timeRange: args.timeRange || 'all',
          },
          null,
          2
        ),
      },
    ],
  };
}

async function handleTraceAnalyzeLatency(args: {
  spanName?: string;
  sessionId?: string;
  percentiles?: number[];
}) {
  const index = await readTraceIndex();
  let traces = Object.values(index.traces);

  if (args.sessionId) {
    traces = traces.filter(t => t.metadata?.sessionId === args.sessionId);
  }

  const durations: number[] = [];

  for (const trace of traces) {
    for (const span of trace.spans) {
      if (args.spanName && span.name !== args.spanName) continue;
      if (span.durationMs) {
        durations.push(span.durationMs);
      }
    }
  }

  durations.sort((a, b) => a - b);

  const percentiles = args.percentiles || [50, 90, 95, 99];
  const percentileValues = percentiles.map(p => {
    const index = Math.floor((p / 100) * durations.length);
    return { percentile: p, value: durations[index] || 0 };
  });

  const stats = {
    count: durations.length,
    min: durations[0] || 0,
    max: durations[durations.length - 1] || 0,
    avg: durations.reduce((a, b) => a + b, 0) / (durations.length || 1),
    percentiles: percentileValues,
  };

  return {
    content: [{ type: 'text', text: JSON.stringify(stats, null, 2) }],
  };
}

async function handleTraceFindBottlenecks(args: {
  thresholdMs?: number;
  limit?: number;
}) {
  const index = await readTraceIndex();
  const thresholdMs = args.thresholdMs || 1000;
  const limit = args.limit || 20;

  const bottlenecks: Array<{ spanId: string; name: string; traceId: string; durationMs: number }> = [];

  for (const trace of Object.values(index.traces)) {
    for (const span of trace.spans) {
      if (span.durationMs && span.durationMs >= thresholdMs) {
        bottlenecks.push({
          spanId: span.spanId,
          name: span.name,
          traceId: trace.traceId,
          durationMs: span.durationMs,
        });
      }
    }
  }

  bottlenecks.sort((a, b) => b.durationMs - a.durationMs);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            bottlenecks: bottlenecks.slice(0, limit),
            total: bottlenecks.length,
            thresholdMs,
          },
          null,
          2
        ),
      },
    ],
  };
}

async function handleTraceCorrelate(args: { attribute: string; value: string }) {
  const index = await readTraceIndex();
  const correlated: Trace[] = [];

  for (const trace of Object.values(index.traces)) {
    // Check trace metadata
    if (trace.metadata?.[args.attribute] === args.value) {
      correlated.push(trace);
      continue;
    }

    // Check span attributes
    for (const span of trace.spans) {
      if (span.attributes?.[args.attribute] === args.value) {
        correlated.push(trace);
        break;
      }
    }
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            attribute: args.attribute,
            value: args.value,
            correlatedTraces: correlated.length,
            traceIds: correlated.map(t => t.traceId),
          },
          null,
          2
        ),
      },
    ],
  };
}

// Cleanup Handlers

async function handleTraceCleanup(args: {
  olderThan: '1h' | '24h' | '7d' | '30d';
  dryRun?: boolean;
}) {
  const index = await readTraceIndex();
  const now = Date.now();
  const ranges: Record<string, number> = {
    '1h': 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
  };
  const cutoff = now - ranges[args.olderThan];

  const toDelete: string[] = [];

  for (const [traceId, trace] of Object.entries(index.traces)) {
    if (new Date(trace.startTime).getTime() < cutoff) {
      toDelete.push(traceId);
    }
  }

  if (args.dryRun) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              dryRun: true,
              wouldDelete: toDelete.length,
              traceIds: toDelete,
              olderThan: args.olderThan,
            },
            null,
          2
          ),
        },
      ],
    };
  }

  for (const traceId of toDelete) {
    try {
      await rm(getTracePath(traceId), { force: true });
      delete index.traces[traceId];
    } catch {
      // Ignore errors
    }
  }

  await writeTraceIndex(index);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            deleted: toDelete.length,
            traceIds: toDelete,
            olderThan: args.olderThan,
          },
          null,
          2
        ),
      },
    ],
  };
}

async function handleAuditCleanup(args: {
  olderThan: '1h' | '24h' | '7d' | '30d' | '90d';
  dryRun?: boolean;
}) {
  const index = await readAuditIndex();
  const now = Date.now();
  const ranges: Record<string, number> = {
    '1h': 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    '90d': 90 * 24 * 60 * 60 * 1000,
  };
  const cutoff = now - ranges[args.olderThan];

  const toDelete: string[] = [];

  for (const [entryId, entry] of Object.entries(index.entries)) {
    if (new Date(entry.timestamp).getTime() < cutoff) {
      toDelete.push(entryId);
    }
  }

  if (args.dryRun) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              dryRun: true,
              wouldDelete: toDelete.length,
              entryIds: toDelete,
              olderThan: args.olderThan,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  for (const entryId of toDelete) {
    delete index.entries[entryId];
  }

  await writeAuditIndex(index);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            deleted: toDelete.length,
            entryIds: toDelete,
            olderThan: args.olderThan,
          },
          null,
          2
        ),
      },
    ],
  };
}

// Utility functions

async function ensureDirs() {
  await mkdir(TRACE_DIR, { recursive: true });
  await mkdir(AUDIT_DIR, { recursive: true });
}

function getTracePath(traceId: string): string {
  return join(TRACE_DIR, `${traceId}.json`);
}

function getAuditPath(entryId: string): string {
  return join(AUDIT_DIR, `${entryId}.json`);
}

async function readTrace(traceId: string): Promise<Trace | null> {
  try {
    const content = await readFile(getTracePath(traceId), 'utf-8');
    return JSON.parse(content) as Trace;
  } catch {
    return null;
  }
}

async function writeTrace(trace: Trace) {
  await writeFile(getTracePath(trace.traceId), JSON.stringify(trace, null, 2));

  // Update index
  const index = await readTraceIndex();
  index.traces[trace.traceId] = {
    traceId: trace.traceId,
    name: trace.name,
    status: trace.status,
    startTime: trace.startTime,
    endTime: trace.endTime,
    durationMs: trace.durationMs,
    rootSpan: trace.rootSpan,
    spans: [], // Don't store full spans in index
    services: trace.services,
    errors: trace.errors,
    metadata: trace.metadata,
  };
  await writeTraceIndex(index);
}

interface TraceIndexEntry {
  traceId: string;
  name: string;
  status: 'ok' | 'error' | 'unset';
  startTime: string;
  endTime?: string;
  durationMs?: number;
  rootSpan: string;
  spans: Span[];
  services: string[];
  errors: number;
  metadata?: Record<string, unknown>;
}

interface TraceIndex {
  version: string;
  createdAt: string;
  updatedAt: string;
  traces: Record<string, TraceIndexEntry>;
}

async function readTraceIndex(): Promise<TraceIndex> {
  try {
    const content = await readFile(TRACES_INDEX_PATH, 'utf-8');
    return JSON.parse(content) as TraceIndex;
  } catch {
    const defaultIndex: TraceIndex = {
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      traces: {},
    };
    await writeTraceIndex(defaultIndex);
    return defaultIndex;
  }
}

async function writeTraceIndex(index: TraceIndex) {
  await mkdir(TRACE_DIR, { recursive: true });
  await writeFile(TRACES_INDEX_PATH, JSON.stringify(index, null, 2));
}

async function readAuditIndex(): Promise<{
  version: string;
  createdAt: string;
  updatedAt: string;
  entries: Record<string, AuditEntry>;
}> {
  try {
    const content = await readFile(AUDIT_INDEX_PATH, 'utf-8');
    return JSON.parse(content) as any;
  } catch {
    const defaultIndex = {
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      entries: {},
    };
    await writeAuditIndex(defaultIndex);
    return defaultIndex;
  }
}

async function writeAuditIndex(index: any) {
  await mkdir(AUDIT_DIR, { recursive: true });
  await writeFile(AUDIT_INDEX_PATH, JSON.stringify(index, null, 2));
}

async function writeAuditEntry(entry: AuditEntry) {
  await writeFile(getAuditPath(entry.id), JSON.stringify(entry, null, 2));

  // Update index
  const index = await readAuditIndex();
  index.entries[entry.id] = entry;
  index.updatedAt = new Date().toISOString();
  await writeAuditIndex(index);
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// Start server
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

async function main() {
  const transport = new StdioServerTransport();

  await server.connect(transport);
  console.error('QMX Trace MCP Server running');
}

main().catch(console.error);

// Export types for index.ts
export type { Trace, Span, AuditEntry };
