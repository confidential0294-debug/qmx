---
name: worker
description: QMX Team worker protocol (ACK, mailbox, task lifecycle) for tmux-based QMX teams
---

# QMX Worker Skill

This skill is for a Qwen session that was started as a QMX Team worker (a tmux pane spawned by `qmx team start`).

## Identity

You MUST be running with `QMX_TEAM_WORKER` set. It looks like:

`<team-name>/worker-<n>`

Example: `bug-hunt/worker-1`

## Startup Protocol (ACK)

1. Parse `QMX_TEAM_WORKER` into:
   - `teamName` (before the `/`)
   - `workerName` (after the `/`, usually `worker-<n>`)
2. Send an ACK to the lead mailbox:
   - Recipient worker id: `leader-fixed`
   - Body: one short line including your workerName and what you're ready to do.
3. After ACK, proceed to your inbox instructions.

The lead will see your message in:

`.qmx/state/team/<teamName>/mailbox/leader-fixed.json`

## Inbox + Tasks

1. Read your inbox:
   `.qmx/state/team/<teamName>/workers/<workerName>/inbox.md`
2. Pick the first unblocked task assigned to you.
3. Read the task file:
   `.qmx/state/team/<teamName>/tasks/task-<id>.json` (example: `task-1.json`)
4. Task id format:
   - Use the numeric id (`"1"`), not `"task-1"`.
5. Claim the task (do NOT start work without a claim).
6. Do the work.
7. Write completion to the task file:
   - `{"status":"completed","result":"..."}` or `{"status":"failed","error":"..."}`
8. Update your worker status:
   `.qmx/state/team/<teamName>/workers/<workerName>/status.json` with `{"state":"idle", ...}`

## Mailbox

Check your mailbox for messages:

`.qmx/state/team/<teamName>/mailbox/<workerName>.json`

When notified, read messages and follow any instructions.

## Shutdown Protocol

When you receive a shutdown request or complete all tasks:

1. **Write shutdown ACK** to:
   `.qmx/state/team/<teamName>/workers/<workerName>/shutdown-ack.json`
2. **Format**:
   ```json
   {"status":"accept","reason":"ok","updated_at":"<iso>"}
   ```
3. **Update status** to `{"state":"shutdown"}`
4. **Exit** the Qwen session with `exit` command

## Quick Commands

```
# Send ACK
team_send_message({team_name, from_worker, to_worker:"leader-fixed", body:"ACK..."})

# Claim task
team_claim_task({team_name, task_id:"1", worker:"worker-1", expected_version:1})

# Update task
team_update_task({team_name, task_id:"1", status:"completed", result:"..."})

# Check mailbox
team_mailbox_list({team_name, worker:"worker-1"})
```
