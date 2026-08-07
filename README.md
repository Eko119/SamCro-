# Samantha's Crochet Boutique

**Live: https://samanthas-crochet-boutique.pages.dev**

A single-page storefront for a handmade crochet studio, built on the
**Modernist** design system: Swiss-modernist structure — strict grid, hairline
rules, tight display tracking, one accent used sparingly — warmed for a
handmade-goods shop with paper whites, clay and sage.

## Files

| Path | What it is |
| --- | --- |
| `Samanthas Crochet Boutique.dc.html` | The page. Hero, shop grid, craft story, stats, lookbook, reviews, FAQ, signup, footer. |
| `_ds/modernist-…/styles.css` | Design system stylesheet — tokens, reset, type scale, layout primitives, components, light/dark themes. |
| `_ds/modernist-…/_ds_bundle.js` | Design system runtime — `DS.icon` / `DS.token` / `DS.ready`, and the `<ds-icon>`, `<ds-marquee>`, `<ds-counter>` elements. |
| `image-slot.js` | `<image-slot>` — holds an image's exact shape before there's an image, drawn as a crochet-stitch swatch. Set `src` and it swaps to a real `<img>`. |
| `support.js` | Page runtime — theme toggle, nav drawer, scroll reveal, category filters, basket count, FAQ, signup validation. |

## Running it

No build step, no dependencies. Open the HTML file directly, or serve the
directory:

```sh
npm run dev
```

## Deploying to Cloudflare Pages

`build.mjs` assembles `dist/` — it copies the page to `index.html` (the design
canvas filename is not a URL anyone should type) and places the assets beside it
so every relative path in the page keeps working.

```sh
npm run build     # -> dist/
npm run preview   # build, then serve dist/ locally
```

Deploying needs a Cloudflare account. Pick either route.

**Route A — from a machine with wrangler**

```sh
export CLOUDFLARE_API_TOKEN=…      # scope: Account → Cloudflare Pages → Edit
export CLOUDFLARE_ACCOUNT_ID=…     # dash.cloudflare.com → right sidebar
npm run deploy
```

The first run creates the `samanthas-crochet-boutique` Pages project and prints
the live `*.pages.dev` URL.

**Route B — from CI, no token on your machine**

`.github/workflows/deploy.yml` deploys on every push to the default branch. Add
two repository secrets under **Settings → Secrets and variables → Actions**:

| Secret | Where to get it |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | My Profile → API Tokens → Create Token → *Edit Cloudflare Workers* template, or a custom token with **Account → Cloudflare Pages → Edit** |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare dashboard, right-hand sidebar |

Then re-run the workflow from the Actions tab. The deployment URL appears in the
job summary.

## How it's put together

- **Tokens over values.** Colour, type, space and motion all come from custom
  properties on `:root`. Dark mode redefines only the semantic tokens
  (`--bg`, `--fg`, `--accent`, …), never the palette.
- **Three theme states.** System preference by default; `data-theme="dark"` or
  `data-theme="light"` on `<html>` overrides it, and the choice is remembered.
- **Progressive.** The page reads and navigates with JavaScript off — scripts
  add filtering, the drawer, the basket count and entrance motion on top.
- **Placeholders that don't shift layout.** Every `<image-slot>` reserves the
  ratio its photograph will occupy, so dropping real art in changes nothing
  about the layout.

## Accessibility

Skip link, landmark regions, visible focus rings, `aria-pressed` filters, live
regions for the basket and filter count, `inert` page regions behind the open
drawer, and a full `prefers-reduced-motion` path that disables the marquee,
count-ups and reveals.

## Note on provenance

These files were authored in this repository. The Claude Design project this
work was specified against
(`claude.ai/design/p/b0bbee2d-17d1-40f7-9536-b5dff7b8d9dd`) was not reachable
from the build environment, so the Modernist system here is an implementation of
the brief rather than a byte-for-byte import. If you sync the upstream design
project later, expect `_ds/modernist-…/` to be replaced wholesale — the page
only depends on its public surface (token names, component classes and the three
custom elements).
