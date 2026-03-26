# VedaSuite Website

Pre-launch marketing website for `https://vedasuite.in`, built with Next.js, React, TypeScript, and Tailwind CSS.

## Local development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a local environment file if needed:

   ```bash
   cp .env.example .env.local
   ```

3. Run the development server:

   ```bash
   npm run dev
   ```

4. Open `http://localhost:3000`

## Production environment

Set this environment variable in Vercel Production:

```bash
NEXT_PUBLIC_SITE_URL=https://vedasuite.in
```

## Deploy to Vercel

1. Import the repository into Vercel.
2. Set the project Root Directory to `vedasuite website`.
3. Add the production environment variable from above.
4. Add `vedasuite.in` and `www.vedasuite.in` in Project Settings -> Domains.
5. Update GoDaddy DNS to match the values shown in Vercel.

## Key files

- `app/layout.tsx`: metadata, canonical URL, Open Graph, icons
- `app/sitemap.ts`: sitemap generation
- `app/robots.ts`: robots configuration
- `app/manifest.ts`: web app manifest
- `content/site-content.ts`: branding, copy, and A/B variant content
- `components/`: page sections and interactive UI
