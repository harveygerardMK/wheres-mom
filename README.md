# Where's Mom

A family memorial map showing scatter locations and **estimated** ocean drift paths — hosted on GitHub Pages.

## Quick start

```bash
npm install
pip install -r scripts/requirements.txt
python3 scripts/generate_drift.py   # regenerate drift GeoJSON paths
npm run dev                        # local preview at http://localhost:5173/wheres-mom/
npm run build                      # production build to dist/
```

## Adding a new drop

1. Add an optional photo to `public/photos/` (strip EXIF metadata first).
2. Add an entry to `public/data/drops.json` with `id`, `label`, `region`, `lat`, `lng`, `date`, and `driftMeta`.
3. Regenerate paths:

   ```bash
   npm run drift
   ```

4. Commit and push to `main`. GitHub Actions deploys automatically.

## GitHub Pages setup

1. Create a GitHub repo named `wheres-mom` (or update `base` in `vite.config.js` to match your repo name).
2. Push this project to `main`.
3. In repo **Settings → Pages**, set source to **GitHub Actions**.
4. Site URL: `https://<username>.github.io/wheres-mom/`

## Privacy

Paths are estimates for remembrance, not exact locations. No analytics are included by default.
