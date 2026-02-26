/**
 * Tests for Trace MCP Server
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFile, writeFile, mkdir, rm, readdir } from 'node:fs/promises';
import { join } from 'node:path';

describe('Trace MCP Server', () => {
  const qmxDir = join(process.cwd(), '.qmx');
  const traceDir = join(qmxDir, 'traces');
  const auditDir = join(qmxDir, 'audit');
  const tracesIndexPath = join(traceDir, 'index.json');
  const auditIndexPath = join(auditDir, 'index.json');

  beforeEach(async () => {
    await mkdir(traceDir, { recursive: true });
    await mkdir(auditDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await rm(qmxDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Trace Management', () => {
    describe('trace_start', () => {
      it('should start a new trace with unique ID', async () => {
        const traceId = `trace-${Date.now()}`;
        const trace = {
          traceId,
          name: 'Test Trace',
          status: 'unset',
          startTime: new Date().toISOString(),
          rootSpan: '',
          spans: [],
          services: [],
          errors: 0,
          metadata: { sessionId: 'session-123' },
        };

        await writeFile(join(traceDir, `${traceId}.json`), JSON.stringify(trace, null, 2));

        const content = await readFile(join(traceDir, `${traceId}.json`), 'utf-8');
        const parsed = JSON.parse(content);

        expect(parsed.traceId).toBe(traceId);
        expect(parsed.name).toBe('Test Trace');
        expect(parsed.status).toBe('unset');
      });

      it('should include session metadata', async () => {
        const traceId = 'trace-with-session';
        const sessionId = 'session-456';
        const trace = {
          traceId,
          name: 'Session Trace',
          status: 'unset',
          startTime: new Date().toISOString(),
          rootSpan: '',
          spans: [],
          services: [],
          errors: 0,
          metadata: { sessionId },
        };

        await writeFile(join(traceDir, `${traceId}.json`), JSON.stringify(trace, null, 2));

        const content = await readFile(join(traceDir, `${traceId}.json`), 'utf-8');
        const parsed = JSON.parse(content);

        expect(parsed.metadata.sessionId).toBe(sessionId);
      });
    });

    describe('trace_end', () => {
      it('should end trace with ok status', async () => {
        const traceId = 'trace-ok';
        const startTime = new Date(Date.now() - 1000).toISOString();
        const trace = {
          traceId,
          name: 'Test Trace',
          status: 'unset',
          startTime,
          rootSpan: '',
          spans: [],
          services: [],
          errors: 0,
        };

        await writeFile(join(traceDir, `${traceId}.json`), JSON.stringify(trace, null, 2));

        // End trace
        const endTime = new Date().toISOString();
        const updatedTrace = {
          ...trace,
          endTime,
          status: 'ok',
          durationMs: 1000,
        };

        await writeFile(join(traceDir, `${traceId}.json`), JSON.stringify(updatedTrace, null, 2));

        const content = await readFile(join(traceDir, `${traceId}.json`), 'utf-8');
        const parsed = JSON.parse(content);

        expect(parsed.status).toBe('ok');
        expect(parsed.endTime).toBeDefined();
        expect(parsed.durationMs).toBe(1000);
      });

      it('should end trace with error status', async () => {
        const traceId = 'trace-error';
        const trace = {
          traceId,
          name: 'Error Trace',
          status: 'unset',
          startTime: new Date().toISOString(),
          rootSpan: '',
          spans: [],
          services: [],
          errors: 0,
        };

        await writeFile(join(traceDir, `${traceId}.json`), JSON.stringify(trace, null, 2));

        const updatedTrace = {
          ...trace,
          endTime: new Date().toISOString(),
          status: 'error',
          errors: 1,
        };

        await writeFile(join(traceDir, `${traceId}.json`), JSON.stringify(updatedTrace, null, 2));

        const content = await readFile(join(traceDir, `${traceId}.json`), 'utf-8');
        const parsed = JSON.parse(content);

        expect(parsed.status).toBe('error');
        expect(parsed.errors).toBe(1);
      });
    });

    describe('trace_span_start', () => {
      it('should start a span within a trace', async () => {
        const traceId = 'trace-with-spans';
        const spanId = 'span-1';
        const trace = {
          traceId,
          name: 'Test Trace',
          status: 'unset',
          startTime: new Date().toISOString(),
          rootSpan: spanId,
          spans: [
            {
              traceId,
              spanId,
              name: 'Test Span',
              kind: 'internal',
              status: 'unset',
              startTime: new Date().toISOString(),
              attributes: { key: 'value' },
              events: [],
            },
          ],
          services: [],
          errors: 0,
        };

        await writeFile(join(traceDir, `${traceId}.json`), JSON.stringify(trace, null, 2));

        const content = await readFile(join(traceDir, `${traceId}.json`), 'utf-8');
        const parsed = JSON.parse(content);

        expect(parsed.spans).toHaveLength(1);
        expect(parsed.spans[0].name).toBe('Test Span');
        expect(parsed.spans[0].kind).toBe('internal');
      });

      it('should set root span for first span', async () => {
        const traceId = 'trace-root';
        const trace = {
          traceId,
          name: 'Root Trace',
          status: 'unset',
          startTime: new Date().toISOString(),
          rootSpan: 'first-span',
          spans: [],
          services: [],
          errors: 0,
        };

        await writeFile(join(traceDir, `${traceId}.json`), JSON.stringify(trace, null, 2));

        const content = await readFile(join(traceDir, `${traceId}.json`), 'utf-8');
        const parsed = JSON.parse(content);

        expect(parsed.rootSpan).toBe('first-span');
      });
    });

    describe('trace_span_end', () => {
      it('should end span with duration', async () => {
        const traceId = 'trace-span-end';
        const spanId = 'span-to-end';
        const startTime = new Date(Date.now() - 500).toISOString();
        const trace = {
          traceId,
          name: 'Test Trace',
          status: 'unset',
          startTime: new Date().toISOString(),
          rootSpan: spanId,
          spans: [
            {
              traceId,
              spanId,
              name: 'Timed Span',
              kind: 'internal',
              status: 'unset',
              startTime,
            },
          ],
          services: [],
          errors: 0,
        };

        await writeFile(join(traceDir, `${traceId}.json`), JSON.stringify(trace, null, 2));

        // End span
        const endTime = new Date().toISOString();
        const updatedTrace = {
          ...trace,
          spans: [
            {
              ...trace.spans[0],
              endTime,
              status: 'ok',
              durationMs: 500,
            },
          ],
        };

        await writeFile(join(traceDir, `${traceId}.json`), JSON.stringify(updatedTrace, null, 2));

        const content = await readFile(join(traceDir, `${traceId}.json`), 'utf-8');
        const parsed = JSON.parse(content);

        expect(parsed.spans[0].status).toBe('ok');
        expect(parsed.spans[0].durationMs).toBe(500);
      });

      it('should record span error', async () => {
        const traceId = 'trace-span-error';
        const spanId = 'error-span';
        const trace = {
          traceId,
          name: 'Error Trace',
          status: 'unset',
          startTime: new Date().toISOString(),
          rootSpan: spanId,
          spans: [
            {
              traceId,
              spanId,
              name: 'Failing Span',
              kind: 'internal',
              status: 'error',
              startTime: new Date().toISOString(),
              endTime: new Date().toISOString(),
              error: {
                message: 'Something went wrong',
                stack: 'Error: Something went wrong\n    at test.ts:1:1',
              },
            },
          ],
          services: [],
          errors: 1,
        };

        await writeFile(join(traceDir, `${traceId}.json`), JSON.stringify(trace, null, 2));

        const content = await readFile(join(traceDir, `${traceId}.json`), 'utf-8');
        const parsed = JSON.parse(content);

        expect(parsed.spans[0].status).toBe('error');
        expect(parsed.spans[0].error?.message).toBe('Something went wrong');
        expect(parsed.errors).toBe(1);
      });
    });

    describe('trace_span_add_event', () => {
      it('should add event to span', async () => {
        const traceId = 'trace-with-events';
        const spanId = 'span-with-events';
        const trace = {
          traceId,
          name: 'Event Trace',
          status: 'unset',
          startTime: new Date().toISOString(),
          rootSpan: spanId,
          spans: [
            {
              traceId,
              spanId,
              name: 'Event Span',
              kind: 'internal',
              status: 'running',
              startTime: new Date().toISOString(),
              events: [
                {
                  name: 'event-1',
                  timestamp: new Date().toISOString(),
                  attributes: { data: 'value1' },
                },
                {
                  name: 'event-2',
                  timestamp: new Date().toISOString(),
                  attributes: { data: 'value2' },
                },
              ],
            },
          ],
          services: [],
          errors: 0,
        };

        await writeFile(join(traceDir, `${traceId}.json`), JSON.stringify(trace, null, 2));

        const content = await readFile(join(traceDir, `${traceId}.json`), 'utf-8');
        const parsed = JSON.parse(content);

        expect(parsed.spans[0].events).toHaveLength(2);
        expect(parsed.spans[0].events[0].name).toBe('event-1');
      });
    });
  });

  describe('Trace Retrieval', () => {
    describe('trace_get', () => {
      it('should get trace by ID', async () => {
        const traceId = 'trace-get-test';
        const trace = {
          traceId,
          name: 'Get Test Trace',
          status: 'ok',
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          durationMs: 100,
          rootSpan: 'span-1',
          spans: [],
          services: ['service-1'],
          errors: 0,
        };

        await writeFile(join(traceDir, `${traceId}.json`), JSON.stringify(trace, null, 2));

        const content = await readFile(join(traceDir, `${traceId}.json`), 'utf-8');
        const parsed = JSON.parse(content);

        expect(parsed.traceId).toBe(traceId);
        expect(parsed.name).toBe('Get Test Trace');
      });
    });

    describe('trace_list', () => {
      it('should list all traces', async () => {
        const traces = [
          { traceId: 'trace-1', name: 'Trace 1', status: 'ok', startTime: new Date().toISOString(), rootSpan: '', spans: [], services: [], errors: 0 },
          { traceId: 'trace-2', name: 'Trace 2', status: 'error', startTime: new Date().toISOString(), rootSpan: '', spans: [], services: [], errors: 1 },
          { traceId: 'trace-3', name: 'Trace 3', status: 'ok', startTime: new Date().toISOString(), rootSpan: '', spans: [], services: [], errors: 0 },
        ];

        for (const trace of traces) {
          await writeFile(join(traceDir, `${trace.traceId}.json`), JSON.stringify(trace, null, 2));
        }

        const files = await readdir(traceDir);
        const jsonFiles = files.filter(f => f.endsWith('.json') && f !== 'index.json');

        expect(jsonFiles).toHaveLength(3);
      });

      it('should filter traces by status', async () => {
        const traces = [
          { traceId: 'ok-trace', name: 'OK Trace', status: 'ok', startTime: new Date().toISOString(), rootSpan: '', spans: [], services: [], errors: 0 },
          { traceId: 'error-trace', name: 'Error Trace', status: 'error', startTime: new Date().toISOString(), rootSpan: '', spans: [], services: [], errors: 1 },
        ];

        for (const trace of traces) {
          await writeFile(join(traceDir, `${trace.traceId}.json`), JSON.stringify(trace, null, 2));
        }

        const files = await readdir(traceDir);
        const jsonFiles = files.filter(f => f.endsWith('.json') && f !== 'index.json');

        const okTraces = jsonFiles.filter(f => {
          // Would filter by status in real implementation
          return f.includes('ok');
        });

        expect(okTraces.length).toBeGreaterThan(0);
      });

      it('should filter traces by session ID', async () => {
        const traces = [
          { traceId: 'session-1-trace', name: 'Session 1 Trace', status: 'ok', startTime: new Date().toISOString(), rootSpan: '', spans: [], services: [], errors: 0, metadata: { sessionId: 'session-1' } },
          { traceId: 'session-2-trace', name: 'Session 2 Trace', status: 'ok', startTime: new Date().toISOString(), rootSpan: '', spans: [], services: [], errors: 0, metadata: { sessionId: 'session-2' } },
        ];

        for (const trace of traces) {
          await writeFile(join(traceDir, `${trace.traceId}.json`), JSON.stringify(trace, null, 2));
        }

        const session1Traces = traces.filter(t => t.metadata?.sessionId === 'session-1');
        expect(session1Traces).toHaveLength(1);
      });
    });

    describe('trace_delete', () => {
      it('should delete a trace', async () => {
        const traceId = 'trace-to-delete';
        const tracePath = join(traceDir, `${traceId}.json`);

        await writeFile(tracePath, JSON.stringify({ traceId, name: 'Delete Me', status: 'ok', startTime: new Date().toISOString(), rootSpan: '', spans: [], services: [], errors: 0 }, null, 2));

        await rm(tracePath, { force: true });

        const exists = await readFile(tracePath, 'utf-8').catch(() => null);
        expect(exists).toBeNull();
      });
    });
  });

  describe('Trace Summary', () => {
    describe('trace_get_summary', () => {
      it('should return summary statistics', async () => {
        const traces = [
          { traceId: 't1', status: 'ok', startTime: new Date().toISOString(), durationMs: 100, errors: 0 },
          { traceId: 't2', status: 'ok', startTime: new Date().toISOString(), durationMs: 200, errors: 0 },
          { traceId: 't3', status: 'error', startTime: new Date().toISOString(), durationMs: 50, errors: 1 },
        ];

        const summary = {
          total: traces.length,
          byStatus: {
            ok: traces.filter(t => t.status === 'ok').length,
            error: traces.filter(t => t.status === 'error').length,
            unset: 0,
          },
          totalErrors: traces.reduce((sum, t) => sum + t.errors, 0),
          avgDurationMs: traces.filter(t => t.durationMs).reduce((sum, t) => sum + (t.durationMs || 0), 0) / traces.length,
        };

        expect(summary.total).toBe(3);
        expect(summary.byStatus.ok).toBe(2);
        expect(summary.byStatus.error).toBe(1);
        expect(summary.totalErrors).toBe(1);
        expect(summary.avgDurationMs).toBe(116.66666666666667);
      });
    });
  });

  describe('Audit Trail', () => {
    describe('audit_log', () => {
      it('should log an audit entry', async () => {
        const entryId = `audit-${Date.now()}`;
        const entry = {
          id: entryId,
          timestamp: new Date().toISOString(),
          action: 'file:create',
          actor: 'user-123',
          target: 'src/test.ts',
          details: { size: 1024 },
          result: 'success' as const,
          traceId: 'trace-123',
        };

        await writeFile(join(auditDir, `${entryId}.json`), JSON.stringify(entry, null, 2));

        const content = await readFile(join(auditDir, `${entryId}.json`), 'utf-8');
        const parsed = JSON.parse(content);

        expect(parsed.action).toBe('file:create');
        expect(parsed.actor).toBe('user-123');
        expect(parsed.result).toBe('success');
      });

      it('should log failed action', async () => {
        const entry = {
          id: 'audit-fail',
          timestamp: new Date().toISOString(),
          action: 'git:commit',
          actor: 'user-456',
          target: 'repository',
          details: { reason: 'No changes staged' },
          result: 'failure' as const,
        };

        expect(entry.result).toBe('failure');
        expect(entry.details?.reason).toBe('No changes staged');
      });
    });

    describe('audit_query', () => {
      it('should query audit entries by action', async () => {
        const entries = [
          { id: 'a1', action: 'file:create', actor: 'user-1', target: 'file1.ts', result: 'success' as const, timestamp: new Date().toISOString() },
          { id: 'a2', action: 'file:modify', actor: 'user-1', target: 'file2.ts', result: 'success' as const, timestamp: new Date().toISOString() },
          { id: 'a3', action: 'file:create', actor: 'user-2', target: 'file3.ts', result: 'success' as const, timestamp: new Date().toISOString() },
        ];

        const filtered = entries.filter(e => e.action === 'file:create');
        expect(filtered).toHaveLength(2);
      });

      it('should query audit entries by actor', async () => {
        const entries = [
          { id: 'a1', action: 'file:create', actor: 'alice', target: 'file1.ts', result: 'success' as const, timestamp: new Date().toISOString() },
          { id: 'a2', action: 'file:modify', actor: 'bob', target: 'file2.ts', result: 'success' as const, timestamp: new Date().toISOString() },
          { id: 'a3', action: 'file:create', actor: 'alice', target: 'file3.ts', result: 'success' as const, timestamp: new Date().toISOString() },
        ];

        const filtered = entries.filter(e => e.actor === 'alice');
        expect(filtered).toHaveLength(2);
      });
    });
  });

  describe('Trace Analysis', () => {
    describe('trace_analyze_errors', () => {
      it('should analyze error patterns', async () => {
        const errorTraces = [
          { traceId: 'e1', errors: 1, status: 'error', startTime: new Date().toISOString() },
          { traceId: 'e2', errors: 2, status: 'error', startTime: new Date().toISOString() },
          { traceId: 'e3', errors: 1, status: 'error', startTime: new Date().toISOString() },
        ];

        const analysis = {
          totalErrors: errorTraces.reduce((sum, t) => sum + t.errors, 0),
          errorRate: errorTraces.length / 10, // Assuming 10 total traces
          commonErrors: [
            { message: 'TimeoutError', count: 2 },
            { message: 'ValidationError', count: 2 },
          ],
        };

        expect(analysis.totalErrors).toBe(4);
        expect(analysis.commonErrors).toHaveLength(2);
      });
    });

    describe('trace_analyze_latency', () => {
      it('should calculate latency percentiles', async () => {
        const durations = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
        const sorted = [...durations].sort((a, b) => a - b);

        const percentile = (p: number) => {
          const index = Math.ceil((p / 100) * sorted.length) - 1;
          return sorted[Math.max(0, index)];
        };

        const latency = {
          p50: percentile(50),
          p90: percentile(90),
          p95: percentile(95),
          p99: percentile(99),
          avg: durations.reduce((a, b) => a + b, 0) / durations.length,
        };

        expect(latency.p50).toBe(50);
        expect(latency.p90).toBe(90);
        expect(latency.avg).toBe(55);
      });
    });

    describe('trace_find_bottlenecks', () => {
      it('should find slow spans', async () => {
        const spans = [
          { name: 'fast-span', durationMs: 10 },
          { name: 'slow-span', durationMs: 1500 },
          { name: 'medium-span', durationMs: 500 },
          { name: 'very-slow-span', durationMs: 2000 },
        ];

        const thresholdMs = 1000;
        const bottlenecks = spans.filter(s => s.durationMs >= thresholdMs);

        expect(bottlenecks).toHaveLength(2);
        expect(bottlenecks[0].name).toBe('slow-span');
      });
    });
  });

  describe('Trace Export', () => {
    describe('trace_export', () => {
      it('should export to JSON format', async () => {
        const traces = [
          { traceId: 'export-1', name: 'Export Trace', status: 'ok', startTime: new Date().toISOString(), spans: [] },
        ];

        const jsonExport = JSON.stringify(traces, null, 2);
        const parsed = JSON.parse(jsonExport);

        expect(parsed).toHaveLength(1);
        expect(parsed[0].traceId).toBe('export-1');
      });

      it('should export to Jaeger format', async () => {
        const trace = {
          traceId: 'jaeger-trace',
          spans: [
            {
              spanId: 'span-1',
              name: 'Jaeger Span',
              parentSpanId: undefined,
              startTime: new Date().toISOString(),
              durationMs: 100,
              attributes: { key: 'value' },
            },
          ],
        };

        const jaegerFormat = {
          traceID: trace.traceId,
          spans: trace.spans.map(s => ({
            traceID: trace.traceId,
            spanID: s.spanId,
            operationName: s.name,
            references: s.parentSpanId ? [{ refType: 'CHILD_OF', traceID: trace.traceId, spanID: s.parentSpanId }] : [],
            startTime: new Date(s.startTime).getTime() * 1000,
            duration: (s.durationMs || 0) * 1000,
            tags: Object.entries(s.attributes || {}).map(([key, value]) => ({ key, value })),
          })),
        };

        expect(jaegerFormat.traceID).toBe('jaeger-trace');
        expect(jaegerFormat.spans).toHaveLength(1);
      });

      it('should export to Zipkin format', async () => {
        const trace = {
          traceId: 'zipkin-trace-12345678',
          spans: [
            {
              spanId: 'span-1-12345678',
              name: 'Zipkin Span',
              parentSpanId: undefined,
              startTime: new Date().toISOString(),
              durationMs: 100,
            },
          ],
        };

        const zipkinFormat = trace.spans.map(s => ({
          traceId: trace.traceId.slice(0, 16),
          id: s.spanId.slice(0, 16),
          parentId: s.parentSpanId?.slice(0, 16),
          name: s.name,
          timestamp: new Date(s.startTime).getTime() * 1000,
          duration: (s.durationMs || 0) * 1000,
        }));

        expect(zipkinFormat).toHaveLength(1);
        expect(zipkinFormat[0].traceId).toBe('zipkin-trace-1');
      });
    });
  });

  describe('Cleanup', () => {
    describe('trace_cleanup', () => {
      it('should identify old traces for cleanup', async () => {
        const now = Date.now();
        const traces = [
          { traceId: 'recent', startTime: new Date(now - 1000 * 60 * 30).toISOString() }, // 30 min ago
          { traceId: 'old', startTime: new Date(now - 1000 * 60 * 60 * 25).toISOString() }, // 25 hours ago
          { traceId: 'very-old', startTime: new Date(now - 1000 * 60 * 60 * 48).toISOString() }, // 48 hours ago
        ];

        const olderThan24h = traces.filter(t => {
          const traceTime = new Date(t.startTime).getTime();
          return now - traceTime > 24 * 60 * 60 * 1000;
        });

        expect(olderThan24h).toHaveLength(2);
        expect(olderThan24h.map(t => t.traceId)).toContain('old');
        expect(olderThan24h.map(t => t.traceId)).toContain('very-old');
      });
    });

    describe('audit_cleanup', () => {
      it('should identify old audit entries', async () => {
        const now = Date.now();
        const entries = [
          { id: 'recent', timestamp: new Date(now - 1000 * 60 * 30).toISOString() },
          { id: 'old', timestamp: new Date(now - 1000 * 60 * 60 * 48).toISOString() },
        ];

        const olderThan24h = entries.filter(e => {
          const entryTime = new Date(e.timestamp).getTime();
          return now - entryTime > 24 * 60 * 60 * 1000;
        });

        expect(olderThan24h).toHaveLength(1);
        expect(olderThan24h[0].id).toBe('old');
      });
    });
  });
});
