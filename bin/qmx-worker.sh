#!/bin/bash
# QMX Worker Launcher - Using -y --prompt-interactive with skill loading

TEAM_WORKER="${QMX_TEAM_WORKER:-unknown/worker-1}"
TEAM="${TEAM_WORKER%%/*}"
WORKER="${TEAM_WORKER##*/}"

# Find skills directory (check multiple locations)
if [ -f "skills/worker/SKILL.md" ]; then
    SKILL_PATH="skills/worker/SKILL.md"
elif [ -f ".qmx/skills/worker/SKILL.md" ]; then
    SKILL_PATH=".qmx/skills/worker/SKILL.md"
elif [ -f "/home/twisted/qmx/skills/worker/SKILL.md" ]; then
    SKILL_PATH="/home/twisted/qmx/skills/worker/SKILL.md"
else
    SKILL_PATH="skills/worker/SKILL.md"
fi

# Build prompt that instructs to load worker skill first (like OMX)
PROMPT="You are ${WORKER} on team ${TEAM}. First, load and follow the worker skill at ${SKILL_PATH}. Then read your inbox at .qmx/state/team/${TEAM}/workers/${WORKER}/inbox.md and follow the instructions there. Send ACK to leader-fixed when ready."

# Use -y --prompt-interactive which executes the prompt then continues interactive
# -y is necessary for auto-approval (YOLO mode)
qwen -y --prompt-interactive "$PROMPT"
