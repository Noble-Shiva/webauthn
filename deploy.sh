#!/bin/bash

# Colors for prettier output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the script's directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PID_DIR="$DIR/pids"

# Create pids directory if it doesn't exist
mkdir -p "$PID_DIR"

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "Port $1 is already in use"
        return 1
    fi
    return 0
}

# Function to kill process and remove pid file
kill_service() {
    local name="$1"
    local pid_file="$PID_DIR/$name.pid"
    
    # First try killing by PID file
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p "$pid" > /dev/null; then
            echo "Killing $name (PID: $pid)"
            kill -15 "$pid" 2>/dev/null || kill -9 "$pid" 2>/dev/null
        fi
        rm "$pid_file"
    fi
    
    # Then check for any processes on associated port
    case "$name" in
        "backend")
            pkill -f "node dist/index.js" 2>/dev/null
            lsof -ti:3000 | xargs kill -9 2>/dev/null
            ;;
        "react-client")
            pkill -f "serve -s dist -l 8000" 2>/dev/null
            lsof -ti:8000 | xargs kill -9 2>/dev/null
            ;;
        "native-client")
            pkill -f "python3 -m http.server 8001" 2>/dev/null
            lsof -ti:8001 | xargs kill -9 2>/dev/null
            ;;
    esac
}

# Function to kill all services
kill_all_services() {
    echo "Stopping all services..."
    kill_service "backend"
    kill_service "react-client"
    kill_service "native-client"
    
    # Clean up any remaining processes
    pkill -f "node dist/index.js" 2>/dev/null
    pkill -f "serve -s dist -l 8000" 2>/dev/null
    pkill -f "python3 -m http.server 8001" 2>/dev/null
    
    # Remove all PID files
    rm -f "$PID_DIR"/*.pid
    
    echo "All services stopped"
}

# Function to save PID
save_pid() {
    echo "$2" > "$PID_DIR/$1.pid"
    echo "Started $1 (PID: $2)"
}

# Set up trap to kill all processes on script exit
trap kill_all_services EXIT INT TERM

# Function to start a service
start_service() {
    local name="$1"
    local command="$2"
    local port="$3"
    
    # Check if service is already running
    if [ -f "$PID_DIR/$name.pid" ]; then
        local pid=$(cat "$PID_DIR/$name.pid")
        if ps -p "$pid" > /dev/null; then
            echo "$name is already running (PID: $pid)"
            return
        else
            rm "$PID_DIR/$name.pid"
        fi
    fi

    # Check if port is available
    if ! check_port "$port"; then
        echo "Port $port is in use. Killing existing process..."
        lsof -ti:$port | xargs kill -9
    fi

    # Start the service
    eval "$command" &
    local pid=$!
    save_pid "$name" "$pid"
}

echo -e "${BLUE}Starting WebAuthn Demo Deployment${NC}"
echo "----------------------------------------"

# Kill any existing services
kill_service "backend"
kill_service "react-client"
kill_service "native-client"

# 1. Start Backend Server
echo -e "\n${GREEN}1. Starting Backend Server${NC}"
cd "$DIR"
if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
fi

echo "Building TypeScript..."
npm run build || {
    echo -e "${RED}TypeScript build failed${NC}"
    exit 1
}

start_service "backend" "node dist/index.js" 3000pkill -f "node dist/index.js"
pkill -f "serve -s dist"
pkill -f "python3 -m http.server"
sleep 2

# 2. Build and Serve React Client
echo -e "\n${GREEN}2. Building React Client${NC}"
cd "$DIR/client"
if [ ! -d "node_modules" ]; then
    echo "Installing React client dependencies..."
    npm install
fi
echo "Building React application..."
npm run build

echo "Starting React client server..."
start_service "react-client" "npx serve -s dist -l 8000" 8000
sleep 2

# 3. Start Native WebAuthn Client
echo -e "\n${GREEN}3. Starting Native WebAuthn Client${NC}"
cd "$DIR/client-js-native"
start_service "native-client" "python3 -m http.server 8001" 8001
sleep 2

# Print access URLs and PIDs
echo -e "\n${BLUE}Deployment Complete!${NC}"
echo "----------------------------------------"
echo -e "${GREEN}Backend Server:${NC} http://localhost:3000"
echo -e "${GREEN}React Client:${NC} http://localhost:8000"
echo -e "${GREEN}Native Client:${NC} http://localhost:8001"
echo -e "\n${BLUE}Service PIDs:${NC}"
for pid_file in "$PID_DIR"/*.pid; do
    if [ -f "$pid_file" ]; then
        service_name=$(basename "$pid_file" .pid)
        pid=$(cat "$pid_file")
        echo "$service_name: $pid"
    fi
done
echo "----------------------------------------"
echo -e "${BLUE}Services are running in the background${NC}"
echo -e "${BLUE}To stop all services, run: ./deploy.sh stop${NC}"

# Handle stop command
if [ "$1" = "stop" ]; then
    echo -e "\n${BLUE}Stopping all services...${NC}"
    kill_all_services
    exit 0
fi
