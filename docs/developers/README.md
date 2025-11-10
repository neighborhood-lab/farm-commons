# Farm Commons Developer Documentation

Welcome to the Farm Commons developer documentation! This directory contains comprehensive guides for developers working on Farm Commons.

## 📚 Documentation Index

### Getting Started

1. **[Setup Guide](./setup.md)** - Start here!
   - Prerequisites and installation
   - Database setup
   - Running development servers
   - Troubleshooting common issues
   - IDE configuration

### Understanding the Codebase

2. **[Architecture Overview](./architecture.md)** - System design and structure
   - System architecture (3-tier design)
   - Monorepo structure with Turborepo
   - Technology stack details
   - Data models and relationships
   - API design principles
   - Authentication & authorization
   - State management patterns
   - Database architecture
   - Deployment architecture

### Contributing Code

3. **[Contributing Guidelines](./contributing.md)** - How to contribute
   - Development workflow
   - Working with packages
   - Adding new features
   - Database migrations
   - API routes
   - React components
   - Testing guidelines
   - Pull request process
   - Code review guidelines
   - Common development tasks

4. **[Code Style Guide](./code-style.md)** - Coding standards
   - General principles
   - TypeScript guidelines
   - React & frontend patterns
   - Backend & API conventions
   - Database & migrations
   - Testing standards
   - Naming conventions
   - File organization
   - Comments & documentation
   - Error handling

## 🚀 Quick Start for New Developers

### First Time Setup (15-20 minutes)

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/farm-commons.git
cd farm-commons

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# 4. Set up database
createdb farm_commons
npm run db:migrate:latest
npm run db:seed

# 5. Start development servers
npm run dev
```

**Next Steps:**
1. Read the [Architecture Overview](./architecture.md) to understand the system
2. Review the [Code Style Guide](./code-style.md) for coding standards
3. Pick a task from [TASKS.md](../../TASKS.md) to work on
4. Follow the [Contributing Guidelines](./contributing.md) when making changes

## 📖 Additional Resources

### Core Documentation

- **[Main README](../../README.md)** - Project overview and mission
- **[CONTRIBUTING.md](../../CONTRIBUTING.md)** - General contribution guidelines
- **[TASKS.md](../../TASKS.md)** - Available development tasks
- **[LICENSE](../../LICENSE)** - AGPL-3.0 License

### External Resources

- **[GitHub Repository](https://github.com/neighborhood-lab/farm-commons)**
- **[GitHub Issues](https://github.com/neighborhood-lab/farm-commons/issues)** - Bug reports and feature requests
- **[GitHub Discussions](https://github.com/neighborhood-lab/farm-commons/discussions)** - Questions and community
- **[CI/CD Pipeline](https://github.com/neighborhood-lab/farm-commons/actions)** - Automated tests and deployment

### Technology Documentation

**Backend:**
- [Express.js](https://expressjs.com/)
- [Node.js](https://nodejs.org/)
- [PostgreSQL](https://www.postgresql.org/docs/)
- [Knex.js](https://knexjs.org/)
- [Zod](https://zod.dev/)

**Frontend:**
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Query](https://tanstack.com/query/)
- [Zustand](https://zustand-demo.pmnd.rs/)

**Testing:**
- [Vitest](https://vitest.dev/)
- [Playwright](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)

**Tools:**
- [Turborepo](https://turbo.build/)
- [ESLint](https://eslint.org/)
- [Prettier](https://prettier.io/)

## 🎯 Common Development Tasks

### Running the Application

```bash
# Start all services (backend + frontend)
npm run dev

# Start backend only
npm run dev:backend

# Start frontend only
npm run dev:frontend
```

### Code Quality

```bash
# Run linter
npm run lint

# Run type checker
npm run typecheck

# Run all tests
npm test

# Run tests with coverage
npm test:coverage
```

### Database Operations

```bash
# Run migrations
npm run db:migrate:latest

# Rollback last migration
npm run db:migrate:rollback

# Create new migration
npm run db:migrate:make -- migration_name

# Seed database with demo data
npm run db:seed
```

### Building for Production

```bash
# Build all packages
npm run build

