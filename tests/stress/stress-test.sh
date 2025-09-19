#!/bin/bash

# NetPilot Stress Testing Suite
# This script performs comprehensive stress testing on the NetPilot system

set -euo pipefail

# Configuration
BASE_URL="${BASE_URL:-http://meadadigital.com:3001}"
API_BASE="$BASE_URL/api/v1"
TEST_DURATION="${TEST_DURATION:-300}" # 5 minutes default
MAX_USERS="${MAX_USERS:-100}"
RAMP_DURATION="${RAMP_DURATION:-60}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."

    # Check if curl is available
    if ! command -v curl &> /dev/null; then
        error "curl is required but not installed"
        exit 1
    fi

    # Check if artillery is available
    if ! command -v artillery &> /dev/null; then
        error "artillery is required but not installed. Install with: npm install -g artillery"
        exit 1
    fi

    # Check if k6 is available
    if ! command -v k6 &> /dev/null; then
        warning "k6 is not installed. Some tests will be skipped. Install from: https://k6.io/docs/get-started/installation/"
    fi

    # Check if jq is available for JSON parsing
    if ! command -v jq &> /dev/null; then
        warning "jq is not installed. Some output parsing will be limited."
    fi

    # Check if the NetPilot service is running
    log "Checking if NetPilot service is accessible..."
    if ! curl -f -s "$BASE_URL/health" > /dev/null; then
        error "NetPilot service is not accessible at $BASE_URL"
        error "Please ensure the service is running before executing stress tests"
        exit 1
    fi

    success "Prerequisites check completed"
}

# System resource monitoring
start_monitoring() {
    log "Starting system resource monitoring..."

    # Create monitoring directory
    mkdir -p ./stress-test-results/$(date +%Y%m%d_%H%M%S)
    RESULTS_DIR="./stress-test-results/$(date +%Y%m%d_%H%M%S)"

    # Start CPU and memory monitoring in background
    {
        echo "timestamp,cpu_percent,memory_percent,load_1m,load_5m,load_15m"
        while true; do
            timestamp=$(date '+%Y-%m-%d %H:%M:%S')
            if command -v top &> /dev/null; then
                # Get CPU and memory usage
                cpu_mem=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us,//' | head -1)
                mem_usage=$(free | awk 'FNR==2{printf "%.2f", $3/$2*100}')
                load_avg=$(uptime | awk -F'load average:' '{print $2}' | sed 's/ //g')

                echo "$timestamp,$cpu_mem,$mem_usage,$load_avg"
            fi
            sleep 5
        done
    } > "$RESULTS_DIR/system_metrics.csv" &

    MONITORING_PID=$!
    echo $MONITORING_PID > "$RESULTS_DIR/monitoring.pid"

    log "System monitoring started (PID: $MONITORING_PID)"
}

stop_monitoring() {
    log "Stopping system resource monitoring..."

    if [ -f "$RESULTS_DIR/monitoring.pid" ]; then
        MONITORING_PID=$(cat "$RESULTS_DIR/monitoring.pid")
        kill $MONITORING_PID 2>/dev/null || true
        rm "$RESULTS_DIR/monitoring.pid"
        success "Monitoring stopped"
    fi
}

