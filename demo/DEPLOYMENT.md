# Deployment Guide - Cloudflare Pages

## Quick Deploy

### Option 1: Direct Upload (Fastest)

1. Build the project:
```bash
npm run build
```

2. Go to [Cloudflare Pages](https://dash.cloudflare.com/)

3. Click "Create a project" → "Upload assets"

4. Upload the entire `dist/` folder

5. Your site will be live at: `https://your-project-name.pages.dev`

### Option 2: Wrangler CLI

1. Install Wrangler globally:
```bash
npm install -g wrangler
```

2. Login to Cloudflare:
```bash
wrangler login
```

3. Build and deploy:
```bash
npm run build
npx wrangler pages deploy dist --project-name=lottery-demo
```

4. Follow the prompts to create the project

### Option 3: Git Integration (Recommended for Updates)

1. Push code to GitHub/GitLab

2. Go to Cloudflare Pages → "Create a project" → "Connect to Git"

3. Select your repository

4. Configure build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `demo` (if in subdirectory)

5. Click "Save and Deploy"

6. Every push to main branch will auto-deploy!

## Custom Domain

1. In Cloudflare Pages project → "Custom domains"

2. Click "Set up a custom domain"

3. Enter your domain (e.g., `demo.yourdomain.com`)

4. Cloudflare will automatically configure DNS

## Environment Variables

This demo doesn't need environment variables, but if needed:

1. Go to Settings → Environment variables

2. Add variables for production/preview

## Performance Optimizations

The build is already optimized:
- ✅ Static HTML generation
- ✅ CSS purging (unused Tailwind classes removed)
- ✅ JavaScript minification
- ✅ Asset optimization
- ✅ Cloudflare CDN caching

## Mobile Testing

After deployment, test on real devices:

1. Open site on iPhone/Android
2. Add to Home Screen for app-like experience
3. Test all screens and animations
4. Verify touch targets and gestures

## Site URL Structure

After deployment, your site will have:

- Home: `https://your-site.pages.dev/`
- Betting: `https://your-site.pages.dev/betting/`
- Simple: `https://your-site.pages.dev/simple/`
- Query: `https://your-site.pages.dev/query/`
- Cancel: `https://your-site.pages.dev/cancel/`
- Total: `https://your-site.pages.dev/total/`
- Results: `https://your-site.pages.dev/results/`

## Analytics (Optional)

Add Cloudflare Web Analytics:

1. Go to Cloudflare dashboard → Web Analytics

2. Add your site

3. Copy the tracking code

4. Add to `src/layouts/Layout.astro` before `</head>`

## Troubleshooting

**Build fails:**
- Make sure Node.js 18+ is installed
- Delete `node_modules` and run `npm install` again

**Styles not loading:**
- Clear browser cache
- Check Cloudflare Pages build logs

**Alpine.js not working:**
- Check browser console for errors
- Make sure JavaScript is enabled

## Cost

Cloudflare Pages is FREE for:
- ✅ Unlimited sites
- ✅ Unlimited requests
- ✅ Unlimited bandwidth
- ✅ Custom domains
- ✅ SSL certificates

Perfect for demos and client presentations!
