#!/bin/bash

# RPAC MCP Server Setup Script
# This script sets up MCP servers for enhanced AI development in Cursor

echo "🚀 Setting up MCP servers for RPAC project..."

# Create mcp-servers directory if it doesn't exist
mkdir -p mcp-servers

# Install MCP server dependencies
echo "📦 Installing MCP server dependencies..."
cd mcp-servers
npm install @modelcontextprotocol/sdk
cd ..

# Install additional MCP servers
echo "🔧 Installing additional MCP servers..."
npm install -g @modelcontextprotocol/server-postgres
npm install -g @modelcontextprotocol/server-filesystem
npm install -g @modelcontextprotocol/server-brave-search
npm install -g @modelcontextprotocol/server-github

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file template..."
    cat > .env << EOF
# Database (Supabase) - Replace with your actual values
POSTGRES_CONNECTION_STRING=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres

# Web Search (Optional) - Get from https://brave.com/search/api/
BRAVE_API_KEY=your_brave_api_key_here

# GitHub (Optional) - Get from https://github.com/settings/tokens
GITHUB_PERSONAL_ACCESS_TOKEN=your_github_token_here
EOF
    echo "⚠️  Please update .env file with your actual credentials"
fi

# Make custom server executable
chmod +x mcp-servers/rpac-custom-server.js

echo "✅ MCP server setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update .env file with your actual credentials"
echo "2. Restart Cursor to load MCP servers"
echo "3. Test the setup with: 'Check for hardcoded Swedish text in this component'"
echo ""
echo "📚 Documentation: docs/MCP_SERVER_SETUP.md"
echo "🎯 Custom tools available:"
echo "   - check_swedish_text"
echo "   - validate_olive_colors"
echo "   - check_mobile_optimization"
echo "   - suggest_component_improvements"
echo "   - get_localization_keys"
echo "   - check_resource_list_usage"
