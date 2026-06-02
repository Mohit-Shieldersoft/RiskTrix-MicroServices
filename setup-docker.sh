#!/bin/bash

# RiskTrix Microservices Docker Setup Script
# This script helps you set up the complete Docker environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        echo "Install Docker from: https://docs.docker.com/get-docker/"
        exit 1
    fi
    print_success "Docker is installed: $(docker --version)"
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        echo "Install Docker Compose from: https://docs.docker.com/compose/install/"
        exit 1
    fi
    print_success "Docker Compose is installed: $(docker-compose --version)"
    
    # Check disk space
    available_space=$(df . | awk 'NR==2 {print int($4/1024)}')  # in MB
    if [ "$available_space" -lt 10000 ]; then
        print_error "Insufficient disk space (need ~10GB, have ~${available_space}MB)"
        exit 1
    fi
    print_success "Sufficient disk space available (~${available_space}MB)"
    
    # Check available RAM
    if ! [[ "$OSTYPE" == "darwin"* ]]; then
        available_ram=$(grep MemAvailable /proc/meminfo | awk '{print int($2/1024)}')  # in MB
        if [ "$available_ram" -lt 4000 ]; then
            print_info "Limited RAM available (~${available_ram}MB). Recommended: 4GB+"
        else
            print_success "Sufficient RAM available (~${available_ram}MB)"
        fi
    fi
}

# Create .env file
create_env_file() {
    print_header "Setting Up Environment Configuration"
    
    if [ -f .env ]; then
        print_info ".env file already exists"
        read -p "Do you want to overwrite it? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Keeping existing .env file"
            return
        fi
    fi
    
    if [ -f .env.example ]; then
        cp .env.example .env
        print_success ".env file created from .env.example"
        print_info "Please edit .env to customize settings if needed"
    else
        print_error ".env.example file not found"
        exit 1
    fi
}

# Build Docker images
build_images() {
    print_header "Building Docker Images"
    
    if [ "$SKIP_BUILD" = "true" ]; then
        print_info "Skipping build (--skip-build flag used)"
        return
    fi
    
    print_info "This may take several minutes..."
    docker-compose build
    print_success "Docker images built successfully"
}

# Start services
start_services() {
    print_header "Starting Services"
    
    print_info "Starting all containers..."
    docker-compose up -d
    print_success "All services started"
}

# Wait for services to be healthy
wait_for_services() {
    print_header "Waiting for Services to Be Ready"
    
    services=("postgres" "redis" "cisodashboard-backend" "application-service" "audit-service")
    max_attempts=60
    attempt=1
    
    for service in "${services[@]}"; do
        echo -ne "\nChecking $service..."
        for ((i=1; i<=max_attempts; i++)); do
            if docker-compose exec -T "$service" curl -f http://localhost:8000/health &> /dev/null 2>&1 || \
               docker-compose exec -T "$service" pg_isready -U postgres &> /dev/null 2>&1 || \
               docker-compose exec -T "$service" redis-cli ping &> /dev/null 2>&1; then
                echo -e "\r${GREEN}✓ $service is ready${NC}"
                break
            fi
            if [ $i -eq $max_attempts ]; then
                echo -e "\r${YELLOW}⏱ $service is starting (may take longer)${NC}"
            else
                echo -ne "\r⏳ Waiting for $service... ($i/$max_attempts)"
            fi
            sleep 2
        done
    done
}

# Display service URLs
show_services() {
    print_header "🎉 Services are Ready!"
    
    echo "Access your services at:"
    echo ""
    echo -e "${GREEN}Frontend:${NC}"
    echo "  • Dashboard UI: http://localhost:8888"
    echo ""
    echo -e "${GREEN}APIs:${NC}"
    echo "  • Dashboard Backend: http://localhost:8000"
    echo "  • Application Service: http://localhost:8001"
    echo "  • Audit Service: http://localhost:8002"
    echo "  • Asset Service: http://localhost:8003"
    echo "  • Ticket Service: http://localhost:8004"
    echo "  • Directory Service: http://localhost:8005"
    echo "  • Policy Service: http://localhost:8006"
    echo "  • File Service: http://localhost:8007"
    echo "  • Notification Service: http://localhost:8008"
    echo "  • Queue Service: http://localhost:8009"
    echo "  • Search Service: http://localhost:8010"
    echo "  • API Gateway: http://localhost:8080"
    echo ""
    echo -e "${GREEN}Infrastructure:${NC}"
    echo "  • PostgreSQL: localhost:5432 (postgres/password)"
    echo "  • Redis: localhost:6379"
    echo ""
    echo -e "${GREEN}Useful Commands:${NC}"
    echo "  • View all logs: docker-compose logs -f"
    echo "  • View service logs: docker-compose logs -f <service-name>"
    echo "  • Check service status: docker-compose ps"
    echo "  • Stop services: docker-compose stop"
    echo "  • Start services: docker-compose up -d"
    echo "  • Rebuild services: docker-compose up -d --build"
    echo "  • Reset database: docker-compose down -v && docker-compose up -d"
    echo ""
    echo -e "${BLUE}For more information, see DOCKER_SETUP.md${NC}"
}

# Show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --skip-build      Skip building Docker images (use existing images)"
    echo "  --skip-env        Skip creating .env file"
    echo "  --help            Show this help message"
}

# Main execution
main() {
    # Parse arguments
    SKIP_BUILD=false
    SKIP_ENV=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-build)
                SKIP_BUILD=true
                shift
                ;;
            --skip-env)
                SKIP_ENV=true
                shift
                ;;
            --help)
                show_usage
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    print_header "🚀 RiskTrix Microservices Docker Setup"
    
    # Run setup steps
    check_prerequisites
    
    if [ "$SKIP_ENV" = "false" ]; then
        create_env_file
    fi
    
    build_images
    start_services
    wait_for_services
    show_services
    
    print_success "Setup complete! Your services are running."
}

# Run main
main "$@"
