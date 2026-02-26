#!/bin/bash
# QMX Auto-Installer for WSL/Linux/macOS
# Detects environment and installs to correct paths

set -e

echo "╔════════════════════════════════════════════════════╗"
echo "║         QMX Auto-Installer                         ║"
echo "║         Detects WSL/Linux/macOS automatically      ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""

# Detect environment
echo "🔍 Detecting environment..."

# Determine OS
if grep -qi microsoft /proc/version 2>/dev/null; then
    ENV_TYPE="wsl"
    ENV_DISPLAY="WSL (Windows Subsystem for Linux)"
elif [[ "$(uname)" == "Darwin" ]]; then
    ENV_TYPE="macos"
    ENV_DISPLAY="macOS"
elif [[ "$(uname)" == "Linux" ]]; then
    ENV_TYPE="linux"
    ENV_DISPLAY="Linux"
else
    echo "✗ Unsupported environment"
    exit 1
fi

echo "✓ Environment: $ENV_DISPLAY"
echo ""

# Set paths based on environment
if [ "$ENV_TYPE" = "wsl" ]; then
    # WSL-specific paths
    QMX_HOME="$HOME/qmx"
    QMX_BIN="$HOME/.local/bin"
    QMX_SCRIPTS="$HOME/bin"
    QWEN_ROOT="$HOME/.qwen"
    
    # Source Windows path for copying
    WIN_USER=$(whoami)
    QMX_SRC="/mnt/c/Users/$WIN_USER/.qwen/tmp/qmx"
    
elif [ "$ENV_TYPE" = "macos" ]; then
    # macOS paths
    QMX_HOME="$HOME/qmx"
    QMX_BIN="$HOME/.local/bin"
    QMX_SCRIPTS="$HOME/bin"
    QWEN_ROOT="$HOME/.qwen"
    QMX_SRC="$HOME/tmp/qmx"
    
else
    # Linux paths
    QMX_HOME="$HOME/qmx"
    QMX_BIN="$HOME/.local/bin"
    QMX_SCRIPTS="$HOME/bin"
    QWEN_ROOT="$HOME/.qwen"
    QMX_SRC="$HOME/tmp/qmx"
fi

echo "📁 Installation Paths:"
echo "   QMX Home: $QMX_HOME"
echo "   QMX Bin: $QMX_BIN"
echo "   Scripts: $QMX_SCRIPTS"
echo "   Qwen Root: $QWEN_ROOT"
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'v' -f2 | cut -d'.' -f1)
    echo "✓ Node.js: $NODE_VERSION"
    if [ "$NODE_MAJOR" -lt 20 ]; then
        echo "  ⚠ Warning: Node.js 20+ recommended"
        if command -v nvm &> /dev/null; then
            echo "  Tip: nvm install 20 && nvm use 20"
        fi
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
    echo "⚠ tmux not found (required for team mode)"
    if [ "$ENV_TYPE" = "wsl" ] || [ "$ENV_TYPE" = "linux" ]; then
        echo "  Install: sudo apt install tmux"
    elif [ "$ENV_TYPE" = "macos" ]; then
        echo "  Install: brew install tmux"
    fi
fi

echo ""

# Copy QMX files
echo "📦 Installing QMX..."

if [ -d "$QMX_SRC" ]; then
    cp -r "$QMX_SRC" "$QMX_HOME"
    echo "✓ Copied QMX to $QMX_HOME"
elif [ -d "$QMX_HOME" ]; then
    echo "✓ QMX already exists at $QMX_HOME"
else
    echo "✗ QMX source not found at $QMX_SRC"
    exit 1
fi

cd "$QMX_HOME"

# Install dependencies
echo ""
echo "🔧 Installing dependencies..."
npm install --silent 2>/dev/null || npm install
echo "✓ Dependencies installed"

# Build TypeScript
echo ""
echo "🏗️  Building TypeScript..."
npm run build 2>/dev/null || {
    echo "⚠ Build failed, trying with Node 20..."
    if command -v nvm &> /dev/null; then
        source ~/.nvm/nvm.sh 2>/dev/null || true
        nvm use 20 2>/dev/null || true
    fi
    npm run build
}
echo "✓ Build complete"

# Install globally
echo ""
echo "📦 Installing globally..."
mkdir -p "$QMX_BIN"
npm install -g --prefix "$QMX_BIN" --silent 2>/dev/null || npm install -g --prefix "$QMX_BIN"
echo "✓ Global install complete"

# Install team command
echo ""
echo "🚀 Installing team command..."
mkdir -p "$QMX_SCRIPTS"
if [ -f "$QMX_HOME/scripts/team" ]; then
    cp "$QMX_HOME/scripts/team" "$QMX_SCRIPTS/team"
    chmod +x "$QMX_SCRIPTS/team"
    echo "✓ team command installed to $QMX_SCRIPTS/team"
