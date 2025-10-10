#!/bin/bash

# Alert Engine Startup Script
# ===========================

set -e  # Exit on any error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BINARY_PATH="$PROJECT_DIR/bin/alert_engine"
CONFIG_PATH="$PROJECT_DIR/config/alert_engine.conf"
LOG_DIR="$PROJECT_DIR/logs"
DATA_DIR="$PROJECT_DIR/data"
PID_FILE="$PROJECT_DIR/alert_engine.pid"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Check if Alert Engine is running
is_running() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if ps -p "$pid" > /dev/null 2>&1; then
            return 0
        else
            rm -f "$PID_FILE"
            return 1
        fi
    fi
    return 1
}

# Check dependencies
check_dependencies() {
    log "Checking dependencies..."
    
    local deps=("curl" "sqlite3")
    local missing_deps=()
    
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            missing_deps+=("$dep")
        fi
    done
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        error "Missing dependencies: ${missing_deps[*]}"
        echo "Please install missing dependencies and try again."
        exit 1
    fi
    
    success "All dependencies found"
}

# Create required directories
setup_directories() {
    log "Setting up directories..."
    
    mkdir -p "$LOG_DIR" "$DATA_DIR"
    
    # Set permissions
    chmod 755 "$LOG_DIR" "$DATA_DIR"
    
    success "Directories created"
}

# Build the project if binary doesn't exist
build_project() {
    if [ ! -f "$BINARY_PATH" ]; then
        log "Binary not found. Building project..."
        
        cd "$PROJECT_DIR"
        if make; then
            success "Build completed successfully"
        else
            error "Build failed"
            exit 1
        fi
    else
        log "Binary found at $BINARY_PATH"
    fi
}

# Start Alert Engine
start_engine() {
    if is_running; then
        warn "Alert Engine is already running (PID: $(cat "$PID_FILE"))"
        return 0
    fi
    
    log "Starting Alert Engine..."
    
    # Ensure directories exist
    setup_directories
    
    # Build if necessary
    build_project
    
    # Start the engine in background
    cd "$PROJECT_DIR"
    nohup "$BINARY_PATH" -c "$CONFIG_PATH" > "$LOG_DIR/startup.log" 2>&1 &
    local pid=$!
    
    # Save PID
    echo "$pid" > "$PID_FILE"
    
    # Wait a moment and check if it's still running
    sleep 2
    if ps -p "$pid" > /dev/null 2>&1; then
        success "Alert Engine started successfully (PID: $pid)"
        log "HTTP API: http://localhost:8080"
        log "WebSocket: ws://localhost:8081"
        log "Logs: $LOG_DIR/alert_engine.log"
    else
        error "Alert Engine failed to start"
        if [ -f "$LOG_DIR/startup.log" ]; then
            echo "Startup log:"
            cat "$LOG_DIR/startup.log"
        fi
        rm -f "$PID_FILE"
        exit 1
    fi
}

# Stop Alert Engine
stop_engine() {
    if ! is_running; then
        warn "Alert Engine is not running"
        return 0
    fi
    
    local pid=$(cat "$PID_FILE")
    log "Stopping Alert Engine (PID: $pid)..."
    
    # Send SIGTERM
    kill "$pid"
    
    # Wait for graceful shutdown
    local count=0
    while ps -p "$pid" > /dev/null 2>&1 && [ $count -lt 30 ]; do
        sleep 1
        ((count++))
    done
    
    # Force kill if still running
    if ps -p "$pid" > /dev/null 2>&1; then
        warn "Forcing shutdown..."
        kill -9 "$pid"
    fi
    
    rm -f "$PID_FILE"
    success "Alert Engine stopped"
}

# Restart Alert Engine
restart_engine() {
    log "Restarting Alert Engine..."
    stop_engine
    sleep 2
    start_engine
}

# Show status
show_status() {
    if is_running; then
        local pid=$(cat "$PID_FILE")
        success "Alert Engine is running (PID: $pid)"
        
        # Check if ports are listening
        if command -v netstat &> /dev/null; then
            echo ""
            echo "Listening ports:"
            netstat -tlnp 2>/dev/null | grep ":808[01]" || echo "No ports found"
        fi
        
        # Show recent logs
        if [ -f "$LOG_DIR/alert_engine.log" ]; then
            echo ""
            echo "Recent logs:"
            tail -10 "$LOG_DIR/alert_engine.log"
        fi
    else
        warn "Alert Engine is not running"
    fi
}

# Show logs
show_logs() {
    if [ -f "$LOG_DIR/alert_engine.log" ]; then
        tail -f "$LOG_DIR/alert_engine.log"
    else
        error "Log file not found: $LOG_DIR/alert_engine.log"
        exit 1
    fi
}

# Test API endpoints
test_api() {
    log "Testing API endpoints..."
    
    if ! is_running; then
        error "Alert Engine is not running"
        exit 1
    fi
    
    # Test health endpoint
    if curl -sf http://localhost:8080/api/health > /dev/null; then
        success "Health endpoint: OK"
    else
        error "Health endpoint: FAILED"
    fi
    
    # Test alerts endpoint
    if curl -sf http://localhost:8080/api/alerts > /dev/null; then
        success "Alerts endpoint: OK"
    else
        error "Alerts endpoint: FAILED"
    fi
    
    # Test market data endpoint
    if curl -sf http://localhost:8080/api/market-data > /dev/null; then
        success "Market data endpoint: OK"
    else
        warn "Market data endpoint: FAILED (may be normal if no data yet)"
    fi
}

# Show help
show_help() {
    echo "Alert Engine Management Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start     Start the Alert Engine"
    echo "  stop      Stop the Alert Engine"
    echo "  restart   Restart the Alert Engine"
    echo "  status    Show current status"
    echo "  logs      Show live logs"
    echo "  test      Test API endpoints"
    echo "  help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start        # Start the engine"
    echo "  $0 logs         # Follow logs in real-time"
    echo "  $0 test         # Test if API is working"
}

# Main command handling
main() {
    case "${1:-help}" in
        start)
            check_dependencies
            start_engine
            ;;
        stop)
            stop_engine
            ;;
        restart)
            check_dependencies
            restart_engine
            ;;
        status)
            show_status
            ;;
        logs)
            show_logs
            ;;
        test)
            test_api
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            error "Unknown command: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"