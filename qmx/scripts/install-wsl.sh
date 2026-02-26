#!/bin/bash
# QMX Installation Script for WSL
# Run this in WSL to install QMX and team command

set -e

echo "╔════════════════════════════════════════════════════╗"
echo "║         QMX Installation for WSL                   ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✓ Node.js found: $NODE_VERSION"
else
    echo "✗ Node.js not found"
    echo "  Please install Node.js 20+ or use nvm"
    exit 1
fi

# Check tmux
if command -v tmux &> /dev/null; then
    TMUX_VERSION=$(tmux -V)
    echo "✓ tmux found: $TMUX_VERSION"
else
    echo "✗ tmux not found"
    echo "  Install with: sudo apt install tmux"
    exit 1
fi

echo ""

# Check Node version >= 20
NODE_MAJOR=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_MAJOR" -lt 20 ]; then
    echo "⚠ Warning: Node.js version should be >= 20"
    echo "  Current: $NODE_VERSION"
    echo "  Consider using nvm: nvm install 20"
fi

echo ""

# Get QMX directory
QMX_SRC="${1:-/mnt/c/Users/Twisted/.qwen/tmp/qmx}"
QMX_DEST="$HOME/qmx"

if [ -d "$QMX_SRC" ]; then
    echo "📦 Copying QMX from $QMX_SRC to $QMX_DEST..."
    cp -r "$QMX_SRC" "$QMX_DEST"
else
    echo "📦 QMX source found at $QMX_DEST"
fi

cd "$QMX_DEST"

echo ""
echo "🔧 Installing dependencies..."
npm install

echo ""
echo "🏗️  Building TypeScript..."
npm run build

echo ""
echo "📦 Installing globally (local prefix)..."
npm install -g --prefix ~/.local

echo ""
echo "🚀 Installing team command..."
mkdir -p ~/bin
cp "$QMX_DEST/scripts/team" ~/bin/
chmod +x ~/bin/team

echo ""
echo "📝 Updating PATH in ~/.bashrc..."
if ! grep -q '.local/bin' ~/.bashrc; then
    echo '' >> ~/.bashrc
    echo 'export PATH="$HOME/.local/bin:$HOME/bin:$PATH"' >> ~/.bashrc
    echo "✓ Added to ~/.bashrc"
else
    echo "✓ PATH already configured in ~/.bashrc"
fi

echo ""
echo "✅ Installation complete!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next steps:"
echo "  1. Run: source ~/.bashrc"
echo "  2. Test: qmx --version"
echo "  3. Test: team 2:executor \"Test command\""
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
