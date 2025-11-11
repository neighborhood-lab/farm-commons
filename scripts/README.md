# Farm Commons Database Backup Scripts

This directory contains scripts for backing up and restoring the Farm Commons PostgreSQL database.

## Overview

The backup system provides:

- ✅ **Automated daily backups** via cron
- ✅ **30-day retention policy** (configurable)
- ✅ **S3 upload option** for offsite storage
- ✅ **Backup verification** to ensure integrity
- ✅ **Compression** to save storage space
- ✅ **Easy restore** functionality
- ✅ **Comprehensive logging**

## Quick Start

### Prerequisites

1. **PostgreSQL client tools** (`pg_dump`, `psql`)
   ```bash
   # Ubuntu/Debian
   sudo apt-get install postgresql-client

   # macOS
   brew install postgresql

   # RedHat/CentOS
   sudo yum install postgresql
   ```

2. **AWS CLI** (optional, only if using S3 upload)
   ```bash
   # Install AWS CLI
   pip install awscli

   # Configure AWS credentials
   aws configure
   ```

### Basic Usage

#### Create a Backup

```bash
# Using environment variables
POSTGRES_PASSWORD=your_password ./scripts/backup-database.sh

# Or source from .env file
source .env
./scripts/backup-database.sh
```

#### Verify Backups

```bash
./scripts/backup-database.sh --verify-only
```

#### Restore from Backup

```bash
POSTGRES_PASSWORD=your_password ./scripts/backup-database.sh --restore backups/farm_commons_backup_20250110_120000.sql.gz
```

#### Show Help

```bash
./scripts/backup-database.sh --help
```

## Configuration

### Environment Variables

The script can be configured using environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_HOST` | `localhost` | Database host |
| `POSTGRES_PORT` | `5432` | Database port |
| `POSTGRES_DB` | `farm_commons` | Database name |
| `POSTGRES_USER` | `postgres` | Database user |
| `POSTGRES_PASSWORD` | *(required)* | Database password |
| `BACKUP_DIR` | `./backups` | Directory to store backups |
| `BACKUP_RETENTION` | `30` | Days to keep backups |
| `S3_BUCKET` | *(empty)* | S3 bucket for offsite storage |
| `S3_PREFIX` | `farm-commons-backups` | S3 folder prefix |
| `ENABLE_S3` | `false` | Enable S3 upload |

### Example Configuration File

Create a file `backup.env` (do not commit this file!):

```bash
# Database Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=farm_commons
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password

# Backup Configuration
BACKUP_DIR=/var/backups/farm-commons
BACKUP_RETENTION=30

# S3 Configuration (optional)
ENABLE_S3=true
S3_BUCKET=your-backup-bucket
S3_PREFIX=farm-commons-backups
```

Then use it:

```bash
source backup.env
./scripts/backup-database.sh
```

## Automated Backups with Cron

### Setup Daily Backups

1. **Copy the example cron file:**
   ```bash
   cp scripts/backup-cron.example scripts/backup-cron
   ```

2. **Edit the cron file with your configuration:**
   ```bash
   nano scripts/backup-cron
   ```

3. **Install the cron job:**
   ```bash
   crontab scripts/backup-cron
   ```

4. **Verify the cron job is installed:**
   ```bash
   crontab -l
   ```

### Recommended Cron Schedule

```bash
# Daily backup at 2 AM
0 2 * * * cd /path/to/farm-commons && POSTGRES_PASSWORD=your_password ./scripts/backup-database.sh >> /var/log/farm-commons-backup.log 2>&1

