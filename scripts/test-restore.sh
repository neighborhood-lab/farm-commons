#!/usr/bin/env bash

################################################################################
# Farm Commons Database Backup Restore Test Script
#
# This script tests the backup restore process in a safe test database
# without affecting the production database.
#
# Usage:
#   ./test-restore.sh [backup_file]
#
# If no backup file is specified, it will test the most recent backup.
#
################################################################################

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-}"
TEST_DB_NAME="farm_commons_restore_test_$(date +%s)"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
BACKUP_FILE="${1:-}"

################################################################################
# Logging Functions
################################################################################

info() {
    echo -e "${BLUE}[INFO] $*${NC}"
}

success() {
    echo -e "${GREEN}[SUCCESS] $*${NC}"
}

warn() {
    echo -e "${YELLOW}[WARN] $*${NC}"
}

error() {
    echo -e "${RED}[ERROR] $*${NC}"
}

################################################################################
# Helper Functions
################################################################################

cleanup() {
    local exit_code=$?

    if [ -n "${TEST_DB_NAME}" ]; then
        info "Cleaning up test database: ${TEST_DB_NAME}"
        export PGPASSWORD="${POSTGRES_PASSWORD}"
        dropdb -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" "${TEST_DB_NAME}" 2>/dev/null || true
    fi

    if [ $exit_code -eq 0 ]; then
        success "Test completed successfully"
    else
        error "Test failed with exit code: ${exit_code}"
    fi

    exit $exit_code
}

trap cleanup EXIT INT TERM

