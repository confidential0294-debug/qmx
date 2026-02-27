#!/usr/bin/env python3
"""QMX Worker Launcher using pexpect for PTY interaction"""

import os
import sys
import pexpect
import time

# Parse worker identity from environment
team_worker = os.environ.get('QMX_TEAM_WORKER', 'unknown/worker-1')
team = team_worker.split('/')[0]
worker = team_worker.split('/')[1] if '/' in team_worker else 'worker-1'

# Get qwen args
qwen_args = sys.argv[1:] if len(sys.argv) > 1 else ['-y']

# Worker prompt
prompt = f"You are {worker} on team {team}. Read your inbox at .qmx/state/team/{team}/workers/{worker}/inbox.md and follow the instructions there. Send ACK to leader-fixed when ready."

# Spawn qwen with PTY
cmd = f"qwen {' '.join(qwen_args)}"
print(f"[qmx-worker] Spawning: {cmd}", file=sys.stderr)

child = pexpect.spawn(cmd, encoding='utf-8', echo=True, timeout=120)
child.logfile_read = sys.stdout

# Wait for qwen to show its UI
print(f"[qmx-worker] Waiting for qwen to start...", file=sys.stderr)
time.sleep(3)

# Send the prompt followed by Enter
print(f"[qmx-worker] Sending prompt...", file=sys.stderr)
child.sendline(prompt)

# Keep interacting
print(f"[qmx-worker] Entering interactive mode...", file=sys.stderr)
try:
    child.interact()
except KeyboardInterrupt:
    pass
finally:
    child.close()
    print(f"[qmx-worker] Closed", file=sys.stderr)