# Weekly verification at 4 AM on Sundays
0 4 * * 0 cd /path/to/farm-commons && ./scripts/backup-database.sh --verify-only >> /var/log/farm-commons-backup-verify.log 2>&1
```

### Secure Password Handling

**Never put passwords directly in cron jobs!** Use one of these secure alternatives:

#### Option 1: PostgreSQL Password File

Create `~/.pgpass`:

```
localhost:5432:farm_commons:postgres:your_password
```

Set permissions:

```bash
chmod 600 ~/.pgpass
```

Then your cron job doesn't need `POSTGRES_PASSWORD`.

#### Option 2: Environment File

Create `/etc/farm-commons/backup.env`:

```bash
POSTGRES_PASSWORD=your_password
```

Set permissions:

```bash
sudo chmod 600 /etc/farm-commons/backup.env
```

Use in cron:

```bash
0 2 * * * source /etc/farm-commons/backup.env && cd /path/to/farm-commons && ./scripts/backup-database.sh
```

## S3 Offsite Backups

### Enable S3 Upload

1. **Configure AWS CLI:**
   ```bash
   aws configure
   ```

2. **Create S3 bucket:**
   ```bash
   aws s3 mb s3://your-backup-bucket
   ```

3. **Enable lifecycle policy** (optional, for cost optimization):
   ```bash
   aws s3api put-bucket-lifecycle-configuration --bucket your-backup-bucket --lifecycle-configuration file://s3-lifecycle.json
   ```

4. **Run backup with S3 enabled:**
   ```bash
   POSTGRES_PASSWORD=your_password \
   ENABLE_S3=true \
   S3_BUCKET=your-backup-bucket \
   ./scripts/backup-database.sh
   ```

### S3 Lifecycle Policy Example

Create `s3-lifecycle.json`:

```json
{
  "Rules": [
    {
      "Id": "MoveToGlacier",
      "Status": "Enabled",
      "Prefix": "farm-commons-backups/",
      "Transitions": [
        {
          "Days": 30,
          "StorageClass": "GLACIER"
        }
      ],
      "Expiration": {
        "Days": 365
      }
    }
  ]
}
```

This will:
- Move backups to Glacier after 30 days (cheaper storage)
- Delete backups after 365 days

## Backup Verification

### Why Verify Backups?

Backups are only useful if they can be restored! Regular verification ensures:

- Files are not corrupted
- Compression is intact
- SQL dump is valid
- Restore process will work when needed

### Automatic Verification

The backup script automatically verifies each backup after creation.

### Manual Verification

Verify all backups:

```bash
./scripts/backup-database.sh --verify-only
```

This will check:
- ✅ File exists
- ✅ File is not empty
- ✅ Gzip compression is valid
- ✅ SQL dump header is present

### Test Restore (Recommended)

Periodically test the restore process in a staging environment:

```bash
# 1. Create a test database
createdb farm_commons_test

# 2. Restore to test database
POSTGRES_DB=farm_commons_test \
POSTGRES_PASSWORD=your_password \
./scripts/backup-database.sh --restore backups/latest_backup.sql.gz

# 3. Verify data integrity
psql -d farm_commons_test -c "SELECT COUNT(*) FROM workers;"

# 4. Drop test database
dropdb farm_commons_test
```

## Disaster Recovery

### Restore Process

1. **Stop the application:**
   ```bash
   # Stop the backend server
   pm2 stop farm-commons
   # or
   systemctl stop farm-commons
   ```

2. **List available backups:**
   ```bash
   ls -lh backups/
   ```

3. **Verify the backup:**
   ```bash
   ./scripts/backup-database.sh --verify-only
   ```

4. **Restore the database:**
   ```bash
   POSTGRES_PASSWORD=your_password \
   ./scripts/backup-database.sh --restore backups/farm_commons_backup_20250110_120000.sql.gz
   ```

5. **Restart the application:**
   ```bash
   pm2 start farm-commons
   # or
   systemctl start farm-commons
   ```

### Restore from S3

1. **Download backup from S3:**
   ```bash
   aws s3 cp s3://your-bucket/farm-commons-backups/farm_commons_backup_20250110_120000.sql.gz ./backups/
   ```

2. **Follow the restore process above**

## Monitoring and Alerts

### Log Files

Backup logs are stored in:

```
backups/backup.log
```

View recent logs:

```bash
tail -f backups/backup.log
```

### Email Notifications

Add email notifications to your cron job:

```bash
# Install mailutils
sudo apt-get install mailutils

