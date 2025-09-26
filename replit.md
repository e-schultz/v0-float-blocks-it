# ThinkLink - Knowledge Block Management System

## Overview

ThinkLink is a collaborative knowledge management application that allows users to create, link, and discuss content blocks in a graph-based interface. The system features real-time collaboration, visual graph representations of connected knowledge, and threaded discussions on individual blocks. It combines a React frontend with an Express backend, using PostgreSQL for persistence and WebSocket for real-time updates.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client uses React with TypeScript and modern tooling:
- **Component Library**: Radix UI primitives with shadcn/ui styling system for consistent, accessible components
- **Styling**: Tailwind CSS with CSS custom properties for theming and dark mode support
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Real-time Updates**: WebSocket client for live collaboration features
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
The server follows a REST API pattern with WebSocket enhancement:
- **Framework**: Express.js with TypeScript for type safety
- **Database**: PostgreSQL with Drizzle ORM for schema management and type-safe queries
- **Real-time Communication**: WebSocket server for broadcasting live updates to all connected clients
- **Storage Layer**: Abstracted storage interface allowing for different implementations (current: in-memory for development)
- **API Design**: RESTful endpoints for CRUD operations on blocks, links, and comments

### Data Model
The system centers around three core entities:
- **Blocks**: Content units with title, content, position, tags, and metadata
- **Links**: Directed connections between blocks forming a knowledge graph
- **Comments**: Threaded discussions attached to blocks with nested reply support

### Database Schema
PostgreSQL tables with proper foreign key relationships:
- Blocks table stores content with JSON position data for graph layout
- Links table creates directed edges between blocks with cascade deletion
- Comments table supports threaded discussions with self-referencing parent relationships
- All tables include audit fields (created_at, updated_at) and author information

### Authentication & Authorization
The system includes author tracking fields (authorId, authorName) suggesting user-based permissions, though the authentication implementation appears to be planned rather than complete.

### Build & Deployment
- **Development**: Concurrent client and server with hot reloading via Vite
- **Production**: Static client build with bundled server using esbuild
- **Database**: Drizzle migrations for schema versioning

### Real-time Features
WebSocket integration provides live updates for:
- New block creation notifications
- Block content updates
- Link establishment between blocks  
- Comment additions and replies
- Graph visualization updates