#!/bin/bash
# QMX Team Command - System-wide Installation Script
# Run with sudo to install /team command system-wide

set -e

echo "╔════════════════════════════════════════════════════╗"
echo "║    QMX Team Command - System-wide Installation     ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""

TEAM_SCRIPT="/mnt/c/Users/Twisted/.qwen/tmp/qmx/scripts/team"
INSTALL_DIR="/usr/local/bin"
INSTALL_PATH="$INSTALL_DIR/team"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run with sudo:"
    echo "  sudo bash $0"
    exit 1
fi

# Check if source exists
if [ ! -f "$TEAM_SCRIPT" ]; then
    echo "Error: Source script not found at $TEAM_SCRIPT"
    exit 1
fi

# Install
echo "📦 Installing team command to $INSTALL_PATH..."
cp "$TEAM_SCRIPT" "$INSTALL_PATH"
chmod +x "$INSTALL_PATH"

# Verify
echo ""
echo "✅ Installation complete!"
echo ""
echo "Testing..."
if command -v team &> /dev/null; then
    echo "✓ team command is now available system-wide"
    echo ""
    echo "Usage:"
    echo "  team 3:executor \"Your task here\""
    echo ""
    echo "Location: $INSTALL_PATH"
else
    echo "⚠ team command installed but not in PATH"
    echo "  Users may need to add $INSTALL_DIR to their PATH"
fi

echo ""
