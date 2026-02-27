/**
 * QMX Team Operations
 * 
 * Core types and operations for team management.
 * Follows omx patterns with qwx enhancements.
 */

import { join } from 'node:path';
import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';

// ============================================================================
// Type Definitions
// ============================================================================

export interface TeamConfig {
  name: string;
  task: string;
  agentType: string;
  workerCount: number;
  cwd: string;
  leader_cwd: string;
  team_state_root: string;
  tmux_session: string | null;
  leader_pane_id: string | null;
  hud_pane_id: string | null;
  resize_hook_name: string | null;
  resize_hook_target: string | null;
  worker_launch_mode: 'interactive' | 'prompt';
  display_mode: 'split_pane' | 'auto';
  workspace_mode: 'single' | 'worktree';
  workers: WorkerConfig[];
  created_at: string;
  updated_at: string;
  max_workers: number;
}

export interface WorkerConfig {
  name: string;
  index: number;
  pane_id: string | null;
  pid: number | null;
  worker_cli: 'qwen' | 'codex';
  model?: string;
  cwd: string;
  worktree_path?: string;
  worktree_branch?: string;
  worktree_detached?: boolean;
}

export interface WorkerStatus {
  worker: string;
  state: 'idle' | 'busy' | 'blocked' | 'shutdown';
  current_task_id?: string;
  last_turn_id?: string;
  updated_at: string;
}

export interface WorkerHeartbeat {
  worker: string;
  alive: boolean;
  pid?: number;
  last_seen: string;
  turns_without_progress: number;
}

export interface TeamTask {
  id: string;
  subject: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'failed';
  owner?: string;
  blocked_by: string[];
  requires_code_change?: boolean;
  version: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  result?: string;
}

export interface MailboxMessage {
  message_id: string;
  from_worker: string;
  to_worker: string;
  body: string;
  created_at: string;
  notified: boolean;
  notified_at?: string;
}

export interface DispatchRequest {
  request_id: string;
  kind: 'inbox' | 'mailbox';
  to_worker: string;
  worker_index: number;
  pane_id: string | null;
  trigger_message: string;
  message_id?: string;
  transport_preference: TransportPreference;
  fallback_allowed: boolean;
  status: 'queued' | 'dispatching' | 'notified' | 'delivered' | 'failed';
  inbox_correlation_key?: string;
  last_reason?: string;
  created_at: string;
  updated_at: string;
}

export type TransportPreference = 
  | 'hook_preferred_with_fallback'
  | 'transport_direct'
  | 'prompt_stdin';

export interface DispatchReceipt {
  request_id: string;
  status: 'queued' | 'dispatching' | 'notified' | 'delivered' | 'failed';
  last_reason?: string;
  updated_at: string;
}

// ============================================================================
// Path Helpers
// ============================================================================

export function teamDir(teamName: string, cwd: string): string {
  return join(cwd, '.qmx', 'state', 'team', teamName);
}

function workersDir(teamName: string, cwd: string): string {
  return join(teamDir(teamName, cwd), 'workers');
}

export function workerDir(teamName: string, workerName: string, cwd: string): string {
  return join(workersDir(teamName, cwd), workerName);
}

function tasksDir(teamName: string, cwd: string): string {
  return join(teamDir(teamName, cwd), 'tasks');
}

function mailboxDir(teamName: string, cwd: string): string {
  return join(teamDir(teamName, cwd), 'mailbox');
}

function dispatchDir(teamName: string, cwd: string): string {
  return join(teamDir(teamName, cwd), 'dispatch', 'requests');
}

// ============================================================================
// Config Operations
// ============================================================================

export async function saveTeamConfig(config: TeamConfig, cwd: string): Promise<void> {
  const dir = teamDir(config.name, cwd);
  await mkdir(dir, { recursive: true });
  const path = join(dir, 'config.json');
  await writeFile(path, JSON.stringify(config, null, 2), 'utf-8');
}

export async function readTeamConfig(teamName: string, cwd: string): Promise<TeamConfig | null> {
  const path = join(teamDir(teamName, cwd), 'config.json');
  try {
    const content = await readFile(path, 'utf-8');
    return JSON.parse(content) as TeamConfig;
  } catch {
    return null;
  }
}

// ============================================================================
// Worker Status Operations
// ============================================================================

export async function writeWorkerStatus(
  teamName: string,
  workerName: string,
  status: WorkerStatus,
  cwd: string
): Promise<void> {
  const dir = workerDir(teamName, workerName, cwd);
  await mkdir(dir, { recursive: true });
  const path = join(dir, 'status.json');
  await writeFile(path, JSON.stringify(status, null, 2), 'utf-8');
}

export async function readWorkerStatus(
  teamName: string,
  workerName: string,
  cwd: string
): Promise<WorkerStatus | null> {
  const path = join(workerDir(teamName, workerName, cwd), 'status.json');
  try {
    const content = await readFile(path, 'utf-8');
    return JSON.parse(content) as WorkerStatus;
  } catch {
    return null;
  }
}

