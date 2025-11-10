# 🚜 Farm Commons

> **Shared farm management software, community owned.**
> **For the humans who feed us.**

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL%203.0-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![CI](https://github.com/neighborhood-lab/farm-commons/workflows/CI/badge.svg)](https://github.com/neighborhood-lab/farm-commons/actions)

---

## What if we built farm management software that actually served farmers and farmworkers instead of corporations?

While tech culture obsesses over the latest trends, there's a massive, overlooked market: **small-scale agriculture and farmworker operations**. The global agricultural market is worth **$5+ trillion annually**, yet the software serving this sector is controlled by three massive corporations who couldn't care less about the humans doing the actual work.

**Farm Commons** is different. Built on the same principles as Care Commons, it's community-owned, open-source farm management software designed for:

- **Farmworkers** who deserve transparent scheduling, fair wage tracking, and digital tools that work offline
- **Small farmers** (under 500 acres) who can't afford $15k/year enterprise software
- **Regenerative agriculture operations** that prioritize sustainability over extractive yields
- **Farm cooperatives** that value local autonomy and data ownership

---

## The Problem

### The Three Corporate Giants (And Why Their Software Sucks)

1. **John Deere** (Since 1837)
   - Fights right-to-repair, forces subscription models, equipment DRM
   - Clunky software designed for industrial megafarms, not small operations

2. **Trimble Agriculture**
   - Enterprise-only focus, $10k+ annual subscriptions
   - Zero worker perspective, built for farm managers only

3. **Climate FieldView** (Bayer/Monsanto)
   - Data extraction for corporate ag
   - Designed to sell more chemicals and patented seeds

### Who's Being Left Behind

**The Workers:**
- 2.4 million farmworkers in the U.S. alone
- No scheduling transparency, rampant wage theft
- No digital tools, language barriers ignored
- Zero safety incident reporting systems

**The Small Farmers:**
- Family farms, organic operations, CSA programs
- Can't afford corporate ag-tech
- Need offline-first tools (rural connectivity is terrible)
- Ignored by venture-backed startups

---

## The Solution: Farm Commons

### Phase 1: Foundation (MVP - Current Release)

✅ **Worker & Labor Management**
- Staff directory with certifications and contact info
- Skills tracking and emergency contacts
- Multi-language support (starting with English/Spanish)

✅ **Scheduling & Field Assignment**
- Daily work schedules and task assignments
- Field-based assignments with GPS mapping
- Weekly calendar view with status tracking

✅ **Time Tracking & Compliance**
- Clock in/out with mobile support
- Automatic hours calculation with break tracking
- Verification workflow for managers
- Labor law compliance tracking

### Future Phases

**Phase 2: Operations**
- Crop planning and rotation tracking
- Harvest tracking and inventory management
- Customer management (CSA shares, farmers market sales)
- Equipment and maintenance logs

**Phase 3: Business Management**
- Payroll processing (W2/1099 management)
- Financial planning and budgeting
- Compliance and certification tracking (organic, GAP audits)
- Weather and climate data integration

**Phase 4: Community & Market**
- Co-op management and collective purchasing
- Market coordination and food hub integration
- Land access and succession planning
- Education and apprenticeship programs

---

## Technology Stack

### Production Runtime

**Frontend:**
- React 19 with TypeScript 5.9
- Vite 7 for blazing-fast builds
- Tailwind CSS 4.1 for styling
- React Query for state management
- Zustand for global state

**Backend:**
- Node.js 22 with Express 5
- PostgreSQL 15 (Vercel Postgres)
- Redis for caching
- JWT authentication with bcrypt
- Knex for database migrations

**Mobile:**
- React Native 0.82 with Expo 54
- WatermelonDB for offline-first storage
- React Navigation 7

**Infrastructure:**
- Vercel (primary hosting)
- Turborepo monorepo
- GitHub Actions CI/CD
- Automated testing with Vitest and Playwright

---

## Getting Started

### Prerequisites

- Node.js 22.x or higher
- npm 10.9.4 or higher
- PostgreSQL 15
- Redis (optional for development)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/neighborhood-lab/farm-commons.git
   cd farm-commons
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Run database migrations:**
   ```bash
   npm run db:migrate:latest
   ```

5. **Start development servers:**
   ```bash
   # Start all services (backend + frontend)
   npm run dev

   # Or run individually:
   npm run dev:backend   # Backend API on port 3001
   npm run dev:frontend  # Frontend on port 5173
   ```

### Development URLs

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001
- **Health Check:** http://localhost:3001/health

---

## Project Structure

```
farm-commons/
├── packages/
│   ├── backend/          # Express API server
│   │   ├── src/
│   │   │   ├── routes/   # API endpoints
│   │   │   ├── middleware/
│   │   │   ├── db/       # Database migrations & seeds
│   │   │   └── index.ts
│   │   └── package.json
│   ├── frontend/         # React web application
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   ├── lib/      # API client, store
│   │   │   └── main.tsx
│   │   └── package.json
│   ├── shared/           # Shared types & utilities
│   │   ├── src/
│   │   │   ├── types.ts
│   │   │   ├── validators.ts
│   │   │   └── utils.ts
│   │   └── package.json
│   └── mobile/           # React Native app (future)
├── .github/workflows/    # CI/CD pipelines
├── package.json          # Root package
├── turbo.json           # Turborepo config
└── README.md
```

---

## Core Principles

### Human-Scale Workflows
Built for 5-500 acre farms, not 50,000 acre industrial operations.

### Local Autonomy
Runs offline, supports on-premises servers, you own your data.

### Interoperability
Open APIs, CSV exports, integrates with co-op systems.

### Privacy First
Worker data stays with the farm, never sold to corporations.

### Incremental Adoption
Start with scheduling, add features as you need them.

### Community Owned
Open source (AGPL-3.0), funded by farm co-ops and community support.

---

## Why This Matters

### It's Counter-Cultural

Right now, the zeitgeist says:
- Agriculture is dying, everyone should learn to code
- Small farms are inefficient, industrial ag is inevitable
- Rural communities are backwards, cities are the future
- Physical labor is low-status, knowledge work is everything

**Farm Commons celebrates:**
- Working with the land and seasons
- Physical competence and agricultural knowledge
- Rural communities and distributed food systems
- Worker dignity and fair compensation
- Regenerative practices over extractive yields

This is deeply counter-cultural. Unfashionable. Forgotten.

**And that's exactly why it matters.**

---

## Contributing

We welcome contributions from developers, farmers, agronomists, and anyone passionate about sustainable agriculture and farmworker rights.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards

- TypeScript for all code
- ESLint + Prettier for formatting
- Vitest for unit tests
- Playwright for E2E tests
- All PRs require passing CI checks

---

## Funding Model

**Farm Commons** follows the same community-funding model as Care Commons:

- **Open Source (AGPL-3.0):** No corporate capture, no proprietary lock-in
- **Community Funded:** Supported by farm co-ops, CSA networks, and regenerative ag organizations
- **Self-Hostable:** Run on your own infrastructure, no SaaS lock-in
- **Human-Scale:** Built by farmers and technologists who actually care

### Support the Project

- ⭐ Star this repository
- 🐛 Report bugs and suggest features
- 💻 Contribute code and documentation
- 💚 Sponsor development (Patreon/OpenCollective coming soon)
- 📢 Share with farmers and agricultural organizations

---

## License

**AGPL-3.0 License**

This project is licensed under the GNU Affero General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

This license ensures that Farm Commons remains free and open source forever. Any modifications or network services using this code must also be open sourced.

---

## Acknowledgments

Inspired by:
- **Care Commons** - Proving that community-owned software can challenge corporate giants
- Small-scale farmers and farmworkers who feed our communities
- The regenerative agriculture movement
- Right-to-repair advocates fighting John Deere's lock-in
- Farm worker justice organizations

---

## Contact & Community

- **Issues:** [GitHub Issues](https://github.com/neighborhood-lab/farm-commons/issues)
- **Discussions:** [GitHub Discussions](https://github.com/neighborhood-lab/farm-commons/discussions)
- **Email:** farm-commons@example.com (coming soon)

---

<div align="center">

**Farm Commons**

*Built with soil under our fingernails*

🚜 **For the humans who feed us** 🌾

</div>