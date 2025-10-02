#!/bin/bash

# Script de gestión para WhatsApp Multi-Instance API

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funciones
print_header() {
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}WhatsApp Multi-Instance Manager${NC}"
    echo -e "${GREEN}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Comandos
cmd_install() {
    print_info "Instalando dependencias..."
    if command -v pnpm &> /dev/null; then
        pnpm install
    else
        npm install
    fi
    print_success "Dependencias instaladas"
}

cmd_dev() {
    print_info "Iniciando servidor en modo desarrollo..."
    if command -v pnpm &> /dev/null; then
        pnpm dev
    else
        npm run dev
    fi
}

cmd_build() {
    print_info "Compilando proyecto..."
    if command -v pnpm &> /dev/null; then
        pnpm build
    else
        npm run build
    fi
    print_success "Proyecto compilado en ./dist"
}

cmd_start() {
    print_info "Iniciando servidor en modo producción..."
    if command -v pnpm &> /dev/null; then
        pnpm start
    else
        npm start
    fi
}

cmd_docker_build() {
    print_info "Construyendo imagen Docker..."
    docker build -t whatsapp-multi-instance .
    print_success "Imagen Docker construida"
}

cmd_docker_run() {
    print_info "Iniciando contenedor Docker..."
    docker-compose up -d
    print_success "Contenedor iniciado"
    print_info "Interfaz web: http://localhost:3000"
}

cmd_docker_stop() {
    print_info "Deteniendo contenedor Docker..."
    docker-compose down
    print_success "Contenedor detenido"
}

cmd_docker_logs() {
    print_info "Mostrando logs..."
    docker-compose logs -f
}

cmd_clean() {
    print_warning "Limpiando archivos compilados..."
    rm -rf dist/
    rm -rf node_modules/
    print_success "Archivos limpiados"
}

cmd_clean_sessions() {
    print_warning "¿Estás seguro de que quieres eliminar todas las sesiones? (y/n)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        rm -rf sessions/*
        print_success "Sesiones eliminadas"
    else
        print_info "Operación cancelada"
    fi
}

cmd_status() {
    print_header
    
    # Check if Docker is running
    if docker-compose ps | grep -q "Up"; then
        print_success "Docker: Contenedor ejecutándose"
        docker-compose ps
    else
        print_info "Docker: Contenedor no está corriendo"
    fi
    
    echo ""
    
    # Check sessions
    if [ -d "sessions" ]; then
        session_count=$(find sessions -maxdepth 1 -type d | tail -n +2 | wc -l)
        print_info "Sesiones guardadas: $session_count"
    else
        print_info "Directorio de sesiones no existe"
    fi
}

cmd_backup() {
    print_info "Creando backup de sesiones..."
    timestamp=$(date +%Y%m%d_%H%M%S)
    backup_file="backup_sessions_$timestamp.tar.gz"
    tar -czf "$backup_file" sessions/
    print_success "Backup creado: $backup_file"
}

cmd_restore() {
    print_warning "Archivos de backup disponibles:"
    ls -1 backup_sessions_*.tar.gz 2>/dev/null || print_error "No hay backups disponibles"
    echo ""
    print_info "Ingresa el nombre del archivo a restaurar (o 'cancel' para cancelar):"
    read -r backup_file
    
    if [ "$backup_file" == "cancel" ]; then
        print_info "Operación cancelada"
        return
    fi
    
    if [ -f "$backup_file" ]; then
        print_warning "Esto sobrescribirá las sesiones actuales. ¿Continuar? (y/n)"
        read -r response
        if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            tar -xzf "$backup_file"
            print_success "Backup restaurado"
        else
            print_info "Operación cancelada"
        fi
    else
        print_error "Archivo no encontrado"
    fi
}

cmd_help() {
    print_header
    echo ""
    echo "Uso: ./manage.sh [comando]"
    echo ""
    echo "Comandos disponibles:"
    echo ""
    echo "  ${GREEN}Desarrollo:${NC}"
    echo "    install         - Instalar dependencias"
    echo "    dev            - Iniciar en modo desarrollo"
    echo "    build          - Compilar proyecto"
    echo "    start          - Iniciar en modo producción"
    echo "    clean          - Limpiar archivos compilados"
    echo ""
    echo "  ${GREEN}Docker:${NC}"
    echo "    docker:build   - Construir imagen Docker"
    echo "    docker:run     - Iniciar contenedor"
    echo "    docker:stop    - Detener contenedor"
    echo "    docker:logs    - Ver logs del contenedor"
    echo ""
    echo "  ${GREEN}Gestión:${NC}"
    echo "    status         - Ver estado del sistema"
    echo "    backup         - Crear backup de sesiones"
    echo "    restore        - Restaurar backup de sesiones"
    echo "    clean:sessions - Eliminar todas las sesiones"
    echo ""
    echo "  ${GREEN}Ayuda:${NC}"
    echo "    help           - Mostrar esta ayuda"
    echo ""
}

# Main
main() {
    case "$1" in
        install)
            cmd_install
            ;;
        dev)
            cmd_dev
            ;;
        build)
            cmd_build
            ;;
        start)
            cmd_start
            ;;
        docker:build)
            cmd_docker_build
            ;;
        docker:run)
            cmd_docker_run
            ;;
        docker:stop)
            cmd_docker_stop
            ;;
        docker:logs)
            cmd_docker_logs
            ;;
        clean)
            cmd_clean
            ;;
        clean:sessions)
            cmd_clean_sessions
            ;;
        status)
            cmd_status
            ;;
        backup)
            cmd_backup
            ;;
        restore)
            cmd_restore
            ;;
        help|--help|-h|"")
            cmd_help
            ;;
        *)
            print_error "Comando no reconocido: $1"
            echo ""
            cmd_help
            exit 1
            ;;
    esac
}

main "$@"
