# Lottery Practice Demo

A mobile-first lottery practice management system demo application.

## Features

- 11 pages covering betting, query, results, winnings, accounts, guide, and profile
- Mobile-optimized UI with Traditional Chinese (繁體中文)
- Static demo with mock data
- Responsive design with animations

## Tech Stack

- **Framework**: Astro 4.16.0 (Static Site Generation)
- **CSS**: Tailwind CSS 3.4.1
- **JavaScript**: Alpine.js 3.14.1
- **Deployment**: Cloudflare Pages

## Development

```bash
npm install
npm run dev
```

Visit http://localhost:4321

## Build

```bash
npm run build
```

Output will be in `dist/` directory.

## Deployment to Cloudflare Pages

### Option 1: Cloudflare Dashboard (Recommended)

1. Push code to GitHub/GitLab
2. Go to Cloudflare Dashboard > Pages
3. Click "Create a project" > "Connect to Git"
4. Select your repository
5. Configure build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Node version**: 18
6. Click "Save and Deploy"

### Option 2: Wrangler CLI

```bash
npm install -g wrangler
wrangler pages deploy dist
```

## Pages Structure

- `/` - Home (menu dashboard)
- `/betting` - Full betting grid (簡單輸入)
- `/simple` - Text input betting (自由輸入/幸運)
- `/query` - Search and query bets
- `/cancel` - Cancel pending bets
- `/total` - Statistics and totals
- `/winnings` - Winning bets (中獎)
- `/results` - Calendar results (成績)
- `/accounts` - Transaction history (賬目)
- `/guide` - Instructions (指南)
- `/profile` - User settings (用戶)

## Notes

- All data is static/mock for demonstration purposes
- Optimized for mobile devices (100% mobile users)
- Light theme with blue gradient primary colors
- Animations tested to prevent flash on load
