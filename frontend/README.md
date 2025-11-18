# Lottery Sandbox - Frontend

Multi-Level Agent Lottery Sandbox System - React Frontend Application

## Tech Stack

- **Framework**: React Router 7 (CSR mode)
- **Build Tool**: Vite 6
- **UI Library**: React 19
- **Styling**: Tailwind CSS v4 (mobile-first)
- **UI Components**: shadcn/ui (Radix UI)
- **State Management**: Zustand v5
- **Server State**: TanStack Query v5
- **Forms**: React Hook Form + Zod
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Testing**: Vitest + Testing Library

## Performance Targets

- **Page Load**: < 2s
- **Time to Interactive**: < 3s
- **Initial JS Bundle**: < 200KB (gzipped)
- **Mobile-First**: 375px minimum width, 100% mobile users

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 9.0.0

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Update .env with your API URL
```

### Development

```bash
# Start development server (http://localhost:3000)
pnpm dev

# Type checking
pnpm typecheck

# Linting
pnpm lint
pnpm lint:fix

# Testing
pnpm test
pnpm test:ui
pnpm test:coverage
```

### Build

```bash
# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Project Structure

```
frontend/
├── app/                      # Application source code
│   ├── routes/              # React Router routes
│   │   └── _index.tsx       # Home page
│   ├── styles/              # Global styles
│   │   └── globals.css      # Tailwind CSS + custom styles
│   ├── test/                # Test configuration
│   │   └── setup.ts         # Vitest setup
│   └── root.tsx             # Root layout
├── .env                      # Environment variables (gitignored)
├── .env.example             # Environment template
├── .eslintrc.js             # ESLint configuration
├── .gitignore               # Git ignore rules
├── package.json             # Dependencies & scripts
├── react-router.config.ts   # React Router configuration (SSR disabled)
├── tailwind.config.ts       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration (strict mode)
└── vite.config.ts           # Vite build configuration
```

## Configuration

### TypeScript

- Strict mode enabled
- Path aliases configured (`~/*` -> `./app/*`)
- ESM modules with bundler resolution

### Vite

- Manual code splitting for optimal bundle sizes
- Vendor chunks:
  - `react-vendor`: React, React DOM, React Router
  - `ui-vendor`: Radix UI components
  - `state-vendor`: TanStack Query, Zustand
  - `form-vendor`: React Hook Form, Zod
  - `utils-vendor`: Axios, clsx, tailwind-merge, lucide-react

### Tailwind CSS

- Mobile-first breakpoints (375px minimum)
- Custom design tokens (colors, spacing, animations)
- Safe area insets for mobile notches
- Touch-friendly minimum sizes (44px)
- Performance-optimized animations

### React Router 7

- Client-Side Rendering (CSR) mode for Azure Static Web Apps
- File-based routing
- Type-safe route definitions
- Built-in error boundaries

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:8000` |
| `VITE_APP_NAME` | Application name | `"Lottery Sandbox"` |
| `VITE_APP_VERSION` | Application version | `1.0.0` |
| `VITE_ENV` | Environment | `development` |

## Mobile Optimization

- Minimum width: 375px (iPhone SE)
- Touch targets: 44px minimum
- Safe area insets for notches
- GPU-accelerated animations
- Optimized font rendering
- Touch scrolling improvements
- Tap highlight disabled
- Text size adjustment prevented

## Testing

```bash
# Run tests in watch mode
pnpm test

# Run tests with UI
pnpm test:ui

# Generate coverage report
pnpm test:coverage
```

## Deployment

### Azure Static Web Apps

1. Build the application:
   ```bash
   pnpm build
   ```

2. Deploy the `build/client` directory to Azure Static Web Apps

3. Configure environment variables in Azure Portal

4. Set up API integration (optional)

## Performance Optimization

- Code splitting by vendor and route
- Tree shaking for unused code
- Minification with Terser
- Console statements removed in production
- Lazy loading for routes
- Image optimization
- Font preloading
- DNS prefetching

## Browser Support

- Chrome/Edge (last 2 versions)
- Firefox (last 2 versions)
- Safari/iOS Safari (last 2 versions)
- Mobile browsers (100% support)

## Contributing

1. Follow TypeScript strict mode guidelines
2. Use ESLint and fix all warnings
3. Write tests for new features
4. Follow mobile-first design principles
5. Optimize for performance

## License

Proprietary - All rights reserved