# Build specific package
npm run build --workspace=@farm-commons/frontend
```

## 🏗️ Project Structure

```
farm-commons/
├── docs/
│   ├── developers/          # 👈 You are here
│   │   ├── README.md        # This file
│   │   ├── setup.md
│   │   ├── architecture.md
│   │   ├── contributing.md
│   │   └── code-style.md
│   └── (future: user-guide/, api/, etc.)
│
├── packages/
│   ├── backend/             # Express API server
│   │   ├── src/
│   │   │   ├── routes/      # API endpoints
│   │   │   ├── middleware/  # Auth, validation, etc.
│   │   │   ├── db/          # Migrations & seeds
│   │   │   └── index.ts     # Server entry point
│   │   └── package.json
│   │
│   ├── frontend/            # React web app
│   │   ├── src/
│   │   │   ├── components/  # React components
│   │   │   ├── pages/       # Page components
│   │   │   ├── lib/         # API client, utilities
│   │   │   └── main.tsx     # App entry point
│   │   └── package.json
│   │
│   ├── shared/              # Shared types & utilities
│   │   ├── src/
│   │   │   ├── types.ts     # TypeScript interfaces
│   │   │   ├── validators.ts # Zod schemas
│   │   │   └── utils.ts     # Helper functions
│   │   └── package.json
│   │
│   └── mobile/              # React Native app (future)
│       └── package.json
│
├── .github/
│   └── workflows/           # CI/CD pipelines
│       └── ci.yml
│
├── .env.example             # Environment variables template
├── .eslintrc.json          # ESLint configuration
├── .prettierrc             # Prettier configuration
├── package.json            # Root package
├── tsconfig.json           # TypeScript config
├── turbo.json              # Turborepo config
├── CONTRIBUTING.md         # General contributing guide
├── TASKS.md                # Development task list
├── README.md               # Project overview
└── LICENSE                 # AGPL-3.0 License
```

## 🤝 Development Workflow

### For New Features

1. Pick a task from [TASKS.md](../../TASKS.md)
2. Create a feature branch: `git checkout -b feature/task-0008-description`
3. Implement the feature (see [Contributing Guide](./contributing.md))
4. Write tests for your code
5. Run quality checks: `npm run lint && npm run typecheck && npm test`
6. Commit with clear message: `git commit -m "feat: add field management page"`
7. Push and create a Pull Request
8. Address code review feedback
9. Merge when approved!

### For Bug Fixes

1. Create a branch: `git checkout -b fix/issue-123-description`
2. Write a test that reproduces the bug
3. Fix the bug
4. Verify the test passes
5. Submit a Pull Request

## 💡 Tips for Success

### Before You Start

- ✅ Complete the [Setup Guide](./setup.md) fully
- ✅ Read the [Architecture Overview](./architecture.md)
- ✅ Familiarize yourself with [Code Style Guide](./code-style.md)
- ✅ Browse existing code to see patterns in action

### While Developing

- ✅ Run tests frequently: `npm test`
- ✅ Check types often: `npm run typecheck`
- ✅ Commit small, focused changes
- ✅ Write descriptive commit messages
- ✅ Ask questions in GitHub Discussions

### Before Submitting PR

- ✅ All tests pass: `npm test`
- ✅ Linting passes: `npm run lint`
- ✅ Type checking passes: `npm run typecheck`
- ✅ Build succeeds: `npm run build`
- ✅ Documentation updated (if needed)
- ✅ PR description is clear and complete

## 🐛 Getting Help

### Documentation First

1. Search this developer documentation
2. Check the [Setup Guide](./setup.md) troubleshooting section
3. Review [GitHub Issues](https://github.com/neighborhood-lab/farm-commons/issues)

### Ask the Community

1. **GitHub Discussions** - For questions and ideas
2. **GitHub Issues** - For bugs and feature requests
3. **Code Comments** - Tag maintainers in PR reviews

### Reporting Issues

When reporting a bug, include:
- What you expected to happen
- What actually happened
- Steps to reproduce
- Environment details (OS, Node version, etc.)
- Error messages and stack traces
- Screenshots (if applicable)

## 🎓 Learning Path

### Week 1: Setup & Familiarization
- Complete local environment setup
- Read all developer documentation
- Run the application and explore features
- Browse the codebase
- Pick a "good first issue"

### Week 2: First Contribution
- Implement a small task
- Write tests for your code
- Submit your first Pull Request
- Respond to code review
- Learn from feedback

### Week 3+: Regular Contributions
- Take on more complex tasks
- Help review other PRs
- Improve documentation
- Suggest enhancements
- Mentor new contributors

## 📝 Documentation Standards

When updating these docs:

1. **Be Clear**: Use simple, direct language
2. **Be Specific**: Provide concrete examples
3. **Be Complete**: Don't assume prior knowledge
4. **Be Current**: Keep docs in sync with code
5. **Be Helpful**: Think like a new developer

## 🌟 Contributing to Documentation

Documentation improvements are always welcome!

```bash
# Create a docs branch
git checkout -b docs/improve-setup-guide

# Make your changes
# Edit docs/developers/setup.md

# Commit and push
git commit -m "docs: add Docker setup instructions"
git push origin docs/improve-setup-guide

# Create Pull Request
```

## 📞 Contact & Community

- **GitHub Issues**: [Report bugs and request features](https://github.com/neighborhood-lab/farm-commons/issues)
- **GitHub Discussions**: [Ask questions and share ideas](https://github.com/neighborhood-lab/farm-commons/discussions)
- **Email**: farm-commons@example.com (coming soon)

## 🙏 Acknowledgments

Thank you for contributing to Farm Commons! Every contribution, no matter how small, helps build software that serves farmworkers and small-scale farmers.

---

## Next Steps

**Ready to start developing?**

1. 📖 Read the [Setup Guide](./setup.md)
2. 🏗️ Review the [Architecture Overview](./architecture.md)
3. 💻 Pick a task from [TASKS.md](../../TASKS.md)
4. 🚀 Start coding!

**Questions?**

- Browse [GitHub Discussions](https://github.com/neighborhood-lab/farm-commons/discussions)
- Check [GitHub Issues](https://github.com/neighborhood-lab/farm-commons/issues)
- Read the existing documentation

---

<div align="center">

**Farm Commons Developer Docs**

*Built with soil under our fingernails* 🚜

**For the humans who feed us** 🌾

</div>
