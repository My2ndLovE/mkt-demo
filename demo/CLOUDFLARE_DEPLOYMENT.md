# Cloudflare Pages Deployment Guide

## Pre-Deployment Checklist

✅ **Build Test**
- Production build successful: `npm run build`
- All 11 pages generated
- Assets bundled: hoisted.HVbqf0Kc.js (44.40 kB, gzip: 16.08 kB)

✅ **Code Review**
- All animations working without flash
- Alpine.js scope issues resolved
- Keypad functionality working on both /betting and /simple
- 下一步 button behavior correct:
  - /simple: adds newline
  - /betting: cycles through columns (Number → B → S → A1 → next row)

✅ **Configuration Files**
- `astro.config.mjs`: output set to 'static'
- `wrangler.toml`: Cloudflare configuration ready
- `.node-version`: Node 18 specified
- `package.json`: build scripts configured

## Deployment Steps

### Method 1: Cloudflare Dashboard (Recommended)

1. **Push to Git Repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Lottery practice demo"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Connect to Cloudflare Pages**
   - Go to https://dash.cloudflare.com
   - Navigate to **Workers & Pages** > **Pages**
   - Click **Create a project** > **Connect to Git**
   - Select your repository

3. **Configure Build Settings**
   ```
   Framework preset: Astro
   Build command: npm run build
   Build output directory: dist
   Node version: 18
   ```

4. **Deploy**
   - Click **Save and Deploy**
   - Wait for build to complete
   - Your site will be live at: `https://<project-name>.pages.dev`

### Method 2: Wrangler CLI

1. **Install Wrangler**
   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare**
   ```bash
   wrangler login
   ```

3. **Deploy**
   ```bash
   npm run build
   wrangler pages deploy dist --project-name=lottery-demo
   ```

## Post-Deployment

### Verify All Pages

- ✅ Home: https://your-site.pages.dev/
- ✅ Betting: https://your-site.pages.dev/betting
- ✅ Simple: https://your-site.pages.dev/simple
- ✅ Query: https://your-site.pages.dev/query
- ✅ Cancel: https://your-site.pages.dev/cancel
- ✅ Total: https://your-site.pages.dev/total
- ✅ Winnings: https://your-site.pages.dev/winnings
- ✅ Results: https://your-site.pages.dev/results
- ✅ Accounts: https://your-site.pages.dev/accounts
- ✅ Guide: https://your-site.pages.dev/guide
- ✅ Profile: https://your-site.pages.dev/profile

### Test Functionality

- [ ] All menu links working
- [ ] Betting grid: click cells, type numbers, 下一步 cycles columns
- [ ] Simple page: textarea input, keypad appears, 下一步 adds newline
- [ ] Clear/Paste/Submit buttons working
- [ ] Animations smooth without flash
- [ ] Mobile responsiveness
- [ ] Traditional Chinese font loading

## Custom Domain (Optional)

1. Go to your Pages project > **Custom domains**
2. Click **Set up a custom domain**
3. Enter your domain name
4. Follow DNS configuration instructions

## Environment Details

- **Node Version**: 18
- **Astro Version**: 4.16.0
- **Output**: Static HTML
- **Total Pages**: 11
- **Bundle Size**: ~44 KB (gzipped: ~16 KB)
- **Target**: Mobile-first, 100% mobile users

## Troubleshooting

**Build fails**:
- Ensure Node version is 18
- Clear cache: `rm -rf node_modules package-lock.json && npm install`

**Pages not loading**:
- Check build output directory is `dist`
- Verify all routes in Pages Functions

**Animations not working**:
- Check browser console for errors
- Verify Alpine.js loaded correctly

## Support

For issues with Cloudflare Pages, see: https://developers.cloudflare.com/pages/
