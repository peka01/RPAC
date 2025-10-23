# 🚀 MCP Servers Quick Start for RPAC

## What You Get

MCP (Model Context Protocol) servers will supercharge your AI development workflow in Cursor with:

- **🗄️ Database Access**: Query your Supabase database directly
- **📁 Enhanced File Navigation**: Better understanding of your large codebase  
- **🌐 Real-time Web Search**: Access current Swedish crisis information
- **🛠️ Custom RPAC Tools**: Project-specific quality assurance tools

## ⚡ Quick Setup (2 minutes)

### Windows Users
```powershell
# Run the setup script
.\setup-mcp-servers.ps1
```

### Mac/Linux Users
```bash
# Run the setup script
./setup-mcp-servers.sh
```

### Manual Setup
```bash
# 1. Install dependencies
cd mcp-servers
npm install @modelcontextprotocol/sdk
cd ..

# 2. Install MCP servers globally
npm install -g @modelcontextprotocol/server-postgres
npm install -g @modelcontextprotocol/server-filesystem
npm install -g @modelcontextprotocol/server-brave-search
npm install -g @modelcontextprotocol/server-github

# 3. Create .env file with your credentials
# (See .env template below)
```

## 🔧 Configuration

### 1. Update .env File
```bash
# Database (Supabase) - Get from your Supabase dashboard
POSTGRES_CONNECTION_STRING=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres

# Web Search (Optional) - Get from https://brave.com/search/api/
BRAVE_API_KEY=your_brave_api_key_here

# GitHub (Optional) - Get from https://github.com/settings/tokens  
GITHUB_PERSONAL_ACCESS_TOKEN=your_github_token_here
```

### 2. Restart Cursor
After setup, restart Cursor to load the MCP servers.

## 🎯 Custom RPAC Tools

Your custom MCP server provides these specialized tools:

### `check_swedish_text`
**Purpose**: Find hardcoded Swedish text (åäöÅÄÖ)  
**Usage**: "Check for hardcoded Swedish text in this component"  
**Returns**: Violations and fix suggestions

### `validate_olive_colors`  
**Purpose**: Ensure olive green colors, not blue  
**Usage**: "Validate colors in this component"  
**Returns**: Blue color violations and olive green replacements

### `check_mobile_optimization`
**Purpose**: Verify mobile-first design compliance  
**Usage**: "Check mobile optimization in this component"  
**Returns**: Missing mobile patterns and recommendations

### `suggest_component_improvements`
**Purpose**: Analyze components for RPAC best practices  
**Usage**: "Suggest improvements for this component"  
**Returns**: Specific recommendations for RPAC compliance

### `get_localization_keys`
**Purpose**: List all available localization keys  
**Usage**: "Show me all localization keys"  
**Returns**: Complete list of t() function keys from sv.json

### `check_resource_list_usage`
**Purpose**: Suggest ResourceListView usage  
**Usage**: "Check if this should use ResourceListView"  
**Returns**: Analysis and migration suggestions

## 🚀 Usage Examples

### Database Queries
```
"Show me all users in the user_profiles table"
"Check the schema of the communities table"  
"Find all resources shared in the last 24 hours"
```

### File System Navigation
```
"Show me all components in the components directory"
"Find all files that import ResourceListView"
"List all mobile-specific components"
```

### Quality Assurance
```
"Check for hardcoded Swedish text in this component"
"Validate colors in this component"
"Check mobile optimization in this component"
"Suggest improvements for this component"
```

### Real-time Information
```
"Search for current Swedish crisis preparedness guidelines"
"Find latest MSB recommendations"
"Check current weather alerts in Sweden"
```

## ✅ Success Checklist

You'll know it's working when you can:

- [ ] Query your Supabase database directly from Cursor
- [ ] Use custom tools to validate RPAC compliance  
- [ ] Access real-time Swedish crisis information
- [ ] Navigate your large codebase efficiently
- [ ] Get intelligent suggestions for component improvements

## 🔧 Troubleshooting

### MCP Server Not Starting
- Check that dependencies are installed: `cd mcp-servers && npm list`
- Verify environment variables in .env
- Ensure file paths are correct

### Database Connection Issues  
- Verify Supabase connection string
- Check network connectivity
- Validate credentials

### Custom Tools Not Working
- Ensure rpac-custom-server.js is executable
- Check file permissions
- Verify Node.js version compatibility

## 📚 Full Documentation

For complete setup instructions and advanced usage, see:
- `docs/MCP_SERVER_SETUP.md` - Complete setup guide
- `.cursor/mcp_servers.json` - Server configuration
- `mcp-servers/rpac-custom-server.js` - Custom tools source

## 🎯 Pro Tips

1. **Use custom tools before committing** - Catch RPAC violations early
2. **Query database during development** - Test queries before implementing  
3. **Use filesystem server** - Find similar components quickly
4. **Access real-time info** - Keep crisis information current

---

**Ready to supercharge your RPAC development? Run the setup script and start using MCP servers today!** 🚀
