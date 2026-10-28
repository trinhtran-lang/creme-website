# CRÈME — Claude Code Workspace

This folder contains **inputs only** for building the fictional CRÈME croissant ordering website from scratch. It does **not** contain the approved V4 HTML, a prebuilt website, a video, or execution prompts.

## Project skill

The Claude Code skill is at:

`.claude/skills/creme-website/SKILL.md`

**macOS Finder hides folders beginning with a dot.** Press **Command + Shift + .** to show `.claude` (press again to hide). Do not rename `.claude`, or Claude Code might not discover the project skill.

## Workspace files

- `.claude/skills/creme-website/SKILL.md` — project workflow and phase restrictions.
- `docs/brand-kit.md` — identity, palette, typography, readability and hover behavior.
- `docs/website-brief.md` — page structure, UI behavior and ordering requirements.
- `docs/products.json` — eight products, prices, descriptions, ingredients, allergens.
- `docs/asset-manifest.md` — image paths and asset inventory.
- `docs/animation-integration.md` — requirements to read **only at the later animation stage**.
- `assets/hero/` — approved static hero image.
- `assets/products/` — approved photos for all eight products.
- `assets/video/` — empty at first; put an approved animation MP4 here later.

## Video tutorial workflow

1. **Stage 2:** Show `docs/` and `assets/`, then reveal `.claude` to show the skill.
2. **Stage 3:** Open this folder in Claude Code; type or paste your **build prompt separately in the Claude Code interface**. Build and check the static-hero website.
3. **Stage 4:** Create or select an AI motion video and save it to `assets/video/`.
4. **Stage 5:** Send a **separate animation-integration prompt** in Claude Code. The skill's phase gates keep the first build independent from video work.

Execution prompts belong in the separate video production planner, **not** in this workspace.

The approved CRÈME V4 website must remain outside this folder for independent comparison. This workspace intentionally contains no `index.html` or completed site code.