# Database stress test
database_stress_test() {
    log "Starting database stress test..."

    # Get auth token first
    auth_response=$(curl -s -X POST "$API_BASE/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"admin@netpilot.local","password":"admin123"}')

    if ! echo "$auth_response" | grep -q "access_token"; then
        error "Failed to authenticate for database stress test"
        return 1
    fi

    ACCESS_TOKEN=$(echo "$auth_response" | jq -r '.access_token' 2>/dev/null || echo "$auth_response" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

    # Create multiple domains concurrently
    log "Creating multiple domains concurrently..."
    for i in $(seq 1 50); do
        {
            curl -s -X POST "$API_BASE/domains" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $ACCESS_TOKEN" \
                -d "{\"domain\":\"stress-test-$i-$(date +%s).com\",\"enabled\":true,\"description\":\"Stress test domain $i\"}" \
                > "$RESULTS_DIR/domain_create_$i.log" 2>&1
        } &
    done

    # Wait for all domain creation requests to complete
    wait

    # Count successful domain creations
    successful_domains=$(grep -l "\"id\":" "$RESULTS_DIR"/domain_create_*.log | wc -l)
    log "Successfully created $successful_domains out of 50 domains"

    # Test concurrent reads
    log "Testing concurrent domain reads..."
    for i in $(seq 1 100); do
        {
            curl -s -X GET "$API_BASE/domains?page=$((i % 10 + 1))&limit=10" \
                -H "Authorization: Bearer $ACCESS_TOKEN" \
                > "$RESULTS_DIR/domain_read_$i.log" 2>&1
        } &
    done

    wait

    successful_reads=$(grep -l "\"data\":" "$RESULTS_DIR"/domain_read_*.log | wc -l)
    log "Successfully completed $successful_reads out of 100 concurrent read operations"

    # Cleanup test domains
    log "Cleaning up test domains..."
    domain_list=$(curl -s -X GET "$API_BASE/domains?limit=100" \
        -H "Authorization: Bearer $ACCESS_TOKEN")

    if command -v jq &> /dev/null; then
        echo "$domain_list" | jq -r '.data[] | select(.domain | contains("stress-test")) | .id' | while read domain_id; do
            curl -s -X DELETE "$API_BASE/domains/$domain_id" \
                -H "Authorization: Bearer $ACCESS_TOKEN" > /dev/null 2>&1 &
        done
        wait
    fi

    success "Database stress test completed"
}

# API endpoint stress test
api_stress_test() {
    log "Starting API endpoint stress test..."

    # Test authentication endpoint stress
    log "Testing authentication endpoint under stress..."
    {
        for i in $(seq 1 200); do
            curl -s -X POST "$API_BASE/auth/login" \
                -H "Content-Type: application/json" \
                -d '{"email":"admin@netpilot.local","password":"admin123"}' \
                -w "%{http_code},%{time_total},%{time_connect}\n" \
                -o /dev/null &

            # Limit concurrent connections
            if (( i % 20 == 0 )); then
                wait
            fi
        done
        wait
    } > "$RESULTS_DIR/auth_stress_results.csv"

    # Analyze authentication results
    auth_success_rate=$(awk -F',' '$1 == 200 {count++} END {print (count/NR)*100}' "$RESULTS_DIR/auth_stress_results.csv")
    avg_response_time=$(awk -F',' '{sum+=$2; count++} END {print sum/count}' "$RESULTS_DIR/auth_stress_results.csv")

    log "Authentication stress test - Success rate: ${auth_success_rate}%, Avg response time: ${avg_response_time}s"

    # Test health endpoint under extreme load
    log "Testing health endpoint under extreme load..."
    {
        for i in $(seq 1 1000); do
            curl -s -X GET "$BASE_URL/health" \
                -w "%{http_code},%{time_total}\n" \
                -o /dev/null &

            # Limit concurrent connections to prevent overwhelming the system
            if (( i % 50 == 0 )); then
                wait
            fi
        done
        wait
    } > "$RESULTS_DIR/health_stress_results.csv"

    health_success_rate=$(awk -F',' '$1 == 200 {count++} END {print (count/NR)*100}' "$RESULTS_DIR/health_stress_results.csv")
    health_avg_response_time=$(awk -F',' '{sum+=$2; count++} END {print sum/count}' "$RESULTS_DIR/health_stress_results.csv")

    log "Health endpoint stress test - Success rate: ${health_success_rate}%, Avg response time: ${health_avg_response_time}s"

    success "API endpoint stress test completed"
}

# Memory exhaustion test
memory_stress_test() {
    log "Starting memory stress test..."

    # Get auth token
    auth_response=$(curl -s -X POST "$API_BASE/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"admin@netpilot.local","password":"admin123"}')

    ACCESS_TOKEN=$(echo "$auth_response" | jq -r '.access_token' 2>/dev/null || echo "$auth_response" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

    # Test with large payloads
    log "Testing with large payloads..."
    large_description=$(printf 'A%.0s' {1..10000}) # 10KB description

    for i in $(seq 1 10); do
        {
            curl -s -X POST "$API_BASE/domains" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $ACCESS_TOKEN" \
                -d "{\"domain\":\"large-payload-$i.com\",\"enabled\":true,\"description\":\"$large_description\"}" \
                -w "%{http_code},%{time_total}\n" \
                -o /dev/null
        } > "$RESULTS_DIR/large_payload_$i.log" 2>&1 &
    done

    wait

    # Test concurrent long-running requests
    log "Testing concurrent long-running requests..."
    for i in $(seq 1 20); do
        {
            # Simulate long-running operations by requesting large amounts of data
            curl -s -X GET "$API_BASE/logs?limit=1000&page=$i" \
                -H "Authorization: Bearer $ACCESS_TOKEN" \
                -w "%{http_code},%{time_total}\n" \
                -o /dev/null
        } > "$RESULTS_DIR/long_request_$i.log" 2>&1 &
    done

    wait

    success "Memory stress test completed"
}

# Connection exhaustion test
connection_stress_test() {
    log "Starting connection exhaustion test..."

    # Test maximum concurrent connections
    log "Testing maximum concurrent connections..."

    # Create a large number of persistent connections
    for i in $(seq 1 $MAX_USERS); do
        {
            # Keep connection alive for a longer period
            curl -s -X GET "$BASE_URL/health" \
                --keepalive-time 30 \
                --max-time 60 \
                -w "%{http_code},%{time_total},%{num_connects}\n" \
                -o /dev/null
        } > "$RESULTS_DIR/connection_$i.log" 2>&1 &

        # Small delay to prevent overwhelming the system instantly
        sleep 0.1
    done

    log "Waiting for all connections to complete..."
    wait

    # Analyze connection results
    connection_success_rate=$(find "$RESULTS_DIR" -name "connection_*.log" -exec grep -l "200" {} \; | wc -l)
    total_connections=$MAX_USERS

    log "Connection test - Successful connections: $connection_success_rate out of $total_connections"

    success "Connection exhaustion test completed"
}

# Resource cleanup test
cleanup_test() {
    log "Starting resource cleanup test..."

    # Get auth token
    auth_response=$(curl -s -X POST "$API_BASE/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"admin@netpilot.local","password":"admin123"}')

    ACCESS_TOKEN=$(echo "$auth_response" | jq -r '.access_token' 2>/dev/null || echo "$auth_response" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

    # Create resources rapidly and then delete them
    log "Creating and deleting resources rapidly..."

    for batch in $(seq 1 5); do
        # Create batch of domains
        domain_ids=()
        for i in $(seq 1 10); do
            response=$(curl -s -X POST "$API_BASE/domains" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $ACCESS_TOKEN" \
                -d "{\"domain\":\"cleanup-test-$batch-$i.com\",\"enabled\":true}")

            if command -v jq &> /dev/null; then
                domain_id=$(echo "$response" | jq -r '.id' 2>/dev/null)
                if [ "$domain_id" != "null" ] && [ -n "$domain_id" ]; then
                    domain_ids+=("$domain_id")
                fi
            fi
        done

        # Immediately delete the created domains
        for domain_id in "${domain_ids[@]}"; do
            curl -s -X DELETE "$API_BASE/domains/$domain_id" \
                -H "Authorization: Bearer $ACCESS_TOKEN" > /dev/null 2>&1 &
        done

        wait
        log "Completed cleanup batch $batch"
    done

    success "Resource cleanup test completed"
}

# Artillery.js load test
artillery_load_test() {
    if ! command -v artillery &> /dev/null; then
        warning "Artillery is not available, skipping artillery load test"
        return
    fi

    log "Starting Artillery.js load test..."

    # Run the artillery configuration
    artillery run \
        --output "$RESULTS_DIR/artillery-results.json" \
        tests/load/artillery-config.yml

    # Generate artillery report if test completed successfully
    if [ -f "$RESULTS_DIR/artillery-results.json" ]; then
        artillery report "$RESULTS_DIR/artillery-results.json" \
            --output "$RESULTS_DIR/artillery-report.html"
        success "Artillery load test completed - Report available at $RESULTS_DIR/artillery-report.html"
    else
        error "Artillery load test failed"
    fi
}

# K6 performance test
k6_performance_test() {
    if ! command -v k6 &> /dev/null; then
        warning "K6 is not available, skipping k6 performance test"
        return
    fi

    log "Starting K6 performance test..."

    # Run K6 test
    BASE_URL="$BASE_URL" k6 run \
        --out json="$RESULTS_DIR/k6-results.json" \
        tests/performance/k6-performance.js

    success "K6 performance test completed"
}

# Generate comprehensive report
generate_report() {
    log "Generating comprehensive stress test report..."

    cat > "$RESULTS_DIR/stress-test-report.html" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>NetPilot Stress Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background-color: #f4f4f4; padding: 20px; border-radius: 5px; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .success { color: green; }
        .warning { color: orange; }
        .error { color: red; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>NetPilot Stress Test Report</h1>
        <p>Generated on: $(date)</p>
        <p>Test Duration: $TEST_DURATION seconds</p>
        <p>Maximum Users: $MAX_USERS</p>
        <p>Target URL: $BASE_URL</p>
    </div>

    <div class="section">
        <h2>Test Summary</h2>
        <table>
            <tr><th>Test Type</th><th>Status</th><th>Notes</th></tr>
            <tr><td>Database Stress</td><td class="success">Completed</td><td>Multiple concurrent operations</td></tr>
            <tr><td>API Stress</td><td class="success">Completed</td><td>High-frequency endpoint testing</td></tr>
            <tr><td>Memory Stress</td><td class="success">Completed</td><td>Large payload and concurrent requests</td></tr>
            <tr><td>Connection Stress</td><td class="success">Completed</td><td>Maximum concurrent connections</td></tr>
            <tr><td>Cleanup Test</td><td class="success">Completed</td><td>Resource creation and deletion</td></tr>
        </table>
    </div>

    <div class="section">
        <h2>Performance Metrics</h2>
        <p>Detailed performance metrics are available in the individual test result files.</p>
        <ul>
            <li>System metrics: system_metrics.csv</li>
            <li>API response times: *_stress_results.csv</li>
            <li>Artillery results: artillery-results.json</li>
            <li>K6 results: k6-results.json</li>
        </ul>
    </div>

    <div class="section">
        <h2>Recommendations</h2>
        <ul>
            <li>Monitor response times under peak load</li>
            <li>Implement connection pooling for database operations</li>
            <li>Consider implementing rate limiting for API endpoints</li>
            <li>Set up proper monitoring and alerting for production</li>
        </ul>
    </div>
</body>
</html>
EOF

    success "Comprehensive report generated: $RESULTS_DIR/stress-test-report.html"
}

# Cleanup function
cleanup() {
    log "Cleaning up stress test..."
    stop_monitoring

    # Kill any remaining background processes
    jobs -p | xargs -r kill 2>/dev/null || true

    log "Stress test cleanup completed"
}

# Main execution function
main() {
    log "Starting NetPilot Stress Testing Suite"
    log "Configuration: Base URL=$BASE_URL, Duration=${TEST_DURATION}s, Max Users=$MAX_USERS"

    # Set up cleanup trap
    trap cleanup EXIT

    # Run all tests
    check_prerequisites
    start_monitoring

    # Core stress tests
    database_stress_test
    api_stress_test
    memory_stress_test
    connection_stress_test
    cleanup_test

    # External tool tests
    artillery_load_test
    k6_performance_test

    # Generate final report
    generate_report

    success "All stress tests completed successfully!"
    success "Results available in: $RESULTS_DIR"
    log "Open $RESULTS_DIR/stress-test-report.html in your browser to view the full report"
}

# Run main function
main "$@"