/**
 * QMX Worker Bootstrap
 * 
 * Generates inbox files and worker instructions.
 * Follows omx patterns with qwx enhancements.
 */

import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { join, dirname } from 'node:path';
// import { workerDir, teamDir } from './team-ops.js';

const TEAM_OVERLAY_START = '<!-- QMX:TEAM:WORKER:START -->';
const TEAM_OVERLAY_END = '<!-- QMX:TEAM:WORKER:END -->';

/**
 * Generate worker overlay for AGENTS.md
 */
export function generateWorkerOverlay(teamName: string): string {
  return `${TEAM_OVERLAY_START}
<qmx_team_worker_protocol>
You are a QMX team worker in team "${teamName}". Your identity and assigned tasks are in your inbox file.

## Quick Start

1. **Load the worker skill**: Read and follow \`skills/worker/SKILL.md\`
2. **Send ACK**: Use MCP tool to send startup message to \`leader-fixed\`
3. **Read inbox**: \`.qmx/state/team/${teamName}/workers/{your-worker-name}/inbox.md\`
4. **Claim task**: Use state API with bare ID (e.g., "1" not "task-1")
5. **Execute work**: Complete the task as described
6. **Report results**: Write completion to task file and status.json
7. **Check mailbox**: \`.qmx/state/team/${teamName}/mailbox/{your-worker-name}.json\`

## Environment

- \`QMX_TEAM_WORKER=${teamName}/worker-{n}\`
- \`QMX_TEAM_STATE_ROOT=.qmx/state\`
- Auto-approval enabled (-y flag)

## Rules

- Do NOT edit files outside your task description
- Do NOT spawn sub-agents
- Report blockers immediately via status file
- Use MCP tools for team coordination
</qmx_team_worker_protocol>
${TEAM_OVERLAY_END}`;
}

/**
 * Generate inbox content for initial task assignment
 */
export function generateInitialInbox(
  workerName: string,
  teamName: string,
  agentType: string,
  taskDescription: string
): string {
  return `# Worker Assignment: ${workerName}

**Team:** ${teamName}
**Role:** ${agentType}
**Worker Name:** ${workerName}

## Your Assigned Tasks

- **Task 1**: Worker 1 bootstrap
  Description: ${taskDescription}

Report findings/results back to the lead and keep task updates current.
  Status: pending

## Instructions

1. Load and follow \`skills/worker/SKILL.md\`
2. Send startup ACK to the lead mailbox with \`to_worker="leader-fixed"\`
   - Body: "ACK from ${workerName}: initialized and ready to execute assigned tasks."
3. Start with the first non-blocked task
4. Read the task file for your selected task id at \`.qmx/state/team/${teamName}/tasks/task-<id>.json\` (example: \`task-1.json\`)
5. Task id format:
   - State/MCP APIs use \`task_id: "<id>"\` (example: \`"1"\`), not \`"task-1"\`.
6. Claim the task to claim it
7. Complete the work described in the task
8. Write \`{"status": "completed", "result": "brief summary"}\` to the task file
9. Write \`{"state": "idle"}\` to \`.qmx/state/team/${teamName}/workers/${workerName}/status.json\`
10. Wait for the next instruction from the lead

## Scope Rules
- Only edit files described in your task descriptions
- Do NOT edit files that belong to other workers
- If you need to modify a shared/common file, write \`{"state": "blocked", "reason": "need to edit shared file X"}\` to your status file and wait
- Do NOT spawn sub-agents. Complete work in this worker session.
`;
}

/**
 * Generate inbox content for follow-up task assignment
 */
export function generateTaskAssignmentInbox(
  workerName: string,
  teamName: string,
  taskId: string,
  taskDescription: string
): string {
  return `# New Task Assignment

**Worker:** ${workerName}
**Task ID:** ${taskId}

## Task Description

${taskDescription}

## Instructions

1. Read task file at \`.qmx/state/team/${teamName}/tasks/task-${taskId}.json\`
2. Task ID for APIs: "${taskId}" (not "task-${taskId}")
3. Claim task via state API
4. Complete the work
5. Write \`{"status": "completed", "result": "summary"}\` when done
6. Write \`{"state": "idle"}\` to your status file

## Verification

Include verification evidence with your completion report.
`;
}

/**
 * Generate shutdown inbox content
 */
export function generateShutdownInbox(teamName: string, workerName: string): string {
  return `# Shutdown Request

All tasks are complete. Please acknowledge shutdown.

## Shutdown Protocol

1. Write acknowledgment to:
   \`.qmx/state/team/${teamName}/workers/${workerName}/shutdown-ack.json\`
2. Format:
   - Accept: \`{"status":"accept","reason":"ok","updated_at":"<iso>"}\`
   - Reject: \`{"status":"reject","reason":"still working","updated_at":"<iso>"}\`
3. Exit your qwx session after writing acknowledgment

Type \`exit\` or press Ctrl+C to end your session.
`;
}

/**
 * Generate trigger message for tmux send-keys (<200 chars)
 */
export function generateTriggerMessage(workerName: string, teamName: string): string {
  return `Read and follow instructions in .qmx/state/team/${teamName}/workers/${workerName}/inbox.md`;
}

/**
 * Generate mailbox trigger message
 */
export function generateMailboxTriggerMessage(
  workerName: string,
  teamName: string,
  count: number
): string {
  const n = Math.max(1, Math.floor(count));
  return `You have ${n} new message(s). Check .qmx/state/team/${teamName}/mailbox/${workerName}.json`;
}

/**
 * Write worker instructions file (team-scoped AGENTS.md)
 */
export async function writeTeamWorkerInstructionsFile(
  teamName: string,
  cwd: string,
  overlay: string
): Promise<string> {
  const projectAgentsPath = join(cwd, 'AGENTS.md');
  let base = '';
  
  try {
    base = await readFile(projectAgentsPath, 'utf-8');
    base = stripWorkerOverlay(base);
  } catch {
    // No project AGENTS.md
  }
  
  const composed = base.trim().length > 0
    ? `${base.trimEnd()}\n\n${overlay}\n`
    : `${overlay}\n`;
  
  const outPath = join(cwd, '.qmx', 'state', 'team', teamName, 'worker-agents.md');
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, composed, 'utf-8');
  
  return outPath;
}

/**
 * Remove team worker instructions file
 */
export async function removeTeamWorkerInstructionsFile(
  teamName: string,
  cwd: string
): Promise<void> {
  const outPath = join(cwd, '.qmx', 'state', 'team', teamName, 'worker-agents.md');
  await rm(outPath, { force: true }).catch(() => {});
}

/**
 * Strip worker overlay from content
 */
function stripWorkerOverlay(content: string): string {
  const startIdx = content.indexOf(TEAM_OVERLAY_START);
  const endIdx = content.indexOf(TEAM_OVERLAY_END);
  
  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    return content;
  }
  
  const before = content.slice(0, startIdx).trimEnd();
  const after = content.slice(endIdx + TEAM_OVERLAY_END.length).trimStart();
  
  return before + (after ? '\n\n' + after : '') + '\n';
}
