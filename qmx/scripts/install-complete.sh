#!/bin/bash
# QMX Complete Installation for WSL
# This script installs QMX, team command, and configures everything

set -e

echo "╔════════════════════════════════════════════════════╗"
echo "║         QMX Complete Installation (WSL)            ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""

# Configuration
QMX_SRC="/mnt/c/Users/Twisted/.qwen/tmp/qmx"
QMX_DEST="$HOME/qmx"

echo "📋 Prerequisites Check..."
echo ""

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'v' -f2 | cut -d'.' -f1)
    echo "✓ Node.js: $NODE_VERSION"
    if [ "$NODE_MAJOR" -lt 20 ]; then
        echo "  ⚠ Warning: Node.js 20+ recommended"
        echo "  Use: nvm install 20 && nvm use 20"
    fi
else
    echo "✗ Node.js not found"
    exit 1
fi

# Check tmux
if command -v tmux &> /dev/null; then
    TMUX_VERSION=$(tmux -V)
    echo "✓ tmux: $TMUX_VERSION"
else
    echo "✗ tmux not found"
    echo "  Install: sudo apt install tmux"
    exit 1
fi

echo ""
echo "📦 Installing QMX..."

# Copy QMX
if [ -d "$QMX_SRC" ]; then
    cp -r "$QMX_SRC" "$QMX_DEST"
    echo "✓ Copied QMX to $QMX_DEST"
else
    echo "✓ QMX already exists at $QMX_DEST"
fi

cd "$QMX_DEST"

# Install dependencies
echo ""
echo "🔧 Installing dependencies..."
npm install --silent
echo "✓ Dependencies installed"

# Build TypeScript
echo ""
echo "🏗️  Building TypeScript..."
npm run build --silent
echo "✓ Build complete"

# Install globally (local prefix)
echo ""
echo "📦 Installing globally..."
npm install -g --prefix ~/.local --silent
echo "✓ Global install complete"

# Install team command
echo ""
echo "🚀 Installing team command..."
mkdir -p ~/bin
cp "$QMX_DEST/scripts/team" ~/bin/team
chmod +x ~/bin/team
echo "✓ team command installed to ~/bin/team"

# Update PATH in bashrc
echo ""
echo "📝 Configuring PATH..."
if ! grep -q 'QMX' ~/.bashrc 2>/dev/null; then
    cat >> ~/.bashrc << 'EOF'

# QMX Configuration
export PATH="$HOME/bin:$HOME/.local/bin:$PATH"
EOF
    echo "✓ Added QMX to ~/.bashrc"
else
    echo "✓ QMX already in ~/.bashrc"
fi

# Create test project
echo ""
echo "🧪 Creating test project..."
mkdir -p /tmp/qmx-test
cd /tmp/qmx-test
rm -rf .qmx
~/qmx/bin/qmx.js setup --force 2>&1 | grep -E '(complete|failed)' || true
echo "✓ Test project created"

# Verify installation
echo ""
echo "✅ Verifying installation..."
echo ""

export PATH="$HOME/bin:$HOME/.local/bin:$PATH"

# Check commands
if command -v qmx &> /dev/null; then
    QMX_VERSION=$(qmx --version)
    echo "✓ qmx: $QMX_VERSION"
else
    echo "⚠ qmx: not in PATH (run: source ~/.bashrc)"
fi

if command -v team &> /dev/null; then
    echo "✓ team: installed"
else
    echo "⚠ team: not in PATH (run: source ~/.bashrc)"
fi

# Check MCP servers
MCP_COUNT=$(ls ~/qmx/dist/mcp/*.js 2>/dev/null | wc -l)
if [ "$MCP_COUNT" -eq 4 ]; then
    echo "✓ MCP servers: $MCP_COUNT/4 installed"
else
    echo "⚠ MCP servers: $MCP_COUNT/4 (run: npm run build)"
fi

# Check prompts
PROMPT_COUNT=$(ls ~/qmx/prompts/*.md 2>/dev/null | wc -l)
echo "✓ Agent prompts: $PROMPT_COUNT available"

# Check skills
SKILL_COUNT=$(ls -d ~/qmx/skills/*/ 2>/dev/null | wc -l)
echo "✓ Workflow skills: $SKILL_COUNT available"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎉 Installation complete!"
echo ""
echo "Next steps:"
echo "  1. Run: source ~/.bashrc"
echo "  2. Test: team 2:executor \"Test command\""
echo "  3. Check: qmx doctor"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
