<div align="center">

# App Store Screenshots

**Create pixel-perfect App Store & Play Store screenshots in seconds — no Photoshop needed.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-screens.dnyantra.com-6366f1?style=for-the-badge&logo=googlechrome&logoColor=white)](https://screens.dnyantra.com/)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/dnyantra5)
[![License: MIT](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)](LICENSE)

</div>

---

## What is this?

A free, open-source web tool that wraps your app screenshots in a beautiful, store-ready frame — gradient background, rounded corners, drop shadow — and exports them at the exact pixel dimensions required by the App Store, Google Play, and more.

Everything runs **100% in your browser**. No uploads, no accounts, no data ever leaves your device.

---

## Features

- **Multi-platform sizes** — iOS, iPadOS, macOS, Android (Phone, Tablet, TV, Wear OS), and Windows store presets built-in
- **Custom sizes** — define and save your own width × height presets; they persist across sessions via `localStorage`
- **25 background presets** — curated gradients and solid colors, plus a full custom color picker
- **Live preview** — see exactly what the exported PNG will look like before you download
- **Padding control** — None / Small / Medium / Large / Extra Large
- **Drop shadow (elevation)** — add depth to make screenshots pop
- **Rounded corners** — adjustable border radius for any device frame style
- **Batch export** — upload multiple images and download them all as a single ZIP file
- **Custom filename** — name your exports whatever you like
- **Zero backend** — pure client-side Canvas API rendering; nothing is sent to a server

---

## Supported Screenshot Sizes

| Platform | Sizes |
|----------|-------|
| **iOS** | iPhone 6.9" · 6.7" · 6.5" · 5.5" · 4.7" |
| **iPadOS** | iPad Pro 12.9" · 11" · iPad 10th gen · iPad mini |
| **macOS** | 1280×800 · 1440×900 · 2560×1600 · 2880×1800 |
| **Android** | Phone · 7" Tablet · 10" Tablet · TV · Wear OS |
| **Windows** | Desktop · Surface Hub · Xbox · Mobile |
| **Custom** | Any width × height — saved locally |

---

## Tech Stack

| | |
|---|---|
| **Framework** | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| **Build tool** | [Vite 6](https://vitejs.dev/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **ZIP export** | [JSZip](https://stuk.github.io/jszip/) + [FileSaver.js](https://github.com/eligrey/FileSaver.js) |
| **Rendering** | Native HTML5 Canvas API |

---

## Running Locally

**Prerequisites:** Node.js 18+

```bash
# 1. Clone the repository
git clone https://github.com/your-username/app-store-screenshots.git
cd app-store-screenshots

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with HMR on port 3000 |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | TypeScript type-check |

---

## Deploying

The `dist/` folder is a fully static build — deploy it anywhere that serves static files.

A `.htaccess` is included in `public/` for Apache-based hosts (Hostinger, cPanel, etc.) and handles:

- HTTP → HTTPS redirect
- SPA client-side routing fallback
- Gzip compression
- Long-term caching for hashed assets
- Security headers

```bash
npm run build
# Upload the contents of dist/ to your public_html/ folder
```

Works on Hostinger, Netlify, Vercel, GitHub Pages, Cloudflare Pages, or any static CDN.

---

## Contributing

Contributions are welcome! Here are some ideas:

- Additional platform presets (Steam, Meta Quest, etc.)
- Text / caption overlay on screenshots
- Drag-and-drop image reordering
- Dark mode for the UI

```bash
# Fork the repo, create a branch, make your changes, open a PR
git checkout -b feature/my-feature
```

Please keep PRs focused and avoid adding server-side dependencies — the no-backend design is intentional.

---

## Support the Project

If this tool saved you time (or a Photoshop subscription), consider buying me a coffee — it helps keep the project free and maintained.

<a href="https://buymeacoffee.com/dnyantra5" target="_blank">
  <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="50" />
</a>

---

## License

[MIT](LICENSE) — free to use, modify, and distribute.
