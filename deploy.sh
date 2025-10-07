#!/bin/bash

# Build the Next.js application for static export
echo "Building Next.js application..."
cd rpac-web
npm run build

# Check if the out directory exists
if [ -d "out" ]; then
    echo "✅ Build successful - out directory created"
    ls -la out/
else
    echo "❌ Build failed - out directory not found"
    exit 1
fi

echo "✅ Ready for Cloudflare Pages deployment"
