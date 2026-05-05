#!/bin/bash

# =====================================================
# Script Automático para Git - Peleleca Rifas
# =====================================================

# Colores para mensajes bonitos
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Iconos
ICON_SUCCESS="✅"
ICON_ERROR="❌"
ICON_WARNING="⚠️"
ICON_INFO="ℹ️"
ICON_COMMIT="📦"
ICON_PUSH="🚀"

# =====================================================
# FUNCIONES
# =====================================================

# Mostrar mensaje con color
print_message() {
    local color=$1
    local icon=$2
    local message=$3
    echo -e "${color}${icon} ${message}${NC}"
}

# Generar mensaje de commit automático basado en los cambios
generate_commit_message() {
    local changed_files=$(git diff --cached --name-only)
    local files_count=$(echo "$changed_files" | wc -l)
    
    # Detectar tipos de cambios
    local has_backend=false
    local has_frontend=false
    local has_uploads=false
    local has_component=false
    local has_api=false
    
    while IFS= read -r file; do
        case "$file" in
            backend/*) has_backend=true ;;
            frontend/*|src/*) has_frontend=true ;;
            backend/uploads/*) has_uploads=true ;;
            *Component*.jsx|*component*.jsx) has_component=true ;;
            *api*.js|*services*.js) has_api=true ;;
        esac
    done <<< "$changed_files"
    
    # Construir mensaje
    local message=""
    local parts=()
    
    if [ "$has_backend" = true ]; then
        parts+=("backend")
    fi
    
    if [ "$has_frontend" = true ]; then
        parts+=("frontend")
    fi
    
    if [ "$has_uploads" = true ]; then
        parts+=("uploads")
    fi
    
    if [ "$has_component" = true ]; then
        parts+=("componentes")
    fi
    
    if [ "$has_api" = true ]; then
        parts+=("API")
    fi
    
    if [ ${#parts[@]} -eq 0 ]; then
        message="Actualización general"
    else
        message="Actualización: $(IFS=', '; echo "${parts[*]}")"
    fi
    
    # Agregar cantidad de archivos modificados
    message="$message ($files_count archivos)"
    
    echo "$message"
}

# Obtener tipo de cambios principales
get_commit_type() {
    local changed_files=$(git diff --cached --name-only)
    
    if echo "$changed_files" | grep -q "CreateRifaParticipante"; then
        echo "feat"
    elif echo "$changed_files" | grep -q "participant"; then
        echo "feat"
    elif echo "$changed_files" | grep -q "payments"; then
        echo "fix"
    elif echo "$changed_files" | grep -q "mis-premios"; then
        echo "fix"
    elif echo "$changed_files" | grep -q "uploads"; then
        echo "chore"
    else
        echo "refactor"
    fi
}

# =====================================================
# PROGRAMA PRINCIPAL
# =====================================================

clear
echo ""
print_message "$CYAN" "🎯" "=== SCRIPT AUTOMÁTICO PARA GIT - PELELECA RIFAS ==="
echo ""

# Verificar si estamos en un repositorio Git
if [ ! -d ".git" ]; then
    print_message "$RED" "$ICON_ERROR" "No estás en un repositorio Git"
    exit 1
fi

# Mostrar estado actual
print_message "$BLUE" "$ICON_INFO" "Estado actual del repositorio:"
echo ""
git status -s
echo ""

# Verificar si hay cambios para commit
if [ -z "$(git status -s)" ]; then
    print_message "$YELLOW" "$ICON_WARNING" "No hay cambios para commitear"
    exit 0
fi

# Preguntar si quiere ver los cambios
print_message "$WHITE" "❓" "¿Ver los cambios detallados? (s/n): "
read -r ver_cambios

if [ "$ver_cambios" = "s" ] || [ "$ver_cambios" = "S" ]; then
    echo ""
    print_message "$CYAN" "$ICON_INFO" "Cambios detectados:"
    git diff --cached --stat
    echo ""
fi

# Agregar todos los cambios
print_message "$BLUE" "$ICON_INFO" "Agregando todos los cambios..."
git add .

if [ $? -eq 0 ]; then
    print_message "$GREEN" "$ICON_SUCCESS" "Cambios agregados correctamente"
else
    print_message "$RED" "$ICON_ERROR" "Error al agregar los cambios"
    exit 1
fi

# Generar mensaje de commit automático
COMMIT_TYPE=$(get_commit_type)
COMMIT_MESSAGE=$(generate_commit_message)
AUTO_MESSAGE="${COMMIT_TYPE}: ${COMMIT_MESSAGE}"

# Preguntar si quiere usar mensaje automático o personalizado
echo ""
print_message "$WHITE" "❓" "¿Usar mensaje automático o personalizar?"
echo "  1) Automático: \"$AUTO_MESSAGE\""
echo "  2) Personalizado"
echo "  3) Cancelar"
read -r opcion_mensaje

case $opcion_mensaje in
    1)
        FINAL_MESSAGE="$AUTO_MESSAGE"
        print_message "$GREEN" "$ICON_COMMIT" "Usando mensaje automático"
        ;;
    2)
        echo ""
        print_message "$WHITE" "📝" "Escribe tu mensaje de commit:"
        read -r FINAL_MESSAGE
        if [ -z "$FINAL_MESSAGE" ]; then
            FINAL_MESSAGE="$AUTO_MESSAGE"
            print_message "$YELLOW" "$ICON_WARNING" "Mensaje vacío, usando automático"
        fi
        ;;
    3|*)
        print_message "$YELLOW" "$ICON_WARNING" "Operación cancelada"
        exit 0
        ;;
esac

# Hacer commit
echo ""
print_message "$BLUE" "$ICON_COMMIT" "Haciendo commit con mensaje: \"$FINAL_MESSAGE\""
git commit -m "$FINAL_MESSAGE"

if [ $? -eq 0 ]; then
    print_message "$GREEN" "$ICON_SUCCESS" "Commit realizado correctamente"
else
    print_message "$RED" "$ICON_ERROR" "Error al hacer commit"
    exit 1
fi

# Mostrar últimos commits
echo ""
print_message "$CYAN" "$ICON_INFO" "Últimos 3 commits:"
git log --oneline -3
echo ""

# Preguntar si quiere hacer push
print_message "$WHITE" "❓" "¿Hacer push al repositorio remoto? (s/n): "
read -r hacer_push

if [ "$hacer_push" = "s" ] || [ "$hacer_push" = "S" ]; then
    echo ""
    print_message "$BLUE" "$ICON_PUSH" "Haciendo push al repositorio remoto..."
    
    # Obtener la rama actual
    CURRENT_BRANCH=$(git branch --show-current)
    
    git push origin "$CURRENT_BRANCH"
    
    if [ $? -eq 0 ]; then
        print_message "$GREEN" "$ICON_SUCCESS" "Push realizado correctamente"
    else
        print_message "$RED" "$ICON_ERROR" "Error al hacer push"
        print_message "$YELLOW" "$ICON_WARNING" "Intenta: git push origin $CURRENT_BRANCH"
        exit 1
    fi
else
    print_message "$YELLOW" "$ICON_WARNING" "Push omitido. Recuerda hacer push después"
fi

# Resumen final
echo ""
print_message "$CYAN" "🎉" "=== RESUMEN FINAL ==="
print_message "$GREEN" "$ICON_COMMIT" "Commit: $FINAL_MESSAGE"
print_message "$GREEN" "$ICON_PUSH"  "Rama: $(git branch --show-current)"
if [ "$hacer_push" = "s" ] || [ "$hacer_push" = "S" ]; then
    print_message "$GREEN" "$ICON_SUCCESS" "Estado: ¡Todo sincronizado!"
else
    print_message "$YELLOW" "$ICON_WARNING" "Estado: Commit local, pendiente de push"
fi

echo ""
print_message "$PURPLE" "🚀" "¡Script completado con éxito!"
echo ""