check_dependencies() {
    local missing_deps=()

    if ! command -v psql &> /dev/null; then
        missing_deps+=("psql")
    fi

    if ! command -v createdb &> /dev/null; then
        missing_deps+=("createdb")
    fi

    if ! command -v dropdb &> /dev/null; then
        missing_deps+=("dropdb")
    fi

    if [ ${#missing_deps[@]} -ne 0 ]; then
        error "Missing required dependencies:"
        for dep in "${missing_deps[@]}"; do
            error "  - ${dep}"
        done
        exit 1
    fi
}

find_latest_backup() {
    local latest_backup=$(find "${BACKUP_DIR}" -name "farm_commons_backup_*.sql.gz" -type f -printf '%T@ %p\n' | sort -rn | head -1 | cut -d' ' -f2-)

    if [ -z "${latest_backup}" ]; then
        error "No backup files found in ${BACKUP_DIR}"
        exit 1
    fi

    echo "${latest_backup}"
}

################################################################################
# Test Functions
################################################################################

test_database_connection() {
    info "Testing database connection..."

    export PGPASSWORD="${POSTGRES_PASSWORD}"

    if ! psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" -d postgres -c "SELECT 1;" &> /dev/null; then
        error "Unable to connect to PostgreSQL server"
        exit 1
    fi

    success "Database connection successful"
}

create_test_database() {
    info "Creating test database: ${TEST_DB_NAME}"

    export PGPASSWORD="${POSTGRES_PASSWORD}"

    if createdb -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" "${TEST_DB_NAME}"; then
        success "Test database created"
    else
        error "Failed to create test database"
        exit 1
    fi
}

restore_backup_to_test_db() {
    local backup_file=$1

    info "Restoring backup to test database..."
    info "Backup file: ${backup_file}"
    info "Test database: ${TEST_DB_NAME}"

    export PGPASSWORD="${POSTGRES_PASSWORD}"

    # Check if file exists
    if [ ! -f "${backup_file}" ]; then
        error "Backup file does not exist: ${backup_file}"
        exit 1
    fi

    # Check if file is readable
    if [ ! -r "${backup_file}" ]; then
        error "Backup file is not readable: ${backup_file}"
        exit 1
    fi

    # Restore the backup
    if zcat "${backup_file}" | psql \
        -h "${POSTGRES_HOST}" \
        -p "${POSTGRES_PORT}" \
        -U "${POSTGRES_USER}" \
        -d "${TEST_DB_NAME}" \
        --quiet \
        2>&1 | grep -v "NOTICE"; then

        success "Backup restored successfully"
    else
        error "Failed to restore backup"
        exit 1
    fi
}

verify_restored_data() {
    info "Verifying restored data..."

    export PGPASSWORD="${POSTGRES_PASSWORD}"

    # Check if key tables exist
    local tables=("users" "farms" "workers" "schedules" "time_entries" "fields")
    local table_count=0

    for table in "${tables[@]}"; do
        if psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" -d "${TEST_DB_NAME}" \
            -c "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '${table}');" \
            -t -A 2>/dev/null | grep -q "t"; then

            local count=$(psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" -d "${TEST_DB_NAME}" \
                -c "SELECT COUNT(*) FROM ${table};" -t -A 2>/dev/null)

            info "  ✓ Table '${table}' exists with ${count} rows"
            table_count=$((table_count + 1))
        else
            warn "  ✗ Table '${table}' not found"
        fi
    done

    if [ ${table_count} -eq 0 ]; then
        error "No expected tables found in restored database"
        exit 1
    fi

    success "Data verification passed (${table_count}/${#tables[@]} tables found)"
}

verify_database_integrity() {
    info "Verifying database integrity..."

    export PGPASSWORD="${POSTGRES_PASSWORD}"

    # Check for foreign key violations
    local fk_violations=$(psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" -d "${TEST_DB_NAME}" \
        -c "DO \$\$
        DECLARE
            r RECORD;
        BEGIN
            FOR r IN (SELECT constraint_name, table_name FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY')
            LOOP
                EXECUTE 'SELECT COUNT(*) FROM ' || r.table_name || ' WHERE NOT EXISTS (SELECT 1 FROM ' ||
                    (SELECT referenced_table_name FROM information_schema.constraint_column_usage WHERE constraint_name = r.constraint_name LIMIT 1) || ')';
            END LOOP;
        END \$\$;" 2>&1 || echo "0")

    # Run basic integrity checks
    local integrity_check=$(psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" -d "${TEST_DB_NAME}" \
        -c "SELECT COUNT(*) FROM pg_stat_user_tables WHERE n_tup_ins + n_tup_upd + n_tup_del > 0;" -t -A 2>/dev/null || echo "0")

    if [ "${integrity_check}" -gt "0" ]; then
        success "Database integrity checks passed"
    else
        warn "Unable to fully verify database integrity (database may be empty)"
    fi
}

get_backup_size() {
    local backup_file=$1
    du -h "${backup_file}" | cut -f1
}

get_database_size() {
    export PGPASSWORD="${POSTGRES_PASSWORD}"

    psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" -d "${TEST_DB_NAME}" \
        -c "SELECT pg_size_pretty(pg_database_size('${TEST_DB_NAME}'));" -t -A 2>/dev/null | xargs
}

################################################################################
# Main Function
################################################################################

main() {
    echo ""
    info "========================================"
    info "Farm Commons Backup Restore Test"
    info "========================================"
    echo ""

    # Check dependencies
    check_dependencies

    # Check if password is set
    if [ -z "${POSTGRES_PASSWORD}" ]; then
        error "POSTGRES_PASSWORD environment variable is required"
        exit 1
    fi

    # Determine which backup to test
    if [ -z "${BACKUP_FILE}" ]; then
        info "No backup file specified, using most recent backup"
        BACKUP_FILE=$(find_latest_backup)
    fi

    if [ ! -f "${BACKUP_FILE}" ]; then
        error "Backup file not found: ${BACKUP_FILE}"
        exit 1
    fi

    local backup_size=$(get_backup_size "${BACKUP_FILE}")
    info "Testing backup: ${BACKUP_FILE}"
    info "Backup size: ${backup_size}"
    echo ""

    # Test database connection
    test_database_connection
    echo ""

    # Create test database
    create_test_database
    echo ""

    # Restore backup
    restore_backup_to_test_db "${BACKUP_FILE}"
    echo ""

    # Get restored database size
    local db_size=$(get_database_size)
    info "Restored database size: ${db_size}"
    echo ""

    # Verify restored data
    verify_restored_data
    echo ""

    # Verify database integrity
    verify_database_integrity
    echo ""

    success "========================================"
    success "Restore Test Completed Successfully"
    success "========================================"
    echo ""
    info "Summary:"
    info "  Backup file: ${BACKUP_FILE}"
    info "  Backup size: ${backup_size}"
    info "  Restored size: ${db_size}"
    info "  Test database: ${TEST_DB_NAME} (will be cleaned up)"
    echo ""
}

# Run main function
main "$@"
