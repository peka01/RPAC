# Development Setup Guide

## ⚠️ CRITICAL: Directory Structure

The RPAC project has a specific directory structure that MUST be followed:

```
RPAC/                      ← Root directory (NO package.json here!)
├── docs/                  ← Documentation
├── rpac-web/             ← Web application (THIS is where you run commands!)
│   ├── package.json      ← The actual package.json
│   ├── src/              ← Source code
│   ├── public/           ← Static assets
│   └── ...
└── README.md
```

## 🚫 Common Mistake #1: Running Commands from Wrong Directory

### ❌ WRONG - Running from Root
```bash
cd C:\Users\Per Karlsson\code\RPAC
npm run dev
# ERROR: Cannot find package.json
# ERROR: ENOENT: no such file or directory
```

### ✅ CORRECT - Running from rpac-web
```bash
cd C:\Users\Per Karlsson\code\RPAC\rpac-web
npm run dev
# SUCCESS: Server starts at http://localhost:3000
```

## 📝 Development Commands

**ALWAYS** run these commands from the `rpac-web` directory:

```bash
# Navigate to the correct directory FIRST
cd rpac-web

# Development server
npm run dev              # Start dev server at localhost:3000

# Building
npm run build            # Production build
npm run build:analyze    # Build with bundle analyzer

# Code quality
npm run lint             # Run ESLint
npm run type-check       # Check TypeScript types

# Cleaning
rm -rf .next out         # Clear build cache (if errors occur)
```

## 🔧 Troubleshooting

### Error: "Cannot find module 'package.json'"
**Cause**: You're in the wrong directory (likely in `/RPAC` instead of `/rpac-web`)  
**Solution**: `cd rpac-web`

### Error: "middleware-manifest.json not found"
**Cause**: Stale build artifacts  
**Solution**: 
```bash
cd rpac-web
rm -rf .next out
npm run dev
```

### Port 3000 Already in Use
**Solution**: 
```bash
# Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <process_id> /F
```

## 🎯 Best Practices for LLM/AI Assistants

When providing terminal commands, ALWAYS:

1. **Include the directory change first**:
   ```bash
   cd rpac-web
   npm run dev
   ```

2. **Use absolute paths when needed**:
   ```bash
   cd C:\Users\Per Karlsson\code\RPAC\rpac-web
   ```

3. **Check current directory**:
   ```bash
   pwd  # Unix/Mac
   cd   # Windows PowerShell
   ```

4. **Never assume the user is in the right directory**

## 📂 File Paths

When referencing files in the project:

- **Source files**: `rpac-web/src/...`
- **Components**: `rpac-web/src/components/...`
- **Styles**: `rpac-web/src/app/globals.css`
- **Public assets**: `rpac-web/public/...`
- **Documentation**: `docs/...`

## 🚀 First Time Setup

```bash
# 1. Clone the repository
git clone <repository-url>
cd RPAC

# 2. Navigate to web app directory
cd rpac-web

# 3. Install dependencies
npm install

# 4. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your keys

# 5. Start development server
npm run dev

# 6. Open browser
# Navigate to http://localhost:3000
```

## 📱 Mobile Development

For mobile testing with correct server setup:

```bash
cd rpac-web
npm run dev
# Open on mobile device using your local IP
# http://192.168.x.x:3000
```

## 🔥 Emergency Reset

If everything breaks:

```bash
cd rpac-web
rm -rf node_modules .next out package-lock.json
npm install
npm run dev
```

---

**Remember**: The web application code lives in `rpac-web/`, not in the root `RPAC/` directory!

