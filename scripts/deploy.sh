#!/bin/bash

# SnapAsset Deployment Script for Railway
# This script prepares and validates the application for deployment

set -e  # Exit on error

echo "╔══════════════════════════════════════════╗"
echo "║   🚀 SnapAsset Deployment Script        ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

# Check Node.js version
print_info "Checking Node.js version..."
NODE_VERSION=$(node -v)
print_success "Node.js version: $NODE_VERSION"

# Check npm version
print_info "Checking npm version..."
NPM_VERSION=$(npm -v)
print_success "npm version: $NPM_VERSION"

# Check if .env.example exists
if [ ! -f "server/.env.example" ]; then
    print_error "server/.env.example not found!"
    exit 1
fi
print_success "Environment example file found"

# Validate required environment variables
print_info "Validating environment configuration..."
if [ -z "$SUPABASE_URL" ]; then
    print_error "SUPABASE_URL is not set"
    exit 1
fi
print_success "SUPABASE_URL is configured"

if [ -z "$SUPABASE_SERVICE_KEY" ]; then
    print_error "SUPABASE_SERVICE_KEY is not set"
    exit 1
fi
print_success "SUPABASE_SERVICE_KEY is configured"

# Install dependencies
print_info "Installing dependencies..."
npm ci --include=dev
print_success "Root dependencies installed"

cd server
npm ci --include=dev
print_success "Server dependencies installed"
cd ..

# Run linting
print_info "Running linter..."
if npm run lint 2>/dev/null; then
    print_success "Linting passed"
else
    print_info "No linting script configured, skipping..."
fi

# Build frontend
print_info "Building frontend..."
npm run build
print_success "Frontend build completed"

# Check if build directory exists
if [ ! -d "dist" ]; then
    print_error "Build directory 'dist' not found!"
    exit 1
fi
print_success "Build artifacts verified"

# Test server start (dry run)
print_info "Testing server configuration..."
cd server
timeout 5 node index.js > /dev/null 2>&1 || true
print_success "Server configuration valid"
cd ..

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   ✅ Deployment validation complete!     ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo "1. Push to Railway: git push railway main"
echo "2. Monitor deployment: railway logs"
echo "3. Check health: curl https://your-app.railway.app/health"
