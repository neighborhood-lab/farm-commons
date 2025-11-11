#!/usr/bin/env bash

################################################################################
# Farm Commons Database Backup Script
#
# This script creates automated PostgreSQL backups with the following features:
# - Automated daily backups via cron
# - 30-day retention policy (configurable)
# - Optional S3 upload for offsite storage
# - Backup verification to ensure integrity
# - Compression to save storage space
# - Error logging and notifications
#
# Usage:
#   ./backup-database.sh [options]
#
# Options:
#   --verify-only    Only verify existing backups without creating new ones
#   --restore FILE   Restore database from backup file
#   --help           Show this help message
#
# Environment Variables:
#   POSTGRES_HOST       Database host (default: localhost)
#   POSTGRES_PORT       Database port (default: 5432)
#   POSTGRES_DB         Database name (default: farm_commons)
#   POSTGRES_USER       Database user (default: postgres)
#   POSTGRES_PASSWORD   Database password (required)
#   BACKUP_DIR          Backup directory (default: ./backups)
#   BACKUP_RETENTION    Days to keep backups (default: 30)
#   S3_BUCKET           S3 bucket for offsite storage (optional)
#   S3_PREFIX           S3 prefix/folder (default: farm-commons-backups)
#   ENABLE_S3           Enable S3 upload (default: false)
#
################################################################################

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration with defaults
POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_DB="${POSTGRES_DB:-farm_commons}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
BACKUP_RETENTION="${BACKUP_RETENTION:-30}"
S3_BUCKET="${S3_BUCKET:-}"
S3_PREFIX="${S3_PREFIX:-farm-commons-backups}"
ENABLE_S3="${ENABLE_S3:-false}"

# Script variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_FILE="farm_commons_backup_${TIMESTAMP}.sql.gz"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"
LOG_FILE="${BACKUP_DIR}/backup.log"
VERIFY_ONLY=false
RESTORE_FILE=""

################################################################################
# Logging Functions
################################################################################

log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local color=""

    case $level in
        INFO)  color=$BLUE ;;
        SUCCESS) color=$GREEN ;;
        WARN)  color=$YELLOW ;;
        ERROR) color=$RED ;;
    esac

    echo -e "${color}[${timestamp}] [${level}] ${message}${NC}" | tee -a "${LOG_FILE}"
}

info() {
    log INFO "$*"
}

success() {
    log SUCCESS "$*"
}

warn() {
    log WARN "$*"
}

error() {
    log ERROR "$*"
}

################################################################################
# Helper Functions
################################################################################

show_help() {
    cat << EOF
Farm Commons Database Backup Script

Usage: $(basename "$0") [options]

Options:
    --verify-only           Only verify existing backups without creating new ones
    --restore FILE          Restore database from backup file
    --help                  Show this help message

Environment Variables:
    POSTGRES_HOST           Database host (default: localhost)
    POSTGRES_PORT           Database port (default: 5432)
    POSTGRES_DB             Database name (default: farm_commons)
    POSTGRES_USER           Database user (default: postgres)
    POSTGRES_PASSWORD       Database password (required)
    BACKUP_DIR              Backup directory (default: ./backups)
    BACKUP_RETENTION        Days to keep backups (default: 30)
    S3_BUCKET               S3 bucket for offsite storage (optional)
    S3_PREFIX               S3 prefix/folder (default: farm-commons-backups)
    ENABLE_S3               Enable S3 upload (default: false)

Example:
    # Create backup
    POSTGRES_PASSWORD=secret ./backup-database.sh

    # Verify backups
    ./backup-database.sh --verify-only

    # Restore from backup
    POSTGRES_PASSWORD=secret ./backup-database.sh --restore backups/farm_commons_backup_20250110_120000.sql.gz

    # Enable S3 upload
    POSTGRES_PASSWORD=secret ENABLE_S3=true S3_BUCKET=my-bucket ./backup-database.sh

EOF
    exit 0
}

