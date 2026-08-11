# Exoplanet Pioneer - Modern Architecture

This document describes the new modern architecture implemented for Exoplanet Pioneer, following the comprehensive improvement roadmap.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm 9+
- Wrangler CLI (installed and authenticated)

### Setup

1. **Run the setup script:**
   ```bash
   setup.bat
   ```

2. **Or manually:**
   ```bash
   # Install dependencies
   npm install

   # Create D1 database
   wrangler d1 create exoplanet-pioneer-db --config=wrangler-exoplanet.toml

   # Create KV namespace
   wrangler kv:namespace create CACHE --config=wrangler-exoplanet.toml

   # Apply database schema
   wrangler d1 execute exoplanet-pioneer-db --file=schema.sql --config=wrangler-exoplanet.toml

   # Build project
   npm run build:vite
   ```

3. **Update `wrangler-exoplanet.toml` with your IDs:**
   ```toml
   [[d1_databases]]
   binding = "DB"
   database_name = "exoplanet-pioneer-db"
   database_id = "YOUR_DATABASE_ID"  # Update this

   [[kv_namespaces]]
   binding = "CACHE"
   id = "YOUR_KV_NAMESPACE_ID"  # Update this
   ```

### Development

```bash
# Start Vite dev server
npm run dev

# Start local Cloudflare Pages with Functions
npm run local:exoplanet
```

### Deployment

```bash
# Deploy to production
npm run deploy:exoplanet

# Deploy to preview branch
npm run deploy:exoplanet:preview
```

## 📁 Project Structure

```
exoplanet-pioneer/
├── functions/                    # Cloudflare Functions
│   ├── api/                     # API endpoints
│   │   ├── saves.ts            # Save/load game data
│   │   ├── achievements.ts     # Achievement tracking
│   │   ├── trades.ts           # Trade operations
│   │   ├── leaderboard.ts      # Leaderboard queries
│   │   └── multiplayer.ts      # Real-time multiplayer
│   ├── middleware/             # Auth, rate limiting, etc.
│   ├── utils/                  # Helper functions
│   ├── types/                  # TypeScript definitions
│   └── game-room-worker.ts     # Durable Objects for multiplayer
├── src/                         # Frontend source
│   ├── core/                   # Core game architecture
│   │   ├── Game.ts            # Main game class
│   │   ├── StateManager.ts    # State management
│   │   └── DIContainer.ts     # Dependency injection
│   ├── systems/                # Game systems
│   ├── ui/                     # UI components
│   └── utils/                  # Utility functions
├── dist/                        # Build output
├── schema.sql                   # D1 database schema
├── vite.config.js              # Vite configuration
├── wrangler-exoplanet.toml    # Cloudflare Pages config
├── tsconfig.json               # TypeScript configuration
└── package.json                # Dependencies and scripts
```

## 🏗️ Architecture Overview

### Frontend Architecture

#### State Management
- **StateManager**: Centralized state management with subscriptions
- **DIContainer**: Dependency injection for service management
- **Game**: Main game orchestrator

#### Build System
- **Vite**: Fast build tool with HMR
- **Code Splitting**: Automatic chunk splitting for better caching
- **Legacy Support**: Polyfills for older browsers
- **PWA**: Service worker for offline support

### Backend Architecture (Cloudflare Pages + Functions)

#### API Endpoints
- `GET/POST /api/saves` - Save/load game data
- `GET/POST /api/achievements` - Achievement tracking
- `GET/POST /api/trades` - Trade operations
- `GET /api/leaderboard` - Leaderboard with caching
- `POST /api/multiplayer` - Real-time multiplayer

#### Database (D1)
- **Players**: User accounts and stats
- **Saves**: Game save data
- **Achievements**: Unlocked achievements
- **Trades**: Trade history
- **Leaderboard**: Score tracking
- **Game Sessions**: Analytics

#### Storage (KV)
- **Caching**: Leaderboard and frequently accessed data
- **Rate Limiting**: API rate limiting
- **Session Data**: Temporary session storage

#### Real-time (Durable Objects)
- **Game Rooms**: Multiplayer room management
- **State Synchronization**: Real-time game state
- **Player Management**: Join/leave/broadcast

## 🔧 Configuration Files

### vite.config.js
- Build configuration
- Code splitting rules
- PWA setup
- Compression plugins

