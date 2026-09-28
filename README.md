# Genzio AI — Production Web Application

Genzio is a premier AI chat workspace featuring multimodal vision analysis, deep reasoning controls, live web research, document processing, and integrated image generation with a dark neon aesthetic.

---

## Deploying Genzio to Vercel

1. **Push repository to GitHub**:
   ```bash
   git add .
   git commit -m "Production release"
   git push origin main
   ```

2. **Import repository into Vercel**:
   - Go to [Vercel Dashboard](https://vercel.com/new).
   - Select your Genzio repository.
   - Vercel automatically detects the Vite frontend and the serverless functions in `/api`.

3. **Configure Environment Variables in Vercel**:
   Add the following secrets under **Project Settings → Environment Variables**:
   - `OPENROUTER_API_KEY`: Your OpenRouter API Key (required for `stealth/space-bunny-alpha` and related models).
   - `OPENROUTER_IMAGE_MODEL`: (Optional) Custom image model identifier (default: `google/gemini-3.1-flash-image`).
   - `GEMINI_API_KEY`: (Optional) Google Gemini API Key for direct Gemini fallback/services.

4. **Deploy**:
   - Click **Deploy**.
   - Vercel builds the static bundle (`dist/`) and deploys the `/api` serverless functions.

5. **Run Production Smoke Tests**:
   - Open your deployed domain.
   - Test text streaming and reasoning levels (Low, Medium, High, Extra High, Max).
   - Test image generation and document/PDF uploads.

---

## Local Development & Docker

```bash
# Install dependencies
npm install

# Start development server with Vite HMR
npm run dev

# Build production bundle
npm run build

# Start production server
npm start
```

---

## Architecture & Security

- **Server-Side API Security**: All API keys and model calls reside exclusively on backend/serverless routes (`/api/*`). No secrets are ever bundled or exposed to client browsers.
- **Vercel Serverless Functions**: Native `/api/index.ts` handler managed by Vercel.
- **Ephemeral Processing**: In-memory buffer processing for uploaded files and images, ensuring 100% compatibility with serverless execution environments.
- **Client Resilience**: Global React ErrorBoundary, dynamic viewport support (`100dvh`), and streaming fallback handling.
