# AudioStudio Pro

A Vercel-ready Next.js browser audio editor focused on exact timeline-region effects and stereo-safe MP3 export.

## Included
- Waveform timeline with drag selection
- Non-destructive cut ranges
- Per-region Gain, Bass, Delay/Echo, Feedback, Wet Mix and Pan
- Multiple independent effect regions
- Preview render
- Stereo MP3 export at 128/192/256/320 kbps
- Peak protection to reduce clipping from stacked effects
- Mono-to-stereo duplication during MP3 encoding to prevent one-ear exports
- SEO metadata
- Home, Editor, Features, Blog + six guides, Help, About, Contact, Account, Privacy, Terms
- Responsive dark glass-style UI

## Deploy to GitHub + Vercel
1. Unzip the project.
2. Upload the project contents to the root of your GitHub repository.
3. Commit changes.
4. In Vercel, import/redeploy that repository. Framework should be detected as Next.js.
5. Build command: `npm run build`
6. Output: use Vercel's normal Next.js defaults. Do not set a custom static output directory.

## Local run
```bash
npm install
npm run dev
```

## Important production edits
- Replace `https://example.com` in `app/layout.js` with your real domain.
- Replace `support@example.com` on Contact, Privacy and Terms pages.
- Have legal counsel review legal copy for your company and jurisdiction.
- If you add login, cloud projects, analytics, billing or remote uploads, update Privacy/Terms accordingly.

## Audio design notes
The earlier “too loud” symptom is usually clipping caused by stacked gain/EQ/feedback. This build scans the final render and scales peaks below 0.98 only when needed.

The “one ear” symptom usually comes from mono/stereo routing or encoding one channel as stereo. This build renders a 2-channel output and duplicates mono source audio into L/R during MP3 encoding.

## Limits of this browser build
- It is a single-track editor, not a full multitrack DAW.
- Very large files can exceed browser/device memory.
- Browser codec support varies for input formats.
- Effects are rendered client-side, so slower devices may take longer.
- Reverb, pitch shift, time stretch, noise removal, vocal isolation, undo history, project persistence, multi-track mixing and user accounts are strong Phase 2 additions.

## Recommended Phase 2
1. Undo/redo edit history
2. Zoomable timeline and playhead scrubber
3. Split-at-playhead command
4. Fade in/out and crossfades
5. Compressor, limiter, parametric EQ, reverb
6. Pitch and tempo controls
7. Noise reduction and vocal isolation via server/worker pipeline
8. Multi-track lanes
9. Saved projects and accounts
10. Cloud storage, share links, waveform thumbnails
11. PWA/offline support
12. Structured data, sitemap automation and Search Console integration