check_dependencies() {
    local missing_deps=()

    # Check required commands
    if ! command -v pg_dump &> /dev/null; then
        missing_deps+=("pg_dump (PostgreSQL client tools)")
    fi

    if ! command -v gzip &> /dev/null; then
        missing_deps+=("gzip")
    fi

    if [[ "${ENABLE_S3}" == "true" ]] && ! command -v aws &> /dev/null; then
        missing_deps+=("aws (AWS CLI)")
    fi

    if [ ${#missing_deps[@]} -ne 0 ]; then
        error "Missing required dependencies:"
        for dep in "${missing_deps[@]}"; do
            error "  - ${dep}"
        done
        exit 1
    fi
}

check_database_connection() {
    info "Checking database connection..."

    export PGPASSWORD="${POSTGRES_PASSWORD}"

    if ! psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -c "SELECT 1;" &> /dev/null; then
        error "Unable to connect to database"
        error "Host: ${POSTGRES_HOST}:${POSTGRES_PORT}"
        error "Database: ${POSTGRES_DB}"
        error "User: ${POSTGRES_USER}"
        exit 1
    fi

    success "Database connection successful"
}

################################################################################
# Backup Functions
################################################################################

create_backup() {
    info "Starting database backup..."
    info "Database: ${POSTGRES_DB}"
    info "Backup file: ${BACKUP_PATH}"

    # Create backup directory if it doesn't exist
    mkdir -p "${BACKUP_DIR}"

    # Export password for pg_dump
    export PGPASSWORD="${POSTGRES_PASSWORD}"

    # Create backup with compression
    if pg_dump \
        -h "${POSTGRES_HOST}" \
        -p "${POSTGRES_PORT}" \
        -U "${POSTGRES_USER}" \
        -d "${POSTGRES_DB}" \
        --format=plain \
        --no-owner \
        --no-acl \
        --clean \
        --if-exists \
        | gzip > "${BACKUP_PATH}"; then

        local backup_size=$(du -h "${BACKUP_PATH}" | cut -f1)
        success "Backup created successfully (${backup_size})"
        return 0
    else
        error "Backup failed"
        return 1
    fi
}

verify_backup() {
    local backup_file=$1
    info "Verifying backup: ${backup_file}"

    # Check if file exists
    if [ ! -f "${backup_file}" ]; then
        error "Backup file does not exist: ${backup_file}"
        return 1
    fi

    # Check if file is not empty
    if [ ! -s "${backup_file}" ]; then
        error "Backup file is empty: ${backup_file}"
        return 1
    fi

    # Verify gzip integrity
    if ! gzip -t "${backup_file}" 2>/dev/null; then
        error "Backup file is corrupted (gzip test failed): ${backup_file}"
        return 1
    fi

    # Verify SQL content
    if ! zcat "${backup_file}" | head -n 20 | grep -q "PostgreSQL database dump"; then
        error "Backup file does not appear to be a valid PostgreSQL dump: ${backup_file}"
        return 1
    fi

    success "Backup verification passed: ${backup_file}"
    return 0
}

verify_all_backups() {
    info "Verifying all backups in ${BACKUP_DIR}..."

    local backup_count=0
    local valid_count=0
    local invalid_count=0

    while IFS= read -r -d '' backup_file; do
        backup_count=$((backup_count + 1))
        if verify_backup "${backup_file}"; then
            valid_count=$((valid_count + 1))
        else
            invalid_count=$((invalid_count + 1))
        fi
    done < <(find "${BACKUP_DIR}" -name "farm_commons_backup_*.sql.gz" -print0)

    info "Verification complete:"
    info "  Total backups: ${backup_count}"
    success "  Valid backups: ${valid_count}"
    if [ ${invalid_count} -gt 0 ]; then
        error "  Invalid backups: ${invalid_count}"
    fi
}

################################################################################
# S3 Upload Functions
################################################################################

upload_to_s3() {
    local backup_file=$1

    if [[ "${ENABLE_S3}" != "true" ]]; then
        return 0
    fi

    if [ -z "${S3_BUCKET}" ]; then
        warn "S3_BUCKET not set, skipping S3 upload"
        return 0
    fi

    info "Uploading backup to S3..."
    info "Bucket: s3://${S3_BUCKET}/${S3_PREFIX}/"

    local s3_path="s3://${S3_BUCKET}/${S3_PREFIX}/$(basename "${backup_file}")"

    if aws s3 cp "${backup_file}" "${s3_path}" --storage-class STANDARD_IA; then
        success "Backup uploaded to S3: ${s3_path}"
        return 0
    else
        error "Failed to upload backup to S3"
        return 1
    fi
}

################################################################################
# Retention Policy Functions
################################################################################

cleanup_old_backups() {
    info "Cleaning up backups older than ${BACKUP_RETENTION} days..."

    local deleted_count=0

    # Find and delete old backups
    while IFS= read -r -d '' backup_file; do
        info "Deleting old backup: ${backup_file}"
        rm -f "${backup_file}"
        deleted_count=$((deleted_count + 1))
    done < <(find "${BACKUP_DIR}" -name "farm_commons_backup_*.sql.gz" -type f -mtime "+${BACKUP_RETENTION}" -print0)

    if [ ${deleted_count} -gt 0 ]; then
        success "Deleted ${deleted_count} old backup(s)"
    else
        info "No old backups to delete"
    fi

    # Cleanup old S3 backups if enabled
    if [[ "${ENABLE_S3}" == "true" ]] && [ -n "${S3_BUCKET}" ]; then
        cleanup_old_s3_backups
    fi
}

cleanup_old_s3_backups() {
    info "Cleaning up S3 backups older than ${BACKUP_RETENTION} days..."

    local cutoff_date=$(date -d "${BACKUP_RETENTION} days ago" +%Y-%m-%d 2>/dev/null || date -v-${BACKUP_RETENTION}d +%Y-%m-%d)

    # List and delete old S3 backups
    aws s3 ls "s3://${S3_BUCKET}/${S3_PREFIX}/" | while read -r line; do
        local file_date=$(echo "$line" | awk '{print $1}')
        local file_name=$(echo "$line" | awk '{print $4}')

        if [[ "${file_date}" < "${cutoff_date}" ]]; then
            local s3_path="s3://${S3_BUCKET}/${S3_PREFIX}/${file_name}"
            info "Deleting old S3 backup: ${s3_path}"
            aws s3 rm "${s3_path}"
        fi
    done
}

################################################################################
# Restore Functions
################################################################################

restore_backup() {
    local backup_file=$1

    if [ ! -f "${backup_file}" ]; then
        error "Backup file does not exist: ${backup_file}"
        exit 1
    fi

    warn "WARNING: This will restore the database from backup!"
    warn "Database: ${POSTGRES_DB}"
    warn "Backup file: ${backup_file}"
    warn ""
    warn "This operation will:"
    warn "  1. Drop all existing tables"
    warn "  2. Restore data from the backup file"
    warn ""

    read -p "Are you sure you want to continue? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        info "Restore cancelled"
        exit 0
    fi

    info "Verifying backup before restore..."
    if ! verify_backup "${backup_file}"; then
        error "Backup verification failed, aborting restore"
        exit 1
    fi

    info "Starting database restore..."
    export PGPASSWORD="${POSTGRES_PASSWORD}"

    if zcat "${backup_file}" | psql \
        -h "${POSTGRES_HOST}" \
        -p "${POSTGRES_PORT}" \
        -U "${POSTGRES_USER}" \
        -d "${POSTGRES_DB}" \
        --quiet; then

        success "Database restored successfully from: ${backup_file}"
    else
        error "Database restore failed"
        exit 1
    fi
}

################################################################################
# Main Function
################################################################################

main() {
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --verify-only)
                VERIFY_ONLY=true
                shift
                ;;
            --restore)
                RESTORE_FILE="$2"
                shift 2
                ;;
            --help)
                show_help
                ;;
            *)
                error "Unknown option: $1"
                show_help
                ;;
        esac
    done

    # Create backup directory and log file
    mkdir -p "${BACKUP_DIR}"

    info "========================================"
    info "Farm Commons Database Backup"
    info "========================================"

    # Check dependencies
    check_dependencies

    # Handle restore mode
    if [ -n "${RESTORE_FILE}" ]; then
        check_database_connection
        restore_backup "${RESTORE_FILE}"
        exit 0
    fi

    # Handle verify-only mode
    if [ "${VERIFY_ONLY}" = true ]; then
        verify_all_backups
        exit 0
    fi

    # Check password is set
    if [ -z "${POSTGRES_PASSWORD}" ]; then
        error "POSTGRES_PASSWORD environment variable is required"
        exit 1
    fi

    # Check database connection
    check_database_connection

    # Create backup
    if ! create_backup; then
        error "Backup process failed"
        exit 1
    fi

    # Verify the newly created backup
    if ! verify_backup "${BACKUP_PATH}"; then
        error "Backup verification failed"
        exit 1
    fi

    # Upload to S3 if enabled
    upload_to_s3 "${BACKUP_PATH}"

    # Cleanup old backups
    cleanup_old_backups

    success "========================================"
    success "Backup process completed successfully"
    success "========================================"
}

# Run main function
main "$@"