else
    echo "⚠ team script not found"
fi

# Configure Qwen settings
echo ""
echo "⚙️  Configuring Qwen Code integration..."

if [ -d "$QWEN_ROOT" ]; then
    # Backup existing settings
    if [ -f "$QWEN_ROOT/settings.json" ]; then
        cp "$QWEN_ROOT/settings.json" "$QWEN_ROOT/settings.json.bak"
    fi
    
    # Create QMX-enhanced settings
    cat > "$QWEN_ROOT/settings.json" << EOF
{
  "\$version": 3,
  "security": {
    "auth": {
      "selectedType": "qwen-oauth"
    }
  },
  "mcpServers": {
    "qmx-state": {
      "command": "node",
      "args": ["$QMX_HOME/dist/mcp/state-server.js"],
      "env": {}
    },
    "qmx-memory": {
      "command": "node",
      "args": ["$QMX_HOME/dist/mcp/memory-server.js"],
      "env": {}
    },
    "qmx-code-intel": {
      "command": "node",
      "args": ["$QMX_HOME/dist/mcp/code-intel-server.js"],
      "env": {}
    },
    "qmx-trace": {
      "command": "node",
      "args": ["$QMX_HOME/dist/mcp/trace-server.js"],
      "env": {}
    }
  },
  "context": {
    "loadMemoryFromIncludeDirectories": true
  }
}
EOF
    echo "✓ Qwen settings configured with MCP servers"
    
    # Copy documentation
    if [ -f "$QMX_HOME/QMX-WSL-README.md" ]; then
        cp "$QMX_HOME/QMX-WSL-README.md" "$QWEN_ROOT/"
    fi
    if [ -f "$QMX_HOME/WSL-SETUP-COMPLETE.md" ]; then
        cp "$QMX_HOME/WSL-SETUP-COMPLETE.md" "$QWEN_ROOT/"
    fi
    echo "✓ Documentation copied to $QWEN_ROOT"
else
    echo "⚠ Qwen root not found at $QWEN_ROOT"
fi

# Update shell configuration
echo ""
echo "📝 Configuring shell..."

SHELL_CONFIG=""
if [ -f "$HOME/.bashrc" ]; then
    SHELL_CONFIG="$HOME/.bashrc"
elif [ -f "$HOME/.zshrc" ]; then
    SHELL_CONFIG="$HOME/.zshrc"
elif [ -f "$HOME/.bash_profile" ]; then
    SHELL_CONFIG="$HOME/.bash_profile"
fi

if [ -n "$SHELL_CONFIG" ]; then
    if ! grep -q 'QMX' "$SHELL_CONFIG" 2>/dev/null; then
        cat >> "$SHELL_CONFIG" << EOF

# QMX Configuration
export PATH="$QMX_SCRIPTS:$QMX_BIN:\$PATH"
EOF
        echo "✓ Added QMX to $SHELL_CONFIG"
    else
        echo "✓ QMX already in $SHELL_CONFIG"
    fi
else
    echo "⚠ No shell config found"
fi

# Export PATH for current session
export PATH="$QMX_SCRIPTS:$QMX_BIN:$PATH"

# Verify installation
echo ""
echo "✅ Verifying installation..."
echo ""

ERRORS=0

# Check qmx
if command -v qmx &> /dev/null; then
    QMX_VERSION=$(qmx --version 2>/dev/null || echo "unknown")
    echo "✓ qmx: $QMX_VERSION"
else
    echo "✗ qmx: not in PATH"
    ERRORS=$((ERRORS + 1))
fi

# Check team
if command -v team &> /dev/null; then
    echo "✓ team: installed"
else
    echo "✗ team: not in PATH"
    ERRORS=$((ERRORS + 1))
fi

# Check MCP servers
MCP_COUNT=$(ls "$QMX_HOME/dist/mcp/"*.js 2>/dev/null | wc -l)
if [ "$MCP_COUNT" -eq 4 ]; then
    echo "✓ MCP servers: 4/4 installed"
else
    echo "⚠ MCP servers: $MCP_COUNT/4 (may need rebuild)"
fi

# Check tmux
if command -v tmux &> /dev/null; then
    echo "✓ tmux: available"
else
    echo "⚠ tmux: not installed (team mode won't work)"
fi

echo ""

if [ $ERRORS -eq 0 ]; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "🎉 Installation complete!"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Next steps:"
    echo "  1. Run: source $SHELL_CONFIG"
    echo "  2. Test: team 2:executor \"Test command\""
    echo "  3. Check: qmx doctor"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
else
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "⚠ Installation completed with $ERRORS warning(s)"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
fi

echo ""
