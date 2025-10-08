# V0 Float Blocks It

[![GitHub](https://img.shields.io/badge/GitHub-v0--float--blocks--it-black?style=for-the-badge&logo=github)](https://github.com/e-schultz/v0-float-blocks-it)

**Block-based editor application for FLOAT consciousness technology ecosystem**

## Overview

V0 Float Blocks It is a full-stack block-based editor and content management application built with v0.app. Part of the FLOAT Block ecosystem, it provides infrastructure for structured content creation and knowledge organization using block-based editing patterns.

## Technical Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **UI Components**: Radix UI primitives with shadcn/ui patterns
- **Styling**: Tailwind CSS with custom themes
- **State Management**: TanStack Query for server state
- **Animation**: Framer Motion
- **ID Generation**: nanoid for unique block identifiers

### Backend
- **Server**: Express.js with TypeScript (ES modules)
- **Database**: PostgreSQL (Neon serverless)
- **ORM**: Drizzle with type-safe queries
- **Session Management**: express-session with PostgreSQL storage
- **Authentication**: Passport.js with local strategy
- **WebSocket**: ws for real-time collaborative features

### Build & Development
- **Build Tool**: Vite with React plugin
- **TypeScript**: Strict mode enabled
- **Server Build**: esbuild for fast server bundling
- **Database Migrations**: drizzle-kit
- **Development Plugins**: Replit integration with error modal and dev banner

## Features

- Block-based content editor
- Structured content organization
- Full-stack authentication system
- Real-time collaboration via WebSocket
- PostgreSQL-backed persistence
- Session management with secure storage
- FLOAT Block ecosystem integration

## Development

### Prerequisites
- Node.js & npm
- PostgreSQL database (or Neon serverless account)

### Getting Started

```bash
# Install dependencies
npm install

# Push database schema
npm run db:push

# Start development server
npm run dev
```

Development server runs on http://localhost:5000 (or Replit-assigned port)

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build client and server for production
- `npm run start` - Run production server
- `npm run check` - TypeScript type checking
- `npm run db:push` - Push database schema changes

## Project Structure

```
v0-float-blocks-it/
├── client/              # React frontend application
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── pages/       # Page components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── lib/         # Utilities and libraries
│   │   ├── App.tsx      # Main application component
│   │   └── main.tsx     # Application entry point
├── server/              # Express backend application
├── attached_assets/     # Static assets
├── drizzle.config.ts    # Drizzle ORM configuration
├── components.json      # shadcn/ui configuration
└── package.json         # Project dependencies
```

## Database Architecture

- **ORM**: Drizzle with PostgreSQL
- **Migrations**: Managed via drizzle-kit
- **Connection**: @neondatabase/serverless for serverless PostgreSQL
- **Sessions**: connect-pg-simple for PostgreSQL-backed sessions
- **Block Storage**: PostgreSQL-backed content blocks with relational structure

## Integration

Part of the **ritual-forest** consciousness technology laboratory:
- **Repository**: [github.com/e-schultz/v0-float-blocks-it](https://github.com/e-schultz/v0-float-blocks-it)
- **Ecosystem**: FLOAT Block & consciousness technology infrastructure
- **Purpose**: Block-based editing and content organization for knowledge management
- **Related**: See also old-oak-tree (Rust TUI block editor)

## Environment Variables

Required environment variables (configure in `.env` or Replit Secrets):

```bash
DATABASE_URL=          # PostgreSQL connection string
SESSION_SECRET=        # Express session secret
NODE_ENV=             # development | production
```

## Deployment

Application can be deployed to:
- Replit (configured with .replit file)
- Vercel (with Express adapter)
- Any Node.js hosting platform

Production build:
```bash
npm run build
npm run start
```

## Block-Based Editing

This application implements block-based content editing patterns:
- Each content unit is a discrete block with unique ID (nanoid)
- Blocks can be reordered, nested, and linked
- Real-time collaboration on block content
- Structured data storage for content organization

## License

Built as part of FLOAT consciousness technology ecosystem.

---

*The infrastructure holds. The blocks stack. ⚡*
