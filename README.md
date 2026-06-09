# kodara-d4a-lander

Marketing lander for Kodara "Done-For-You AI", served via GitHub Pages, with a build
step that produces ClickFunnels inline-embed variants.

## Files

| File | Role |
|---|---|
| `tokens.css` | **Design tokens — single source of truth.** Edit colors/type/spacing/radii here. |
| `index.html` | The lander (source). Contains an inlined copy of the tokens between `tokens:auto` markers — never edit that block by hand. |
| `front-door-app-embed.html` | Auto-playing product demo, loaded by `index.html` in an iframe. Same inlined tokens block. |
| `styleguide.html` | Internal reference: tokens, type scale, button/card/microlabel recipes. |
| `build-cf.mjs` | Build script (see below). |
| `cf-d4a-html.html` / `cf-d4a-js.html` / `cf-d4a-combined.html` | **Generated** ClickFunnels embeds — never edit by hand. |

## Workflow

1. Edit `index.html`, `front-door-app-embed.html`, and/or `tokens.css`.
2. Run `node build-cf.mjs`. It:
   - re-inlines `tokens.css` into both HTML files (between the `tokens:auto` markers),
   - extracts and scopes the lander's CSS under `#kdr-lp`,
   - absolutizes asset URLs against the GitHub Pages base,
   - writes the three `cf-*` files.
3. Commit **all** changed files together (sources + generated) so the CF embeds never drift from the page.

## ClickFunnels usage

- `cf-d4a-html.html` → paste into a Custom HTML/Code element.
- `cf-d4a-js.html` → paste into the footer / custom JS slot.
- `cf-d4a-combined.html` → standalone version for local render-testing or CF setups that execute inline scripts.

## Conventions

- Breakpoints: `600 / 760 / 860` px max-width (cannot be custom properties).
- The in-app demo UI keeps its own cool-gray neutrals (`--a900…--a100`) on purpose —
  product UI vs. marketing palette.
- In the embed, all accent-derived values (`--accent-ink`, `--btnA/B`, `--wash`, …) are
  computed from `--accent` via `color-mix()`/relative color; an industry theme is just
  one hex + one orb image in the `THEME` map.