// ============================================================================
// Worker Heartbeat Operations
// ============================================================================

export async function writeWorkerHeartbeat(
  teamName: string,
  workerName: string,
  heartbeat: WorkerHeartbeat,
  cwd: string
): Promise<void> {
  const dir = workerDir(teamName, workerName, cwd);
  await mkdir(dir, { recursive: true });
  const path = join(dir, 'heartbeat.json');
  await writeFile(path, JSON.stringify(heartbeat, null, 2), 'utf-8');
}

export async function readWorkerHeartbeat(
  teamName: string,
  workerName: string,
  cwd: string
): Promise<WorkerHeartbeat | null> {
  const path = join(workerDir(teamName, workerName, cwd), 'heartbeat.json');
  try {
    const content = await readFile(path, 'utf-8');
    return JSON.parse(content) as WorkerHeartbeat;
  } catch {
    return null;
  }
}

// ============================================================================
// Task Operations
// ============================================================================

export async function createTeamTask(
  teamName: string,
  task: Omit<TeamTask, 'id' | 'version' | 'created_at' | 'updated_at'>,
  cwd: string
): Promise<TeamTask> {
  const dir = tasksDir(teamName, cwd);
  await mkdir(dir, { recursive: true });
  
  // Get next task ID
  const existingTasks = await listTasks(teamName, cwd);
  const nextId = existingTasks.length > 0 
    ? Math.max(...existingTasks.map(t => parseInt(t.id))) + 1 
    : 1;
  
  const newTask: TeamTask = {
    ...task,
    id: String(nextId),
    version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  const path = join(dir, `task-${nextId}.json`);
  await writeFile(path, JSON.stringify(newTask, null, 2), 'utf-8');
  
  return newTask;
}

export async function readTask(
  teamName: string,
  taskId: string,
  cwd: string
): Promise<TeamTask | null> {
  const path = join(tasksDir(teamName, cwd), `task-${taskId}.json`);
  try {
    const content = await readFile(path, 'utf-8');
    return JSON.parse(content) as TeamTask;
  } catch {
    return null;
  }
}

export async function updateTask(
  teamName: string,
  task: TeamTask,
  cwd: string
): Promise<TeamTask> {
  task.version += 1;
  task.updated_at = new Date().toISOString();
  
  const path = join(tasksDir(teamName, cwd), `task-${task.id}.json`);
  await writeFile(path, JSON.stringify(task, null, 2), 'utf-8');
  
  return task;
}

export async function listTasks(
  teamName: string,
  cwd: string
): Promise<TeamTask[]> {
  const dir = tasksDir(teamName, cwd);
  if (!existsSync(dir)) return [];
  
  try {
    const files = await readdirSafe(dir);
    const taskFiles = files.filter(f => f.startsWith('task-') && f.endsWith('.json'));
    
    const tasks: TeamTask[] = [];
    for (const file of taskFiles) {
      const path = join(dir, file);
      try {
        const content = await readFile(path, 'utf-8');
        tasks.push(JSON.parse(content) as TeamTask);
      } catch {
        // Skip invalid files
      }
    }
    
    return tasks.sort((a, b) => parseInt(a.id) - parseInt(b.id));
  } catch {
    return [];
  }
}

async function readdirSafe(dir: string): Promise<string[]> {
  try {
    const { readdir } = await import('node:fs/promises');
    return await readdir(dir);
  } catch {
    return [];
  }
}

// ============================================================================
// Mailbox Operations
// ============================================================================

export async function sendMailboxMessage(
  teamName: string,
  fromWorker: string,
  toWorker: string,
  body: string,
  cwd: string
): Promise<MailboxMessage> {
  const dir = mailboxDir(teamName, cwd);
  await mkdir(dir, { recursive: true });
  
  const message: MailboxMessage = {
    message_id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    from_worker: fromWorker,
    to_worker: toWorker,
    body,
    created_at: new Date().toISOString(),
    notified: false,
  };
  
  const path = join(dir, `${toWorker}.json`);
  
  // Append to existing mailbox or create new
  let messages: MailboxMessage[] = [];
  try {
    const content = await readFile(path, 'utf-8');
    messages = JSON.parse(content) as MailboxMessage[];
  } catch {
    // File doesn't exist yet
  }
  
  messages.push(message);
  await writeFile(path, JSON.stringify(messages, null, 2), 'utf-8');
  
  return message;
}

export async function readMailbox(
  teamName: string,
  workerName: string,
  cwd: string
): Promise<MailboxMessage[]> {
  const path = join(mailboxDir(teamName, cwd), `${workerName}.json`);
  try {
    const content = await readFile(path, 'utf-8');
    return JSON.parse(content) as MailboxMessage[];
  } catch {
    return [];
  }
}

export async function markMessageNotified(
  teamName: string,
  workerName: string,
  messageId: string,
  cwd: string
): Promise<boolean> {
  const path = join(mailboxDir(teamName, cwd), `${workerName}.json`);
  try {
    const content = await readFile(path, 'utf-8');
    const messages: MailboxMessage[] = JSON.parse(content);
    
    let updated = false;
    for (const msg of messages) {
      if (msg.message_id === messageId && !msg.notified) {
        msg.notified = true;
        msg.notified_at = new Date().toISOString();
        updated = true;
      }
    }
    
    if (updated) {
      await writeFile(path, JSON.stringify(messages, null, 2), 'utf-8');
    }
    
    return updated;
  } catch {
    return false;
  }
}

// ============================================================================
// Dispatch Request Operations
// ============================================================================

export async function enqueueDispatchRequest(
  teamName: string,
  request: Omit<DispatchRequest, 'request_id' | 'status' | 'created_at' | 'updated_at'>,
  cwd: string
): Promise<{ request: DispatchRequest; deduped: boolean }> {
  const dir = dispatchDir(teamName, cwd);
  await mkdir(dir, { recursive: true });
  
  // Check for duplicate pending requests
  const existingRequests = await listDispatchRequests(teamName, cwd);
  const duplicate = existingRequests.find(
    r => r.to_worker === request.to_worker && 
         r.status !== 'delivered' && 
         r.status !== 'failed' &&
         r.inbox_correlation_key === request.inbox_correlation_key
  );
  
  if (duplicate) {
    return { request: duplicate, deduped: true };
  }
  
  const newRequest: DispatchRequest = {
    ...request,
    request_id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    status: 'queued',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  const path = join(dir, `${newRequest.request_id}.json`);
  await writeFile(path, JSON.stringify(newRequest, null, 2), 'utf-8');
  
  return { request: newRequest, deduped: false };
}

export async function readDispatchRequest(
  teamName: string,
  requestId: string,
  cwd: string
): Promise<DispatchRequest | null> {
  const path = join(dispatchDir(teamName, cwd), `${requestId}.json`);
  try {
    const content = await readFile(path, 'utf-8');
    return JSON.parse(content) as DispatchRequest;
  } catch {
    return null;
  }
}

export async function transitionDispatchRequest(
  teamName: string,
  requestId: string,
  fromStatus: DispatchRequest['status'],
  toStatus: DispatchRequest['status'],
  metadata: { message_id?: string; last_reason?: string },
  cwd: string
): Promise<boolean> {
  const request = await readDispatchRequest(teamName, requestId, cwd);
  if (!request || request.status !== fromStatus) {
    return false;
  }
  
  request.status = toStatus;
  request.updated_at = new Date().toISOString();
  if (metadata.message_id) request.message_id = metadata.message_id;
  if (metadata.last_reason) request.last_reason = metadata.last_reason;
  
  const path = join(dispatchDir(teamName, cwd), `${requestId}.json`);
  await writeFile(path, JSON.stringify(request, null, 2), 'utf-8');
  
  return true;
}

export async function markDispatchRequestNotified(
  teamName: string,
  requestId: string,
  metadata: { last_reason?: string },
  cwd: string
): Promise<boolean> {
  return transitionDispatchRequest(teamName, requestId, 'dispatching', 'notified', metadata, cwd);
}

export async function listDispatchRequests(
  teamName: string,
  cwd: string
): Promise<DispatchRequest[]> {
  const dir = dispatchDir(teamName, cwd);
  if (!existsSync(dir)) return [];
  
  try {
    const files = await readdirSafe(dir);
    const requestFiles = files.filter(f => f.endsWith('.json'));
    
    const requests: DispatchRequest[] = [];
    for (const file of requestFiles) {
      const path = join(dir, file);
      try {
        const content = await readFile(path, 'utf-8');
        requests.push(JSON.parse(content) as DispatchRequest);
      } catch {
        // Skip invalid files
      }
    }
    
    return requests.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  } catch {
    return [];
  }
}

export async function waitForDispatchReceipt(
  teamName: string,
  requestId: string,
  cwd: string,
  options: { timeoutMs: number; pollMs: number }
): Promise<DispatchReceipt | null> {
  const { timeoutMs, pollMs } = options;
  const deadline = Date.now() + timeoutMs;
  
  while (Date.now() < deadline) {
    const request = await readDispatchRequest(teamName, requestId, cwd);
    if (!request) {
      return null;
    }
    
    if (request.status === 'notified' || request.status === 'delivered' || request.status === 'failed') {
      return {
        request_id: request.request_id,
        status: request.status,
        last_reason: request.last_reason,
        updated_at: request.updated_at,
      };
    }
    
    await sleep(pollMs);
  }
  
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