# Modify cron to send email on failure
0 2 * * * /path/to/backup-database.sh || echo "Backup failed!" | mail -s "Farm Commons Backup Failed" admin@example.com
```

### Monitoring with Healthchecks.io

Free service to monitor cron jobs:

```bash
# At the end of backup-database.sh, add:
curl -fsS --retry 3 https://hc-ping.com/your-uuid-here
```

## Backup Storage Requirements

### Estimating Backup Size

Check your current database size:

```bash
psql -d farm_commons -c "SELECT pg_size_pretty(pg_database_size('farm_commons'));"
```

Compressed backups are typically 10-20% of the original size.

### Storage Calculations

Example: 100MB database
- Compressed backup: ~15MB
- 30 days of daily backups: ~450MB
- Plus 10% overhead: ~500MB

Ensure your `BACKUP_DIR` has sufficient space:

```bash
df -h /var/backups
```

## Troubleshooting

### "pg_dump: command not found"

Install PostgreSQL client tools:

```bash
sudo apt-get install postgresql-client
```

### "Permission denied"

Make the script executable:

```bash
chmod +x scripts/backup-database.sh
```

### "Unable to connect to database"

Check:
1. PostgreSQL is running: `systemctl status postgresql`
2. Credentials are correct: test with `psql`
3. Host/port are accessible: `telnet localhost 5432`

### "Backup verification failed"

The backup file may be corrupted. Check:
1. Disk space: `df -h`
2. Disk errors: `dmesg | grep -i error`
3. Try creating a new backup

### "S3 upload failed"

Check:
1. AWS credentials: `aws sts get-caller-identity`
2. Bucket exists: `aws s3 ls s3://your-bucket`
3. Permissions: Ensure user has `s3:PutObject` permission

## Security Best Practices

1. **Never commit passwords** to version control
   - Use `.gitignore` for `backup.env`
   - Use secrets management systems

2. **Encrypt backups** for sensitive data
   ```bash
   # Encrypt backup
   gpg --encrypt --recipient your-email@example.com backup.sql.gz

   # Decrypt backup
   gpg --decrypt backup.sql.gz.gpg > backup.sql.gz
   ```

3. **Restrict file permissions**
   ```bash
   chmod 700 scripts/backup-database.sh
   chmod 600 backup.env
   chmod 700 backups/
   ```

4. **Use dedicated backup user** with read-only access
   ```sql
   CREATE USER backup_user WITH PASSWORD 'secure_password';
   GRANT CONNECT ON DATABASE farm_commons TO backup_user;
   GRANT SELECT ON ALL TABLES IN SCHEMA public TO backup_user;
   ```

5. **Enable S3 encryption**
   ```bash
   aws s3 cp backup.sql.gz s3://bucket/path/ --sse AES256
   ```

## Performance Considerations

### Large Databases

For databases larger than 10GB, consider:

1. **Parallel backups** (PostgreSQL 12+):
   ```bash
   pg_dump --format=directory --jobs=4 -f backup_dir
   ```

2. **Incremental backups** with WAL archiving:
   - Configure continuous archiving
   - Use `pg_basebackup` for base backups
   - Archive WAL files for point-in-time recovery

3. **Backup during low-traffic hours**
   - Schedule backups at 2-4 AM
   - Monitor database load

### Network Bandwidth (S3 Upload)

For large backups over slow connections:

1. **Use S3 multipart upload**
   ```bash
   aws configure set default.s3.multipart_threshold 64MB
   ```

2. **Compress with better algorithms**
   ```bash
   # Use xz for better compression (slower)
   pg_dump | xz > backup.sql.xz

   # Use pigz for parallel gzip (faster)
   pg_dump | pigz > backup.sql.gz
   ```

## License

This script is part of the Farm Commons project and is licensed under the same license as the main project.

## Support

For issues or questions:
1. Check the logs: `tail -f backups/backup.log`
2. Review this README
3. Open an issue on the project repository

## Additional Resources

- [PostgreSQL Backup Documentation](https://www.postgresql.org/docs/current/backup.html)
- [AWS S3 Backup Best Practices](https://docs.aws.amazon.com/AmazonS3/latest/userguide/backup-for-s3.html)
- [Cron Documentation](https://man7.org/linux/man-pages/man5/crontab.5.html)
