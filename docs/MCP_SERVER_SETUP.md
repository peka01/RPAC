# MCP Server Setup for RPAC

## 🚀 Overview

This document explains how to set up and use Model Context Protocol (MCP) servers to enhance your AI development workflow in Cursor for the RPAC project.

## 📋 What are MCP Servers?

MCP servers extend Cursor's AI capabilities by providing:
- **Database Access**: Direct Supabase queries and schema inspection
- **File System Navigation**: Enhanced project file access
- **Web Search**: Real-time information access
- **Custom Tools**: RPAC-specific development helpers

## 🛠️ Setup Instructions

### 1. Install MCP Server Dependencies

```bash
# Navigate to mcp-servers directory
cd mcp-servers
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```bash
# Database (Supabase)
POSTGRES_CONNECTION_STRING=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres

# Web Search (Optional)
BRAVE_API_KEY=your_brave_api_key_here

# GitHub (Optional)
GITHUB_PERSONAL_ACCESS_TOKEN=your_github_token_here
```

### 3. Configure Cursor

The MCP servers are already configured in `.cursor/mcp_servers.json`. Cursor will automatically detect and use them.

## 🎯 Available MCP Servers

### 1. **Database Server** (Supabase Integration)
- **Purpose**: Direct database queries and schema inspection
- **Benefits**: 
  - Query your Supabase database directly
  - Inspect table schemas
  - Test SQL queries
  - Validate data relationships

**Usage Examples:**
```
"Show me all users in the user_profiles table"
"Check the schema of the communities table"
"Find all resources shared in the last 24 hours"
```

### 2. **Filesystem Server** (Project Navigation)
- **Purpose**: Enhanced file system access
- **Benefits**:
  - Better understanding of component structure
  - Improved code navigation
  - File content analysis

**Usage Examples:**
```
"Show me all components in the components directory"
"Find all files that import ResourceListView"
"List all mobile-specific components"
```

### 3. **Web Search Server** (Real-time Information)
- **Purpose**: Access to current information
- **Benefits**:
  - Swedish crisis information
  - MSB guidelines and updates
  - Weather and emergency data

**Usage Examples:**
```
"Search for current Swedish crisis preparedness guidelines"
"Find latest MSB recommendations"
"Check current weather alerts in Sweden"
```

### 4. **RPAC Custom Server** (Project-Specific Tools)
- **Purpose**: RPAC-specific development helpers
- **Tools Available**:

#### `check_swedish_text`
- **Purpose**: Find hardcoded Swedish text (åäöÅÄÖ)
- **Usage**: "Check for hardcoded Swedish text in this component"
- **Returns**: List of Swedish characters found and fix suggestions

#### `validate_olive_colors`
- **Purpose**: Ensure olive green colors, not blue
- **Usage**: "Validate colors in this component"
- **Returns**: Blue color violations and olive green replacements

#### `check_mobile_optimization`
- **Purpose**: Verify mobile-first design compliance
- **Usage**: "Check mobile optimization in this component"
- **Returns**: Missing mobile patterns and recommendations

#### `suggest_component_improvements`
- **Purpose**: Analyze components for RPAC best practices
- **Usage**: "Suggest improvements for this component"
- **Returns**: Specific recommendations for RPAC compliance

#### `get_localization_keys`
- **Purpose**: List all available localization keys
- **Usage**: "Show me all localization keys"
- **Returns**: Complete list of t() function keys from sv.json

#### `check_resource_list_usage`
- **Purpose**: Suggest ResourceListView usage
- **Usage**: "Check if this should use ResourceListView"
- **Returns**: Analysis and migration suggestions

## 🎯 Best Practices

### 1. **Use Custom Tools for Quality Assurance**
Before committing code, use the custom tools to ensure:
- No hardcoded Swedish text
- Proper olive green colors
- Mobile optimization
- ResourceListView usage where appropriate

### 2. **Database Development Workflow**
1. Use database server to inspect schema
2. Test queries before implementing
3. Validate relationships and constraints
4. Check data integrity

### 3. **Component Development**
1. Use filesystem server to find similar components
2. Use custom tools to validate RPAC compliance
3. Check localization keys availability
4. Ensure mobile optimization

### 4. **Real-time Information**
- Use web search for current crisis information
- Check MSB guidelines for accuracy
- Verify Swedish emergency procedures

## 🔧 Troubleshooting

### Common Issues

1. **MCP Server Not Starting**
   - Check that dependencies are installed
   - Verify environment variables
   - Ensure file paths are correct

2. **Database Connection Issues**
   - Verify Supabase connection string
   - Check network connectivity
   - Validate credentials

3. **Custom Tools Not Working**
   - Ensure rpac-custom-server.js is executable
   - Check file permissions
   - Verify Node.js version compatibility

### Debug Commands

```bash
# Test custom server
cd mcp-servers
node rpac-custom-server.js

# Check database connection
psql $POSTGRES_CONNECTION_STRING -c "SELECT 1;"

# Verify file system access
ls -la rpac-web/src/components/
```

## 📚 Advanced Usage

### Custom Tool Integration

The RPAC custom server can be extended with additional tools:

```javascript
// Add new tool in rpac-custom-server.js
{
  name: 'analyze_component_performance',
  description: 'Analyze component for performance issues',
  inputSchema: {
    type: 'object',
    properties: {
      filePath: { type: 'string' }
    }
  }
}
```

### Database Query Examples

```sql
-- Find all communities with resources
SELECT c.name, COUNT(r.id) as resource_count
FROM communities c
LEFT JOIN resources r ON c.id = r.community_id
GROUP BY c.id, c.name;

-- Check user activity
SELECT u.email, COUNT(m.id) as message_count
FROM user_profiles u
LEFT JOIN messages m ON u.id = m.sender_id
WHERE m.created_at > NOW() - INTERVAL '7 days'
GROUP BY u.id, u.email;
```

## 🎯 Success Metrics

You'll know the MCP setup is working when you can:

- ✅ Query your Supabase database directly from Cursor
- ✅ Use custom tools to validate RPAC compliance
- ✅ Access real-time Swedish crisis information
- ✅ Navigate your large codebase efficiently
- ✅ Get intelligent suggestions for component improvements

## 🔄 Maintenance

### Regular Tasks
- Update MCP server dependencies monthly
- Refresh API keys as needed
- Monitor server performance
- Update custom tools based on project evolution

### Version Control
- Keep `.cursor/mcp_servers.json` in version control
- Document any custom tool changes
- Update this documentation when adding new tools

---

**Remember**: MCP servers are powerful tools that extend Cursor's capabilities. Use them to maintain RPAC's high standards while accelerating development.
