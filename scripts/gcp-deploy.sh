#!/bin/bash

# ============================================================================
# Script de Deploy Automatizado para Google Cloud Platform
# EndocriCheck - Pesquisa sobre Saúde Endócrina
# Pesquisador: Marcelle Vitória Alves de Lima (1º F)
# ============================================================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funções de log
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ============================================================================
# CONFIGURAÇÕES
# ============================================================================

# Valores padrão (altere conforme necessário)
PROJECT_ID="${GCP_PROJECT_ID:-seu-projeto-gcp}"
REGION="${GCP_REGION:-us-central1}"
SERVICE_NAME="${SERVICE_NAME:-endocrine-survey}"
INSTANCE_NAME="${INSTANCE_NAME:-endocrine-survey-db}"
DB_NAME="endocrine_survey"
DB_USER="endocrine_user"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

# ============================================================================
# PRÉ-REQUISITOS
# ============================================================================

check_prerequisites() {
    log_info "Verificando pré-requisitos..."
    
    # Verificar gcloud
    if ! command -v gcloud &> /dev/null; then
        log_error "gcloud CLI não está instalado"
        exit 1
    fi
    
    # Verificar docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker não está instalado"
        exit 1
    fi
    
    # Verificar git
    if ! command -v git &> /dev/null; then
        log_error "Git não está instalado"
        exit 1
    fi
    
    log_success "Todos os pré-requisitos foram verificados"
}

# ============================================================================
# CONFIGURAÇÃO DO GCP
# ============================================================================

setup_gcp() {
    log_info "Configurando Google Cloud Platform..."
    
    # Autenticar
    log_info "Autenticando no GCP..."
    gcloud auth login
    
    # Configurar projeto
    log_info "Configurando projeto: $PROJECT_ID"
    gcloud config set project $PROJECT_ID
    
    # Ativar APIs necessárias
    log_info "Ativando APIs necessárias..."
    gcloud services enable \
        cloudbuild.googleapis.com \
        run.googleapis.com \
        sqladmin.googleapis.com \
        containerregistry.googleapis.com
    
    log_success "GCP configurado com sucesso"
}

# ============================================================================
# CRIAR CLOUD SQL
# ============================================================================

create_cloud_sql() {
    log_info "Criando instância Cloud SQL PostgreSQL 17..."
    
    # Verificar se a instância já existe
    if gcloud sql instances describe $INSTANCE_NAME --region=$REGION &> /dev/null; then
        log_warning "Instância $INSTANCE_NAME já existe, pulando criação"
        return
    fi
    
    # Criar instância
    gcloud sql instances create $INSTANCE_NAME \
        --database-version=POSTGRES_17 \
        --tier=db-f1-micro \
        --region=$REGION \
        --availability-type=REGIONAL \
        --backup-start-time=03:00 \
        --enable-bin-log \
        --no-backup
    
    log_success "Instância Cloud SQL criada"
}

# ============================================================================
# CRIAR BANCO DE DADOS E USUÁRIO
# ============================================================================

setup_database() {
    log_info "Configurando banco de dados..."
    
    # Gerar senha aleatória
    DB_PASSWORD=$(openssl rand -base64 32)
    
    # Criar banco de dados
    log_info "Criando banco de dados $DB_NAME..."
    gcloud sql databases create $DB_NAME \
        --instance=$INSTANCE_NAME
    
    # Criar usuário
    log_info "Criando usuário $DB_USER..."
    gcloud sql users create $DB_USER \
        --instance=$INSTANCE_NAME \
        --password=$DB_PASSWORD
    
    # Salvar credenciais
    log_info "Salvando credenciais..."
    cat > .gcp-db-credentials << EOF
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@/endocrine_survey?host=/cloudsql/${PROJECT_ID}:${REGION}:${INSTANCE_NAME}
CLOUD_SQL_USER=${DB_USER}
CLOUD_SQL_PASSWORD=${DB_PASSWORD}
GCP_PROJECT_ID=${PROJECT_ID}
GCP_REGION=${REGION}
GCP_CLOUD_SQL_INSTANCE=${INSTANCE_NAME}
EOF
    
    log_success "Banco de dados e usuário criados"
    log_info "Credenciais salvas em .gcp-db-credentials"
}

# ============================================================================
# BUILD E PUSH DA IMAGEM DOCKER
# ============================================================================

