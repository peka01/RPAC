# RPAC MCP Server Setup Script for Windows
# This script sets up MCP servers for enhanced AI development in Cursor

Write-Host "🚀 Setting up MCP servers for RPAC project..." -ForegroundColor Green

# Create mcp-servers directory if it doesn't exist
if (!(Test-Path "mcp-servers")) {
    New-Item -ItemType Directory -Path "mcp-servers"
    Write-Host "📁 Created mcp-servers directory" -ForegroundColor Yellow
}

# Install MCP server dependencies
Write-Host "📦 Installing MCP server dependencies..." -ForegroundColor Yellow
Set-Location mcp-servers
npm install @modelcontextprotocol/sdk
Set-Location ..

# Install additional MCP servers globally
Write-Host "🔧 Installing additional MCP servers..." -ForegroundColor Yellow
npm install -g @modelcontextprotocol/server-postgres
npm install -g @modelcontextprotocol/server-filesystem
npm install -g @modelcontextprotocol/server-brave-search
npm install -g @modelcontextprotocol/server-github

# Create .env file if it doesn't exist
if (!(Test-Path ".env")) {
    Write-Host "📝 Creating .env file template..." -ForegroundColor Yellow
    @"
# Database (Supabase) - Replace with your actual values
POSTGRES_CONNECTION_STRING=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres

# Web Search (Optional) - Get from https://brave.com/search/api/
BRAVE_API_KEY=your_brave_api_key_here

# GitHub (Optional) - Get from https://github.com/settings/tokens
GITHUB_PERSONAL_ACCESS_TOKEN=your_github_token_here
"@ | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "⚠️  Please update .env file with your actual credentials" -ForegroundColor Red
}

Write-Host "✅ MCP server setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Update .env file with your actual credentials"
Write-Host "2. Restart Cursor to load MCP servers"
Write-Host "3. Test the setup with: 'Check for hardcoded Swedish text in this component'"
Write-Host ""
Write-Host "📚 Documentation: docs/MCP_SERVER_SETUP.md" -ForegroundColor Blue
Write-Host "🎯 Custom tools available:" -ForegroundColor Magenta
Write-Host "   - check_swedish_text"
Write-Host "   - validate_olive_colors"
Write-Host "   - check_mobile_optimization"
Write-Host "   - suggest_component_improvements"
Write-Host "   - get_localization_keys"
Write-Host "   - check_resource_list_usage"