### wrangler-exoplanet.toml
- Cloudflare Pages configuration
- D1 database bindings
- KV namespace bindings
- Durable Objects bindings

### tsconfig.json
- TypeScript compiler options
- Strict mode enabled
- Path resolution

## 📊 Database Schema

See `schema.sql` for complete database structure including:
- Tables with proper indexes
- Foreign key constraints
- Automatic timestamp triggers
- Performance optimizations

## 🎯 Key Features

### Performance
- **Code Splitting**: Separate chunks for Three.js, game systems, UI
- **Tree Shaking**: Remove unused code
- **Minification**: Terser with console.log removal
- **Compression**: Gzip and Brotli
- **Caching**: KV cache for leaderboards

### Developer Experience
- **Hot Module Replacement**: Instant updates during development
- **TypeScript**: Type safety across the codebase
- **ESLint**: Code quality enforcement
- **Prettier**: Code formatting
- **Vitest**: Unit testing framework

### Reliability
- **Error Boundaries**: Prevent game crashes
- **Retry Logic**: Automatic retry for failed requests
- **Graceful Degradation**: Offline support with PWA
- **Backup System**: Original configurations backed up

## 🔒 Security

- **CORS**: Proper CORS headers on all endpoints
- **Rate Limiting**: API rate limiting (to be implemented)
- **Input Validation**: Validate all user inputs
- **SQL Injection Prevention**: Parameterized queries

## 📈 Monitoring & Analytics

- **Game Sessions**: Track session duration and events
- **Performance Metrics**: FPS, load times, memory usage
- **Error Tracking**: Centralized error logging

## 🚀 Deployment

### Cloudflare Pages
- **Automatic HTTPS**: SSL certificates included
- **Global CDN**: Edge deployment worldwide
- **Instant Rollbacks**: Quick rollback capability
- **Preview Deployments**: Test changes before production

### Free Tier Limits
- **Functions**: 100,000 requests/day
- **D1 Database**: 5GB storage, 5M reads/day
- **KV Storage**: 1GB, 100K reads/day
- **Bandwidth**: Unlimited

## 📝 Scripts

```bash
npm run dev              # Start Vite dev server
npm run build:vite       # Build for production
npm run test:unit        # Run unit tests
npm run type-check       # TypeScript type checking
npm run deploy:exoplanet # Deploy to Cloudflare Pages
npm run local:exoplanet  # Local development with Functions
```

## 🔄 Migration from Old Architecture

### What Changed
- **Build System**: Webpack → Vite
- **State Management**: Ad-hoc → Centralized StateManager
- **Backend**: Supabase → Cloudflare D1 + Functions
- **Deployment**: Manual → Automated with Wrangler

### What Stayed the Same
- **Existing Wrangler configs** (backed up as .backup)
- **Existing workers** (worker.js, worker-api.js)
- **Existing cloud functions** (in cloud-functions/)

### Backups Created
- `wrangler.toml.backup`
- `wrangler-api.toml.backup`
- `worker.js.backup`
- `worker-api.js.backup`

## 🆘 Troubleshooting

### Common Issues

**Database not found:**
```bash
# Create database and update wrangler-exoplanet.toml
wrangler d1 create exoplanet-pioneer-db --config=wrangler-exoplanet.toml
```

**KV namespace not found:**
```bash
# Create KV namespace and update wrangler-exoplanet.toml
wrangler kv:namespace create CACHE --config=wrangler-exoplanet.toml
```

**Build fails:**
```bash
# Clear cache and reinstall
rm -rf node_modules dist
npm install
npm run build:vite
```

**Functions not working locally:**
```bash
# Ensure Wrangler is authenticated
wrangler whoami
```

## 📚 Additional Resources

- [Vite Documentation](https://vitejs.dev/)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 🎉 Summary

This new architecture provides:
- ✅ Modern build system with Vite
- ✅ Centralized state management
- ✅ Dependency injection
- ✅ Cloudflare Pages + Functions backend
- ✅ D1 database for data persistence
- ✅ Real-time multiplayer with Durable Objects
- ✅ KV caching for performance
- ✅ PWA support for offline play
- ✅ TypeScript for type safety
- ✅ Comprehensive testing setup
- ✅ Zero-cost deployment (free tiers)

All existing configurations and workers have been preserved with `.backup` extensions to prevent any regressions.