build_and_push_image() {
    log_info "Fazendo build e push da imagem Docker..."
    
    # Configurar Docker para usar gcloud como autenticador
    gcloud auth configure-docker
    
    # Build da imagem
    log_info "Fazendo build da imagem..."
    docker build -t $IMAGE_NAME:latest .
    
    # Push para Container Registry
    log_info "Fazendo push da imagem..."
    docker push $IMAGE_NAME:latest
    
    log_success "Imagem Docker enviada para Container Registry"
}

# ============================================================================
# DEPLOY NO CLOUD RUN
# ============================================================================

deploy_to_cloud_run() {
    log_info "Fazendo deploy no Cloud Run..."
    
    # Ler credenciais do banco de dados
    if [ ! -f ".gcp-db-credentials" ]; then
        log_error "Arquivo .gcp-db-credentials não encontrado"
        exit 1
    fi
    
    source .gcp-db-credentials
    
    # Deploy
    gcloud run deploy $SERVICE_NAME \
        --image $IMAGE_NAME:latest \
        --platform managed \
        --region $REGION \
        --allow-unauthenticated \
        --memory 512Mi \
        --cpu 1 \
        --timeout 3600 \
        --set-env-vars=\
NODE_ENV=production,\
VITE_APP_TITLE="EndocriCheck - Pesquisa Endocrinológica",\
DATABASE_URL="$DATABASE_URL",\
VITE_APP_ID="seu_app_id_manus",\
JWT_SECRET="$(openssl rand -base64 32)",\
OAUTH_SERVER_URL="https://api.manus.im",\
VITE_OAUTH_PORTAL_URL="https://manus.im",\
OWNER_OPEN_ID="seu_owner_open_id",\
OWNER_NAME="Seu Nome Completo",\
BUILT_IN_FORGE_API_URL="https://api.manus.im/forge",\
BUILT_IN_FORGE_API_KEY="sua_chave_api_forge_secreta",\
VITE_FRONTEND_FORGE_API_URL="https://api.manus.im/forge",\
VITE_FRONTEND_FORGE_API_KEY="sua_chave_frontend_forge_secreta",\
PORT="3000",\
HOST="0.0.0.0"
    
    # Conectar ao Cloud SQL
    log_info "Conectando Cloud Run ao Cloud SQL..."
    gcloud run services update $SERVICE_NAME \
        --add-cloudsql-instances ${PROJECT_ID}:${REGION}:${INSTANCE_NAME} \
        --region $REGION
    
    log_success "Deploy no Cloud Run concluído"
}

# ============================================================================
# EXECUTAR MIGRAÇÕES
# ============================================================================

run_migrations() {
    log_info "Executando migrações do banco de dados..."
    
    # Ler credenciais
    source .gcp-db-credentials
    
    # Usar Cloud SQL Proxy para executar migrações
    log_info "Iniciando Cloud SQL Proxy..."
    
    # Download do Cloud SQL Proxy se não existir
    if [ ! -f "cloud-sql-proxy" ]; then
        log_info "Baixando Cloud SQL Proxy..."
        curl -o cloud-sql-proxy https://dl.google.com/cloudsql/cloud_sql_proxy.linux.amd64
        chmod +x cloud-sql-proxy
    fi
    
    # Iniciar proxy em background
    ./cloud-sql-proxy ${PROJECT_ID}:${REGION}:${INSTANCE_NAME} &
    PROXY_PID=$!
    
    # Aguardar proxy iniciar
    sleep 5
    
    # Executar migrações
    log_info "Executando migrações..."
    export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/endocrine_survey"
    pnpm drizzle-kit migrate
    
    # Parar proxy
    kill $PROXY_PID
    
    log_success "Migrações executadas com sucesso"
}

# ============================================================================
# OBTER URL DO SERVIÇO
# ============================================================================

get_service_url() {
    log_info "Obtendo URL do serviço..."
    
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
        --region $REGION \
        --format='value(status.url)')
    
    log_success "Serviço disponível em: $SERVICE_URL"
    
    # Salvar URL
    echo $SERVICE_URL > .gcp-service-url
}

# ============================================================================
# MAIN
# ============================================================================

main() {
    log_info "Iniciando deploy do EndocriCheck no GCP..."
    
    check_prerequisites
    setup_gcp
    create_cloud_sql
    setup_database
    build_and_push_image
    deploy_to_cloud_run
    run_migrations
    get_service_url
    
    log_success "Deploy concluído com sucesso!"
    log_info "Próximos passos:"
    log_info "1. Configure o domínio personalizado (opcional)"
    log_info "2. Teste o formulário em: $(cat .gcp-service-url)"
    log_info "3. Configure o dashboard administrativo"
    log_info "4. Monitore os logs: gcloud run services logs read $SERVICE_NAME --region $REGION"
}

# Executar main
main "$@"
