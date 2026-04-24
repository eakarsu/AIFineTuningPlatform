#!/bin/bash

# ================================================
# AI Fine-Tuning Platform - Startup Script
# ================================================
# This script:
# 1. Cleans up used ports
# 2. Creates PostgreSQL database
# 3. Runs schema and seeds data
# 4. Installs dependencies
# 5. Starts backend and frontend with hot reload
# ================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo -e "${PURPLE}"
echo "  ╔══════════════════════════════════════════╗"
echo "  ║     AI Fine-Tuning Platform              ║"
echo "  ║     Enterprise LLMOps Suite              ║"
echo "  ╚══════════════════════════════════════════╝"
echo -e "${NC}"

# Load environment variables
if [ -f "$PROJECT_DIR/.env" ]; then
  echo -e "${CYAN}[1/7] Loading environment variables...${NC}"
  set -a
  source "$PROJECT_DIR/.env"
  set +a
  echo -e "${GREEN}  ✓ Environment loaded${NC}"
else
  echo -e "${RED}  ✗ .env file not found! Please create one.${NC}"
  exit 1
fi

BACKEND_PORT=${BACKEND_PORT:-3001}
FRONTEND_PORT=${FRONTEND_PORT:-3000}
DB_NAME=${DB_NAME:-ai_finetuning_platform}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-postgres}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}

# ================================================
# Step 2: Kill processes on used ports
# ================================================
echo -e "${CYAN}[2/7] Cleaning up used ports...${NC}"

cleanup_port() {
  local port=$1
  local pids=$(lsof -ti :$port 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo -e "${YELLOW}  Killing processes on port $port: $pids${NC}"
    echo "$pids" | xargs kill -9 2>/dev/null || true
    sleep 1
  fi
}

cleanup_port $BACKEND_PORT
cleanup_port $FRONTEND_PORT
echo -e "${GREEN}  ✓ Ports $BACKEND_PORT and $FRONTEND_PORT are free${NC}"

# ================================================
# Step 3: Setup PostgreSQL Database
# ================================================
echo -e "${CYAN}[3/7] Setting up PostgreSQL database...${NC}"

# Check if PostgreSQL is running
if ! pg_isready -h $DB_HOST -p $DB_PORT -q 2>/dev/null; then
  echo -e "${YELLOW}  Starting PostgreSQL...${NC}"
  brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || true
  sleep 3
fi

# Create database if it doesn't exist
export PGPASSWORD=$DB_PASSWORD
if ! psql -h $DB_HOST -p $DB_PORT -U $DB_USER -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
  echo -e "${YELLOW}  Creating database '$DB_NAME'...${NC}"
  createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME 2>/dev/null || psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || true
fi
echo -e "${GREEN}  ✓ Database ready${NC}"

# ================================================
# Step 4: Install Dependencies
# ================================================
echo -e "${CYAN}[4/7] Installing dependencies...${NC}"

cd "$PROJECT_DIR/backend"
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
  npm install --silent 2>&1 | tail -1
fi
echo -e "${GREEN}  ✓ Backend dependencies installed${NC}"

cd "$PROJECT_DIR/frontend"
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
  npm install --silent 2>&1 | tail -1
fi
echo -e "${GREEN}  ✓ Frontend dependencies installed${NC}"

cd "$PROJECT_DIR"

# ================================================
# Step 5: Run Schema & Seed Data
# ================================================
echo -e "${CYAN}[5/7] Initializing database schema...${NC}"
cd "$PROJECT_DIR/backend"
node src/db/init.js
echo -e "${GREEN}  ✓ Schema created${NC}"

echo -e "${CYAN}[6/7] Seeding database with sample data...${NC}"
node src/db/seed-runner.js
echo -e "${GREEN}  ✓ Database seeded with 15+ items per feature${NC}"

cd "$PROJECT_DIR"

# ================================================
# Step 7: Start Application with Hot Reload
# ================================================
echo -e "${CYAN}[7/7] Starting application...${NC}"
echo ""
echo -e "${GREEN}  ┌─────────────────────────────────────────┐${NC}"
echo -e "${GREEN}  │  Backend:  http://localhost:$BACKEND_PORT         │${NC}"
echo -e "${GREEN}  │  Frontend: http://localhost:$FRONTEND_PORT         │${NC}"
echo -e "${GREEN}  │                                         │${NC}"
echo -e "${GREEN}  │  Demo Login:                            │${NC}"
echo -e "${GREEN}  │    Email: admin@aifinetuning.com        │${NC}"
echo -e "${GREEN}  │    Password: admin123                   │${NC}"
echo -e "${GREEN}  │    (or click 'Quick Login' button)      │${NC}"
echo -e "${GREEN}  └─────────────────────────────────────────┘${NC}"
echo ""
echo -e "${YELLOW}  Press Ctrl+C to stop all services${NC}"
echo ""

# Trap to clean up background processes
cleanup() {
  echo ""
  echo -e "${YELLOW}Shutting down...${NC}"
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
  wait $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
  echo -e "${GREEN}All services stopped.${NC}"
  exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend with --watch for hot reload (Node 18+)
cd "$PROJECT_DIR/backend"
node --watch src/server.js &
BACKEND_PID=$!

# Start frontend with Vite (built-in hot reload)
cd "$PROJECT_DIR/frontend"
npx vite --port $FRONTEND_PORT --host &
FRONTEND_PID=$!

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
