# Family content checklist

Use this list when you are ready to replace placeholders with real memories.

## Blue Lagoon, Croatia (seed drop)

- [ ] Confirm exact scatter **date** (currently `2025-09-12` placeholder)
- [ ] Confirm map pin — Krknjaši / Drvenik Veli near Trogir (~43.454°N, 16.140°E)
- [ ] Add 1–3 sentence **memory** in `public/data/drops.json`
- [ ] Optional photo → `public/photos/blue-lagoon.jpg` (strip EXIF first), set `"photo": "photos/blue-lagoon.jpg"`

## Other drops (replace placeholders)

Edit `placeholder-drop-2` and `placeholder-drop-3` in `public/data/drops.json`:

- [ ] Place name and region
- [ ] Latitude / longitude (Google Maps pin is fine)
- [ ] Scatter date (`YYYY-MM-DD`)
- [ ] Personal note
- [ ] Optional photo
- [ ] Drift direction/speed if you know the regional current (or leave defaults)

After editing:

```bash
npm run drift
git add public/data/
git commit -m "Update drop memories"
git push
```

## About Mom page

Edit `about.html` or wire dynamic content later:

- [ ] Display name (`Mom` vs first name) in `public/data/drops.json` → `person.displayName`
- [ ] Birth and passing dates → `person.born`, `person.died`
- [ ] 150–300 word biography
- [ ] Portrait photo

## Share with family

Once deployed: `https://<your-github-username>.github.io/wheres-mom/`

Suggested message:

> We've started a map following Mom's journey on the water. No account needed — open when you'd like to visit.
