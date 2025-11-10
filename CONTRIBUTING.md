# Contributing to Farm Commons

Thank you for your interest in contributing to Farm Commons! This document provides guidelines and instructions for contributing.

## Code of Conduct

Farm Commons is built to serve farmworkers and small-scale farmers. We are committed to providing a welcoming and inspiring community for all.

### Our Values

- **Respect for agricultural workers** - Center farmworker perspectives and experiences
- **Inclusive collaboration** - Welcome contributors from all backgrounds
- **Transparency** - Open communication and decision-making
- **Sustainability** - Long-term thinking for code, community, and agriculture

## Getting Started

### Prerequisites

- Node.js 22.x or higher
- npm 10.9.4 or higher
- PostgreSQL 15
- Git

### Local Development Setup

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/farm-commons.git
   cd farm-commons
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. Run database migrations:
   ```bash
   npm run db:migrate:latest
   ```

6. Start development servers:
   ```bash
   npm run dev
   ```

## Development Workflow

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test additions or updates

### Making Changes

1. Create a new branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes, following our coding standards

3. Write or update tests as needed

4. Run the test suite:
   ```bash
   npm test
   ```

5. Run linting and type checking:
   ```bash
   npm run lint
   npm run typecheck
   ```

6. Commit your changes with a clear message:
   ```bash
   git commit -m "Add feature: description of what you did"
   ```

7. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

8. Open a Pull Request on GitHub

### Commit Messages

Write clear, concise commit messages that describe what changed and why:

- Use the imperative mood ("Add feature" not "Added feature")
- Keep the first line under 72 characters
- Reference issues and pull requests where relevant

Examples:
```
Add worker certification expiration notifications

Fix time entry calculation when crossing midnight

Update README with installation instructions
```

## Coding Standards

### TypeScript

- Use TypeScript for all code
- Provide proper type annotations
- Avoid `any` type when possible
- Use interfaces for object shapes

### Code Style

- Follow the ESLint configuration
- Use Prettier for formatting
- Keep functions small and focused
- Write self-documenting code with clear names

### Testing

- Write unit tests for utilities and business logic
- Write integration tests for API endpoints
- Write E2E tests for critical user flows
- Aim for >80% code coverage

### Documentation

- Document public APIs and complex logic
- Update README when adding features
- Include JSDoc comments for functions
- Keep documentation up to date

## Pull Request Process

1. **Description**: Provide a clear description of what your PR does
2. **Testing**: Describe how you tested your changes
3. **Screenshots**: Include screenshots for UI changes
4. **Breaking Changes**: Clearly mark any breaking changes
5. **Checklist**: Complete the PR template checklist

### Review Process

- All PRs require at least one review
- CI checks must pass
- Address review feedback promptly
- Keep PRs focused and reasonably sized

## Areas for Contribution

### High Priority

- Multilingual support (especially Spanish)
- Offline-first mobile features
- Accessibility improvements
- Performance optimizations

### Good First Issues

Look for issues labeled `good-first-issue` in the GitHub issue tracker. These are well-defined tasks suitable for newcomers.

### Documentation

- Improve setup instructions
- Write user guides
- Translate documentation
- Add code examples

### Testing

- Increase test coverage
- Add E2E tests
- Test on different devices and browsers

## Community

### Getting Help

- **GitHub Issues**: Report bugs and request features
- **GitHub Discussions**: Ask questions and share ideas
- **Email**: farm-commons@example.com (coming soon)

### Recognition

Contributors are recognized in the following ways:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Featured on the project website (coming soon)

## License

By contributing to Farm Commons, you agree that your contributions will be licensed under the AGPL-3.0 License.

---

Thank you for helping build software that serves farmworkers and small-scale farmers!

*Built with soil under our fingernails* 🚜
