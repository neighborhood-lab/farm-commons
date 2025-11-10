# Local Development Setup

This guide will help you set up Farm Commons for local development on your machine.

## Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

- **Node.js 22.x or higher** - [Download](https://nodejs.org/)
  ```bash
  node --version  # Should be v22.0.0 or higher
  ```

- **npm 10.9.4 or higher** - Comes with Node.js
  ```bash
  npm --version  # Should be 10.9.4 or higher
  ```

- **PostgreSQL 15** - [Download](https://www.postgresql.org/download/)
  ```bash
  psql --version  # Should be 15.x or higher
  ```

- **Git** - [Download](https://git-scm.com/)
  ```bash
  git --version
  ```

### Optional Software

- **Redis** - For caching and rate limiting (optional for basic development)
  ```bash
  redis-server --version
  ```

- **Docker & Docker Compose** - For containerized development
  ```bash
  docker --version
  docker-compose --version
  ```

## Installation Steps

### 1. Fork and Clone the Repository

If you're planning to contribute, fork the repository first on GitHub.

```bash
# Clone your fork (replace YOUR_USERNAME with your GitHub username)
git clone https://github.com/YOUR_USERNAME/farm-commons.git
cd farm-commons

# Add upstream remote to keep your fork in sync
git remote add upstream https://github.com/neighborhood-lab/farm-commons.git
```

Or clone directly if you're just exploring:

```bash
git clone https://github.com/neighborhood-lab/farm-commons.git
cd farm-commons
```

### 2. Install Dependencies

Farm Commons uses npm workspaces for monorepo management. Install all dependencies:

```bash
npm install
```

This will install dependencies for all packages (backend, frontend, shared, mobile).

### 3. Database Setup

#### Option A: Using Local PostgreSQL

1. **Create the database:**
   ```bash
   # Connect to PostgreSQL
   psql -U postgres

   # Create the database
   CREATE DATABASE farm_commons;

   # Create a user (optional but recommended)
   CREATE USER farm_commons_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE farm_commons TO farm_commons_user;

   # Exit psql
   \q
   ```

2. **Set environment variables:**
   ```bash
   cp .env.example .env
   ```

3. **Edit `.env` file with your database credentials:**
   ```env
   DATABASE_URL=postgresql://farm_commons_user:your_password@localhost:5432/farm_commons
   POSTGRES_HOST=localhost
   POSTGRES_PORT=5432
   POSTGRES_DB=farm_commons
   POSTGRES_USER=farm_commons_user
   POSTGRES_PASSWORD=your_password
   ```

#### Option B: Using Docker

```bash
# Start PostgreSQL and Redis containers
docker-compose up -d postgres redis

# The default credentials are in docker-compose.yml
# DATABASE_URL=postgresql://postgres:password@localhost:5432/farm_commons
```

### 4. Run Database Migrations

```bash
# Run all migrations to create tables
npm run db:migrate:latest
```

You should see output indicating successful migrations:
```
Batch 1 run: 5 migrations
✅ 001_initial_schema.ts
✅ 002_add_fields_table.ts
✅ 003_add_certifications.ts
...
```

### 5. Seed the Database (Optional)

Load sample data for development:

```bash
npm run db:seed
```

This creates:
- Demo farm account
- Sample workers
- Example schedules
- Test time entries

### 6. Configure Environment Variables

Review and update your `.env` file with appropriate values:

```env
# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/farm_commons

# Redis Configuration (optional for basic dev)
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Server Configuration
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173

# Logging
LOG_LEVEL=debug

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=http://localhost:5173
```

### 7. Start Development Servers

#### Start All Services (Recommended)

```bash
npm run dev
```

This starts both backend and frontend concurrently using Turborepo.

#### Or Start Services Individually

**Backend only:**
```bash
npm run dev:backend
# Backend API runs on http://localhost:3001
```

**Frontend only:**
```bash
npm run dev:frontend
# Frontend runs on http://localhost:5173
```

### 8. Verify Installation

Once the servers are running:

1. **Backend Health Check:**
   ```bash
   curl http://localhost:3001/health
   ```

   Expected response:
   ```json
   {
     "status": "healthy",
     "timestamp": "2025-11-10T...",
     "uptime": 12.345,
     "environment": "development"
   }
   ```

2. **Frontend:**
   Open your browser to http://localhost:5173

   You should see the Farm Commons login page.

3. **Test Login (if seeded):**
   - Email: `admin@farmcommons.local`
   - Password: `password123`

## Development Workflow

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm test:coverage

# Run tests for a specific package
npm test --workspace=@farm-commons/backend
npm test --workspace=@farm-commons/frontend
```

### Code Quality Checks

```bash
# Run ESLint
npm run lint

# Run TypeScript type checking
npm run typecheck

# Run Prettier (auto-format)
npm run format
```

### Database Commands

```bash
# Create a new migration
npm run db:migrate:make --workspace=@farm-commons/backend -- migration_name

# Run pending migrations
npm run db:migrate:latest

# Rollback last migration
npm run db:migrate:rollback

# Seed the database
npm run db:seed
```

### Build for Production

```bash
# Build all packages
npm run build

# Build specific package
npm run build --workspace=@farm-commons/frontend
```

## Troubleshooting

### Port Already in Use

If you get an error that port 3001 or 5173 is already in use:

```bash
# Find and kill the process using the port
# On macOS/Linux:
lsof -ti:3001 | xargs kill -9
lsof -ti:5173 | xargs kill -9

# On Windows:
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### Database Connection Errors

```bash
# Check if PostgreSQL is running
pg_isready

# On macOS:
brew services list | grep postgresql

# On Linux:
sudo systemctl status postgresql
```

### Migration Errors

If migrations fail:

```bash
# Rollback and try again
npm run db:migrate:rollback
npm run db:migrate:latest

# Or reset the database (WARNING: destroys all data)
dropdb farm_commons
createdb farm_commons
npm run db:migrate:latest
npm run db:seed
```

### Node Version Issues

Ensure you're using the correct Node.js version:

```bash
# Using nvm (recommended)
nvm install 22
nvm use 22

# Verify version
node --version
```

### Clean Install

If you're experiencing dependency issues:

```bash
# Clean everything and reinstall
npm run clean
rm -rf node_modules package-lock.json
npm install
```

## IDE Setup

### VS Code (Recommended)

Install these extensions for the best experience:

- **ESLint** - `dbaeumer.vscode-eslint`
- **Prettier** - `esbenp.prettier-vscode`
- **TypeScript Vue Plugin** - `Vue.volar`
- **Tailwind CSS IntelliSense** - `bradlc.vscode-tailwindcss`
- **PostgreSQL** - `ckolkman.vscode-postgres`

Recommended `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

## Docker Development (Alternative)

If you prefer containerized development:

```bash
# Start all services
docker-compose up

# Or run in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Reset everything (including volumes)
docker-compose down -v
```

## Next Steps

- Read the [Architecture Overview](./architecture.md) to understand the codebase structure
- Review [Contributing Guidelines](./contributing.md) before making changes
- Check out [Code Style Guide](./code-style.md) for coding standards
- Explore the [TASKS.md](../../TASKS.md) file for tasks you can work on

## Getting Help

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section above
2. Search [GitHub Issues](https://github.com/neighborhood-lab/farm-commons/issues)
3. Ask in [GitHub Discussions](https://github.com/neighborhood-lab/farm-commons/discussions)
4. Join our community (links coming soon)

---

**Happy Coding! 🚜**

*Built with soil under our fingernails*
