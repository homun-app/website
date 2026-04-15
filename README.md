# Homun Website

Source for the **[homun.app](https://homun.app)** landing page — the public website for [Homun](https://github.com/homun-app/homun), a single-binary personal AI assistant in Rust.

## Stack

- **Framework**: [React 18](https://react.dev/) + [Vite 5](https://vitejs.dev/)
- **Styling**: [Tailwind CSS 3](https://tailwindcss.com/)
- **Animations**: [GSAP](https://gsap.com/) with `ScrollTrigger`
- **Icons**: [Lucide React](https://lucide.dev/)
- **Hosting**: Self-hosted via [Coolify](https://coolify.io/) (PaaS on the project's own infrastructure)

## Development

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Build for production (output: dist/)
npm run build

# Preview production build
npm run preview
```

Requires Node.js 18+ and npm.

## Deployment

The site is automatically built and deployed via **Coolify** on every push to `main`:

1. Coolify webhook fires on GitHub push
2. Clean clone of the repo
3. `npm install && npm run build`
4. Static files from `dist/` served via Traefik + Let's Encrypt
5. Live at [homun.app](https://homun.app) within ~2 minutes

## Structure

```
.
├── index.html              # Vite entry
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── public/                 # Static assets (served at root)
│   ├── homun.png
│   ├── homun.svg
│   ├── icon_braun.png
│   └── screenshots/        # Dashboard screenshots
└── src/
    ├── main.jsx            # React entry
    ├── App.jsx             # Single-file app (all sections)
    ├── index.css           # Tailwind directives + custom CSS
    └── data/
        └── roadmap.json    # Roadmap phases data
```

## Content maintenance

- **Roadmap section**: edit `src/data/roadmap.json`. Four phase states: `completed`, `progress`, `planned`, with `quarter` and `desc`.
- **Download section**: edit the `DownloadSection` component in `src/App.jsx`. Install commands pinned to the current stable version — bump manually when a new Homun release ships.
- **Screenshots**: drop new images into `public/screenshots/` and reference them from the `ScreenshotsSection` component.

## License

The website source code in this repository is released under **[MIT](./LICENSE)**. The Homun binary that this site promotes is under [**PolyForm Noncommercial 1.0.0**](https://github.com/homun-app/homun/blob/main/LICENSE) — see [homun-app/homun](https://github.com/homun-app/homun) for details.

## Related repositories

- **[homun-app/homun](https://github.com/homun-app/homun)** — public landing for issues, releases, docs
- **[homun-app/homebrew-tap](https://github.com/homun-app/homebrew-tap)** — `brew install homun-app/tap/homun`
- **[homun-app/wa-rs](https://github.com/homun-app/wa-rs)** — WhatsApp client fork used by Homun

## Issues

Report bugs and request features at [homun-app/homun/issues](https://github.com/homun-app/homun/issues). This repo (`website`) is for source-code issues of the site itself (broken links, layout bugs, typos).
