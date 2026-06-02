@echo off
REM RiskTrix Microservices Docker Setup Script for Windows
REM This script helps you set up the complete Docker environment

setlocal enabledelayedexpansion

REM Color codes (Windows 10+)
for /F %%a in ('echo prompt $H ^| cmd') do set "BS=%%a"

REM Check prerequisites
echo.
echo ========================================
echo Checking Prerequisites
echo ========================================
echo.

REM Check Docker
docker --version >nul 2>&1
if errorlevel 1 (
    echo [X] Docker is not installed
    echo Install Docker Desktop from: https://www.docker.com/products/docker-desktop
    exit /b 1
)
for /f "tokens=*" %%i in ('docker --version') do set "DOCKER_VERSION=%%i"
echo [OK] %DOCKER_VERSION%

REM Check Docker Compose
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo [X] Docker Compose is not installed
    echo Install Docker Desktop which includes Docker Compose
    exit /b 1
)
for /f "tokens=*" %%i in ('docker-compose --version') do set "COMPOSE_VERSION=%%i"
echo [OK] %COMPOSE_VERSION%

REM Create .env file
echo.
echo ========================================
echo Setting Up Environment Configuration
echo ========================================
echo.

if exist .env (
    echo [i] .env file already exists
    set /p overwrite="Do you want to overwrite it? (y/n): "
    if /i not "!overwrite!"=="y" (
        echo [i] Keeping existing .env file
        goto skip_env
    )
)

if exist .env.example (
    copy .env.example .env >nul
    echo [OK] .env file created from .env.example
    echo [i] Please edit .env to customize settings if needed
) else (
    echo [X] .env.example file not found
    exit /b 1
)

:skip_env

REM Build Docker images
echo.
echo ========================================
echo Building Docker Images
echo ========================================
echo.
echo [i] This may take several minutes...
docker-compose build
if errorlevel 1 (
    echo [X] Failed to build Docker images
    exit /b 1
)
echo [OK] Docker images built successfully

REM Start services
echo.
echo ========================================
echo Starting Services
echo ========================================
echo.
echo [i] Starting all containers...
docker-compose up -d
if errorlevel 1 (
    echo [X] Failed to start services
    exit /b 1
)
echo [OK] All services started

REM Display service information
echo.
echo ========================================
echo 🎉 Services are Starting!
echo ========================================
echo.
echo Access your services at:
echo.
echo [Frontend]
echo   * Dashboard UI: http://localhost:8888
echo.
echo [APIs]
echo   * Dashboard Backend: http://localhost:8000
echo   * Application Service: http://localhost:8001
echo   * Audit Service: http://localhost:8002
echo   * Asset Service: http://localhost:8003
echo   * Ticket Service: http://localhost:8004
echo   * Directory Service: http://localhost:8005
echo   * Policy Service: http://localhost:8006
echo   * File Service: http://localhost:8007
echo   * Notification Service: http://localhost:8008
echo   * Queue Service: http://localhost:8009
echo   * Search Service: http://localhost:8010
echo   * API Gateway: http://localhost:8080
echo.
echo [Infrastructure]
echo   * PostgreSQL: localhost:5432 (postgres/password)
echo   * Redis: localhost:6379
echo.
echo [Useful Commands]
echo   * View all logs: docker-compose logs -f
echo   * View service logs: docker-compose logs -f ^<service-name^>
echo   * Check service status: docker-compose ps
echo   * Stop services: docker-compose stop
echo   * Start services: docker-compose up -d
echo   * Rebuild services: docker-compose up -d --build
echo   * Reset database: docker-compose down -v ^&^& docker-compose up -d
echo.
echo [i] For more information, see DOCKER_SETUP.md
echo.
echo [OK] Setup complete! Services are starting...
echo [i] First startup may take 1-2 minutes for database migrations
echo.

endlocal
